// =============================================================================
// Inline text-edit path resolver — maps (presetId, dataId, textIndex) tuples
// from the DOM to JSON paths inside `visual.data`.
//
// When the user double-clicks an SVG <text> node in the canvas editor:
//   1. We walk up to the enclosing `<g data-id>` → dataId.
//   2. Count <text>-tagged previous siblings inside that <g> → textIndex.
//   3. Call resolveTextEditTarget(presetId, dataId, textIndex, data).
//   4. If it returns non-null, mount <InlineTextEditor>.
//   5. On commit, applyTextEdit writes the new value into visual.data.
//
// Conditional-text presets (timeline, KPI cards) need the `data` arg to
// resolve textIndex correctly — e.g. timeline-horizontal renders
// [label, detail?, date?] so textIndex 1 maps to `detail` if detail is
// present, otherwise to `date`. The registry entries handle this per-preset.
//
// Numeric fields (chart-bar-vertical `bars[].value`) are typed
// `type: 'number'` so applyTextEdit parses the commit string back to a
// number and rejects the edit (returning the original data) on NaN.
//
// Presets whose text elements sit OUTSIDE their `<g data-id>` (e.g.
// venn-3circle's circle labels, con-risk-matrix-5x5's axis labels) or
// whose text is positional-only (chart-pie value labels) return null —
// the dblclick handler treats null as "this text isn't inline-editable".
// Users can still edit those fields via regeneration or preset swap for
// now; a future "Data" sidebar is the long-term home for non-inline edits.
//
// When Batch 8 presets ship, each sub-batch adds its entries here.
// =============================================================================

export type TextEditType = 'string' | 'number';

export interface TextEditTarget {
  /** Dot-path into visual.data, e.g. `steps.2.label` or `children.0.subtitle`. */
  path: string;
  /** Coercion hint for applyTextEdit on commit. Default 'string'. */
  type?: TextEditType;
  /** Max length enforced on commit (string) — derived from the preset's Zod. */
  maxLength?: number;
  /** Default text alignment for the InlineTextEditor overlay. */
  textAlign?: 'left' | 'center' | 'right';
}

/** Per-preset resolver signature. `data` lets conditional presets branch. */
type Resolver = (dataId: string, textIndex: number, data: unknown) => TextEditTarget | null;

// ── Helpers ──────────────────────────────────────────────────────────────
function matchIndexedId(dataId: string, prefix: string): number | null {
  const m = dataId.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/** Match dataIds of the form `lane-<li>-step-<si>`. Returns null if not matching. */
function matchLaneStepId(dataId: string): { laneIdx: number; stepIdx: number } | null {
  const m = dataId.match(/^lane-(\d+)-step-(\d+)$/);
  if (!m) return null;
  const laneIdx = parseInt(m[1], 10);
  const stepIdx = parseInt(m[2], 10);
  if (!Number.isFinite(laneIdx) || !Number.isFinite(stepIdx)) return null;
  return { laneIdx, stepIdx };
}

function getAt(obj: unknown, ...keys: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

// ── Registry ─────────────────────────────────────────────────────────────
// Each preset maps (dataId, textIndex, data) → TextEditTarget | null.
// Keep entries concise and readable — the logic is shape-specific, not
// something you can abstract without losing intent.

const PRESET_TEXT_PATHS: Record<string, Resolver> = {
  // ── Flow ────────────────────────────────────────────────────────────────
  // Batch 4a-i — flow-linear-{3,4,5}step consolidated into flow-linear.
  // maxLength matches SEQUENTIAL_LABEL_MAX (60) and SEQUENTIAL_DETAIL_MAX (120)
  // — the old 3/4-step resolvers used 40/120, the old 5-step resolver used
  // 32/100; all 3 schemas allow up to 60/120 since Batch 2a, so the narrower
  // inline-edit caps were outdated.
  'flow-linear': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    if (i === 0) return { path: `steps.${idx}.label`, maxLength: 60 };
    if (i === 1) return { path: `steps.${idx}.detail`, maxLength: 120 };
    return null;
  },

  // Batch 4a-ii-a — flow-linear-vertical-4step consolidated into flow-linear-vertical.
  // maxLength matches SEQUENTIAL_LABEL_MAX (60) / SEQUENTIAL_DETAIL_MAX (120) per Batch 2a.
  'flow-linear-vertical': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    if (i === 0) return { path: `steps.${idx}.label`, maxLength: 60 };
    if (i === 1) return { path: `steps.${idx}.detail`, maxLength: 120 };
    return null;
  },

  'flow-decision-yesno': (dataId) => {
    switch (dataId) {
      case 'entry':
        return { path: 'entry', maxLength: 40 };
      case 'decision':
        return { path: 'question', maxLength: 60 };
      case 'no-outcome':
        return { path: 'noOutcome', maxLength: 40 };
      case 'yes-outcome':
        return { path: 'yesOutcome', maxLength: 40 };
      default:
        return null;
    }
  },

  // Batch 8a-2
  'flow-branching-1to2': (dataId, i, data) => {
    if (dataId === 'source') {
      const src = getAt(data, 'source') as { label?: string; detail?: string } | undefined;
      const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 40 }];
      if (src?.detail != null) fields.push({ name: 'detail', max: 120 });
      const f = fields[i];
      return f ? { path: `source.${f.name}`, maxLength: f.max } : null;
    }
    const idx = matchIndexedId(dataId, 'branch');
    if (idx === null) return null;
    const b = getAt(data, 'branches', idx) as { label?: string; detail?: string } | undefined;
    const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 40 }];
    if (b?.detail != null) fields.push({ name: 'detail', max: 120 });
    const f = fields[i];
    return f ? { path: `branches.${idx}.${f.name}`, maxLength: f.max } : null;
  },

  'flow-swimlane-2lane': (dataId, i) => {
    const laneStep = matchLaneStepId(dataId);
    if (laneStep) {
      if (i === 0) {
        return { path: `lanes.${laneStep.laneIdx}.steps.${laneStep.stepIdx}.label`, maxLength: 32 };
      }
      return null;
    }
    const laneIdx = matchIndexedId(dataId, 'lane');
    if (laneIdx === null) return null;
    if (i === 0) return { path: `lanes.${laneIdx}.name`, maxLength: 28 };
    return null;
  },

  'flow-swimlane-3lane': (dataId, i) => {
    const laneStep = matchLaneStepId(dataId);
    if (laneStep) {
      if (i === 0) {
        return { path: `lanes.${laneStep.laneIdx}.steps.${laneStep.stepIdx}.label`, maxLength: 28 };
      }
      return null;
    }
    const laneIdx = matchIndexedId(dataId, 'lane');
    if (laneIdx === null) return null;
    if (i === 0) return { path: `lanes.${laneIdx}.name`, maxLength: 24 };
    return null;
  },

  'flow-sipoc': (dataId, i) => {
    if (/^col-/.test(dataId)) return null;
    const m = dataId.match(/^([sipoc])-(\d+)$/);
    if (!m) return null;
    const letter = m[1];
    const idx = parseInt(m[2], 10);
    if (!Number.isFinite(idx)) return null;
    const fieldMap: Record<string, string> = {
      s: 'suppliers',
      i: 'inputs',
      p: 'process',
      o: 'outputs',
      c: 'customers',
    };
    const field = fieldMap[letter];
    if (!field) return null;
    if (i === 0) return { path: `${field}.${idx}`, maxLength: 40, textAlign: 'left' };
    return null;
  },

  // Batch 8a-3
  'flow-multi-gateway': (dataId, i) => {
    if (dataId === 'entry') {
      if (i === 0) return { path: 'entry', maxLength: 40 };
      return null;
    }
    if (dataId === 'decision') {
      if (i === 0) return { path: 'decision', maxLength: 60 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'branch');
    if (idx === null) return null;
    // DOM order inside each branch <g>: condition (on the pill), outcome (to the right).
    if (i === 0) return { path: `branches.${idx}.condition`, maxLength: 24 };
    if (i === 1) return { path: `branches.${idx}.outcome`, maxLength: 32, textAlign: 'left' };
    return null;
  },

  // ── Process ─────────────────────────────────────────────────────────────
  // Batch 4a-ii-c-i — process-numbered-6step consolidated into process-numbered.
  // maxLength aligns with SEQUENTIAL_LABEL_MAX (60) / SEQUENTIAL_DETAIL_MAX (120) —
  // the old resolver used 32/80 matching a now-retired narrower schema.
  'process-numbered': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    const step = getAt(data, 'steps', idx) as
      | { label?: string; detail?: string }
      | undefined;
    // DOM order inside each step <g>: badge-number <text> (positional),
    // label, optional detail.
    if (i === 0) return null; // number badge text — not editable
    if (i === 1) return { path: `steps.${idx}.label`, maxLength: 60 };
    if (i === 2 && step?.detail != null) return { path: `steps.${idx}.detail`, maxLength: 120 };
    return null;
  },

  // Batch 4a-ii-b — process-circular-4step / -6step consolidated into process-circular.
  // maxLength aligns with SEQUENTIAL_LABEL_MAX (60) / SEQUENTIAL_DETAIL_MAX (120) —
  // the old per-count resolvers used tighter caps (22/40 and 20/28) which mirrored
  // their now-retired schemas; the consolidated schema matches every other
  // sequential/cyclical preset.
  'process-circular': (dataId, i, data) => {
    if (dataId === 'centre') {
      if (i === 0) return { path: 'centreLabel', maxLength: 20 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    const step = getAt(data, 'steps', idx) as
      | { label?: string; detail?: string }
      | undefined;
    if (i === 0) return { path: `steps.${idx}.label`, maxLength: 60 };
    if (i === 1 && step?.detail != null) return { path: `steps.${idx}.detail`, maxLength: 120 };
    return null;
  },

  'process-pdca': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'quadrant');
    if (idx === null) return null;
    const q = getAt(data, 'quadrants', idx) as
      | { title?: string; items?: string[] }
      | undefined;
    // DOM order inside each quadrant <g>: title <text>, then each bullet
    // item <text> in order. textIndex 0 → title; textIndex N≥1 → items[N-1].
    if (i === 0) return { path: `quadrants.${idx}.title`, maxLength: 14, textAlign: 'left' };
    const itemIdx = i - 1;
    const itemsLen = Array.isArray(q?.items) ? (q as { items: string[] }).items.length : 0;
    if (itemIdx < 0 || itemIdx >= Math.min(4, itemsLen)) return null;
    return { path: `quadrants.${idx}.items.${itemIdx}`, maxLength: 40, textAlign: 'left' };
  },

  // Batch 8b
  'process-dmaic': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'stage');
    if (idx === null) return null;
    // DOM order inside each stage <g>: title <text>. Summaries live OUTSIDE
    // the <g data-id> (drawn in a separate loop so the chevron's fill
    // doesn't clip them) — so summary is not inline-editable. Users can
    // regenerate or cycle preset to rewrite them.
    if (i === 0) return { path: `stages.${idx}.title`, maxLength: 14 };
    return null;
  },

  'process-stages-4phase': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'phase');
    if (idx === null) return null;
    const p = getAt(data, 'phases', idx) as
      | { title?: string; bullets?: string[] }
      | undefined;
    // DOM order inside each phase <g>: phase-number <text> (positional,
    // derived from index — NOT editable), title <text>, then bullets.
    if (i === 0) return null; // phase number text
    if (i === 1) return { path: `phases.${idx}.title`, maxLength: 20, textAlign: 'right' };
    const bulletIdx = i - 2;
    const bulletsLen = Array.isArray(p?.bullets) ? (p as { bullets: string[] }).bullets.length : 0;
    if (bulletIdx < 0 || bulletIdx >= Math.min(3, bulletsLen)) return null;
    return { path: `phases.${idx}.bullets.${bulletIdx}`, maxLength: 36, textAlign: 'left' };
  },

  // Batch 4a-ii-c-ii — timeline-horizontal-5event / -8event consolidated into
  // timeline-horizontal; timeline-vertical-5event consolidated into timeline-vertical.
  // maxLength values align with SEQUENTIAL_LABEL_MAX (60) / SEQUENTIAL_DETAIL_MAX (120);
  // the old per-count resolvers used tighter caps matching their now-retired schemas.
  'timeline-horizontal': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'event');
    if (idx === null) return null;
    const ev = getAt(data, 'events', idx) as
      | { label?: string; detail?: string; date?: string }
      | undefined;
    if (!ev) return null;
    // DOM order: label (always), detail (if present), date (if present).
    const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 60 }];
    if (ev.detail != null) fields.push({ name: 'detail', max: 120 });
    if (ev.date != null) fields.push({ name: 'date', max: 20 });
    const f = fields[i];
    if (!f) return null;
    return { path: `events.${idx}.${f.name}`, maxLength: f.max };
  },

  'timeline-vertical': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'event');
    if (idx === null) return null;
    const ev = getAt(data, 'events', idx) as
      | { label?: string; detail?: string; date?: string }
      | undefined;
    if (!ev) return null;
    // DOM order inside each event <g>: label, date (if present, on pill),
    // detail (if present). Axis-side duplicate date text lives OUTSIDE the
    // event <g> so it isn't counted here.
    const fields: Array<{ name: string; max: number; textAlign?: 'left' | 'center' | 'right' }> = [
      { name: 'label', max: 60, textAlign: 'left' },
    ];
    if (ev.date != null) fields.push({ name: 'date', max: 20, textAlign: 'center' });
    if (ev.detail != null) fields.push({ name: 'detail', max: 120, textAlign: 'left' });
    const f = fields[i];
    if (!f) return null;
    return { path: `events.${idx}.${f.name}`, maxLength: f.max, textAlign: f.textAlign };
  },

  'timeline-gantt-lite': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'task');
    if (idx === null) return null;
    // DOM order: label (left gutter). Bar itself has no text.
    // Numeric start/end values are not inline-editable — they need a
    // numeric picker that respects ordering, out of scope for 6c. Users
    // adjust via regenerate / preset swap.
    if (i === 0) return { path: `tasks.${idx}.label`, maxLength: 28, textAlign: 'right' };
    return null;
  },

  // Batch 8b-2
  'timeline-roadmap-quarters': (dataId, i, data) => {
    // Two id shapes: `quarter-<ci>` (column header) and
    // `quarter-<ci>-item-<ii>` (item card).
    const itemMatch = dataId.match(/^quarter-(\d+)-item-(\d+)$/);
    if (itemMatch) {
      const ci = parseInt(itemMatch[1], 10);
      const ii = parseInt(itemMatch[2], 10);
      if (!Number.isFinite(ci) || !Number.isFinite(ii)) return null;
      const q = getAt(data, 'quarters', ci) as { items?: Array<{ tag?: string }> } | undefined;
      const hasTag = q?.items?.[ii]?.tag != null;
      // DOM order inside an item <g>: (tag text if present), label.
      if (hasTag) {
        if (i === 0) return { path: `quarters.${ci}.items.${ii}.tag`, maxLength: 10 };
        if (i === 1) return { path: `quarters.${ci}.items.${ii}.label`, maxLength: 32, textAlign: 'left' };
        return null;
      }
      if (i === 0) return { path: `quarters.${ci}.items.${ii}.label`, maxLength: 32, textAlign: 'left' };
      return null;
    }
    const ci = matchIndexedId(dataId, 'quarter');
    if (ci === null) return null;
    if (i === 0) return { path: `quarters.${ci}.name`, maxLength: 12 };
    return null;
  },

  'timeline-milestones': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'milestone');
    if (idx === null) return null;
    const m = getAt(data, 'milestones', idx) as
      | { title?: string; subtitle?: string; when?: string }
      | undefined;
    if (!m) return null;
    // DOM order inside each milestone <g>: flag title, (when if present), (subtitle if present).
    const fields: Array<{ name: string; max: number }> = [{ name: 'title', max: 24 }];
    if (m.when != null) fields.push({ name: 'when', max: 16 });
    if (m.subtitle != null) fields.push({ name: 'subtitle', max: 40 });
    const f = fields[i];
    if (!f) return null;
    return { path: `milestones.${idx}.${f.name}`, maxLength: f.max };
  },

  'hierarchy-org-3level': (dataId, i, data) => {
    if (dataId === 'top') {
      const top = getAt(data, 'top') as { subtitle?: string } | undefined;
      const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 22 }];
      if (top?.subtitle != null) fields.push({ name: 'subtitle', max: 28 });
      const f = fields[i];
      return f ? { path: `top.${f.name}`, maxLength: f.max } : null;
    }
    const midIdx = matchIndexedId(dataId, 'middle');
    if (midIdx !== null) {
      const m = getAt(data, 'middle', midIdx) as { subtitle?: string } | undefined;
      const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 22 }];
      if (m?.subtitle != null) fields.push({ name: 'subtitle', max: 28 });
      const f = fields[i];
      return f ? { path: `middle.${midIdx}.${f.name}`, maxLength: f.max } : null;
    }
    const botIdx = matchIndexedId(dataId, 'bottom');
    if (botIdx !== null) {
      const b = getAt(data, 'bottom', botIdx) as { subtitle?: string } | undefined;
      const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 22 }];
      if (b?.subtitle != null) fields.push({ name: 'subtitle', max: 28 });
      const f = fields[i];
      return f ? { path: `bottom.${botIdx}.${f.name}`, maxLength: f.max } : null;
    }
    return null;
  },

  'hierarchy-tree-generic': (dataId, i) => {
    if (dataId === 'root') {
      if (i === 0) return { path: 'root.label', maxLength: 24 };
      return null;
    }
    const leafMatch = dataId.match(/^branch-(\d+)-leaf-(\d+)$/);
    if (leafMatch) {
      const bi = parseInt(leafMatch[1], 10);
      const li = parseInt(leafMatch[2], 10);
      if (!Number.isFinite(bi) || !Number.isFinite(li)) return null;
      if (i === 0) return { path: `branches.${bi}.children.${li}.label`, maxLength: 20 };
      return null;
    }
    const branchIdx = matchIndexedId(dataId, 'branch');
    if (branchIdx === null) return null;
    if (i === 0) return { path: `branches.${branchIdx}.label`, maxLength: 22 };
    return null;
  },

  // Batch 8c
  'hierarchy-mindmap-centre': (dataId, i, data) => {
    if (dataId === 'centre') {
      if (i === 0) return { path: 'centre.label', maxLength: 20 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'spoke');
    if (idx === null) return null;
    const spoke = getAt(data, 'spokes', idx) as { detail?: string } | undefined;
    // DOM order inside each spoke <g>: label, (optional detail).
    if (i === 0) return { path: `spokes.${idx}.label`, maxLength: 22 };
    if (i === 1 && spoke?.detail != null) return { path: `spokes.${idx}.detail`, maxLength: 36 };
    return null;
  },

  'hierarchy-pyramid-5tier': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'tier');
    if (idx === null) return null;
    if (i === 0) return { path: `tiers.${idx}.label`, maxLength: 32 };
    if (i === 1) return { path: `tiers.${idx}.detail`, maxLength: 60 };
    return null;
  },

  'venn-2circle': (dataId, i, data) => {
    // Each of the three <g data-id> (left / right / overlap) contains:
    // - left: label text (above), then up to 4 item texts (on the side).
    // - right: same shape.
    // - overlap: up to 4 item texts (no label).
    // DOM order inside left/right: label first, then items[0..3].
    // DOM order inside overlap: items[0..3].
    if (dataId === 'overlap') {
      const itemIdx = i;
      const overlap = getAt(data, 'overlap') as string[] | undefined;
      if (!Array.isArray(overlap)) return null;
      if (itemIdx < 0 || itemIdx >= Math.min(4, overlap.length)) return null;
      return { path: `overlap.${itemIdx}`, maxLength: 24 };
    }
    if (dataId === 'left' || dataId === 'right') {
      const side = getAt(data, dataId) as { items?: string[] } | undefined;
      if (i === 0) return { path: `${dataId}.label`, maxLength: 20 };
      const itemIdx = i - 1;
      const items = side?.items;
      if (!Array.isArray(items)) return null;
      if (itemIdx < 0 || itemIdx >= Math.min(4, items.length)) return null;
      return { path: `${dataId}.items.${itemIdx}`, maxLength: 28 };
    }
    return null;
  },

  'euler-nested': (dataId, i) => {
    // Each set's <g> contains: label <text>, then (optional) first-item <text>.
    // Only label is inline-editable — first-item is a single summary line,
    // derived from items[0] and presented as a helper, not the primary edit
    // target. Use regenerate / canvas workflow to replace the items array.
    if (dataId !== 'outer' && dataId !== 'middle' && dataId !== 'inner') return null;
    if (i === 0) {
      const maxLen = 26;
      return { path: `${dataId}.label`, maxLength: maxLen, textAlign: dataId === 'inner' ? 'center' : 'left' };
    }
    return null;
  },

  'network-hub-spoke-6': (dataId, i) => {
    if (dataId === 'hub') {
      if (i === 0) return { path: 'hub.label', maxLength: 18 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'spoke');
    if (idx === null) return null;
    if (i === 0) return { path: `spokes.${idx}.label`, maxLength: 18 };
    return null;
  },

  // Batch 8c-2
  'fishbone-ishikawa-6bone': (dataId, i) => {
    if (dataId === 'effect') {
      if (i === 0) return { path: 'effect', maxLength: 32 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'bone');
    if (idx === null) return null;
    // DOM order inside each bone <g>:
    //   [0] category label at the tip
    //   [1..N] cause twig labels, in array order
    if (i === 0) return { path: `bones.${idx}.category`, maxLength: 18 };
    const causeIdx = i - 1;
    if (causeIdx < 0 || causeIdx >= 3) return null;
    return { path: `bones.${idx}.causes.${causeIdx}`, maxLength: 24, textAlign: 'right' };
  },

  'concept-map': (dataId, i) => {
    // Only concept nodes are inline-editable. Link labels sit outside their
    // own <g data-id> (they live inside per-link decorative groups without
    // data-ids), so they fall through to null — edit via regenerate for now.
    const idx = matchIndexedId(dataId, 'concept');
    if (idx === null) return null;
    if (i === 0) return { path: `concepts.${idx}.label`, maxLength: 24 };
    return null;
  },

  // Batch 4a-ii-b — cycle-4step / cycle-6step consolidated into cycle-steps.
  // maxLength aligns with SEQUENTIAL_LABEL_MAX / SEQUENTIAL_DETAIL_MAX — the
  // old per-count resolvers used narrower caps matching their retired schemas.
  'cycle-steps': (dataId, i, data) => {
    if (dataId === 'centre') {
      if (i === 0) return { path: 'centreLabel', maxLength: 24 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    const step = getAt(data, 'steps', idx) as
      | { label?: string; detail?: string }
      | undefined;
    if (i === 0) return { path: `steps.${idx}.label`, maxLength: 60 };
    if (i === 1 && step?.detail != null) return { path: `steps.${idx}.detail`, maxLength: 120 };
    return null;
  },

  'cycle-feedback-loop': (dataId, i, data) => {
    if (dataId === 'feedback') {
      if (i === 0) return { path: 'feedback.label', maxLength: 28 };
      return null;
    }
    const idx = matchIndexedId(dataId, 'step');
    if (idx === null) return null;
    const step = getAt(data, 'steps', idx) as
      | { label?: string; detail?: string }
      | undefined;
    // DOM order inside each step <g>: label, (optional detail).
    if (i === 0) return { path: `steps.${idx}.label`, maxLength: 20 };
    if (i === 1 && step?.detail != null) return { path: `steps.${idx}.detail`, maxLength: 40 };
    return null;
  },

  // Batch 8d — comparison
  'side-by-side-2col': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'col');
    if (idx === null) return null;
    const col = getAt(data, 'columns', idx) as { items?: string[] } | undefined;
    // DOM order inside each column <g>: title, then items[0..N].
    if (i === 0) return { path: `columns.${idx}.title`, maxLength: 28 };
    const itemIdx = i - 1;
    const items = col?.items;
    if (!Array.isArray(items)) return null;
    if (itemIdx < 0 || itemIdx >= Math.min(6, items.length)) return null;
    return { path: `columns.${idx}.items.${itemIdx}`, maxLength: 60, textAlign: 'left' };
  },

  'pros-cons': (dataId, i, data) => {
    if (dataId !== 'pros' && dataId !== 'cons') return null;
    // DOM order inside each column <g>: header label "Pros"/"Cons"
    // (textIndex 0, static — skipped), then items[0..N-1] at textIndex 1..N.
    // Tick/cross icons are <path>/<line>, not <text>, so they don't shift
    // the count.
    if (i === 0) return null;
    const items = getAt(data, dataId) as string[] | undefined;
    if (!Array.isArray(items)) return null;
    const itemIdx = i - 1;
    if (itemIdx < 0 || itemIdx >= Math.min(6, items.length)) return null;
    return { path: `${dataId}.${itemIdx}`, maxLength: 60, textAlign: 'left' };
  },

  'matrix-3col': (dataId, i, data) => {
    const colIdx = matchIndexedId(dataId, 'col');
    if (colIdx !== null) {
      if (i === 0) return { path: `columns.${colIdx}.name`, maxLength: 18 };
      return null;
    }
    const rowIdx = matchIndexedId(dataId, 'row');
    if (rowIdx === null) return null;
    const row = getAt(data, 'rows', rowIdx) as { cells?: string[] } | undefined;
    // DOM order inside each row <g>: row label (textIndex 0), then 3 cells.
    if (i === 0) return { path: `rows.${rowIdx}.label`, maxLength: 22, textAlign: 'left' };
    const cellIdx = i - 1;
    const cells = row?.cells;
    if (!Array.isArray(cells)) return null;
    if (cellIdx < 0 || cellIdx >= 3) return null;
    return { path: `rows.${rowIdx}.cells.${cellIdx}`, maxLength: 22 };
  },

  'matrix-4col': (dataId, i, data) => {
    const colIdx = matchIndexedId(dataId, 'col');
    if (colIdx !== null) {
      if (i === 0) return { path: `columns.${colIdx}.name`, maxLength: 14 };
      return null;
    }
    const rowIdx = matchIndexedId(dataId, 'row');
    if (rowIdx === null) return null;
    const row = getAt(data, 'rows', rowIdx) as { cells?: string[] } | undefined;
    if (i === 0) return { path: `rows.${rowIdx}.label`, maxLength: 22, textAlign: 'left' };
    const cellIdx = i - 1;
    const cells = row?.cells;
    if (!Array.isArray(cells)) return null;
    if (cellIdx < 0 || cellIdx >= 4) return null;
    return { path: `rows.${rowIdx}.cells.${cellIdx}`, maxLength: 18 };
  },

  'vs-card': (dataId, i, data) => {
    if (dataId !== 'left' && dataId !== 'right') return null;
    const side = getAt(data, dataId) as
      | { subtitle?: string; stats?: Array<{ label: string; value: string }> }
      | undefined;
    // DOM order inside each side <g>: title, (optional subtitle),
    // then for each stat: stat label, stat value (2 texts per stat).
    const fields: Array<{ path: string; max: number }> = [
      { path: `${dataId}.title`, max: 22 },
    ];
    if (side?.subtitle != null) fields.push({ path: `${dataId}.subtitle`, max: 40 });
    const stats = side?.stats ?? [];
    for (let si = 0; si < Math.min(3, stats.length); si++) {
      fields.push({ path: `${dataId}.stats.${si}.label`, max: 18 });
      fields.push({ path: `${dataId}.stats.${si}.value`, max: 14 });
    }
    const f = fields[i];
    if (!f) return null;
    return { path: f.path, maxLength: f.max };
  },

  // Batch 8d-2 — comparison + positioning
  'table-clean': (dataId, i, data) => {
    const colIdx = matchIndexedId(dataId, 'col');
    if (colIdx !== null) {
      if (i === 0) return { path: `columns.${colIdx}.name`, maxLength: 18 };
      return null;
    }
    const rowIdx = matchIndexedId(dataId, 'row');
    if (rowIdx === null) return null;
    const row = getAt(data, 'rows', rowIdx) as { cells?: string[] } | undefined;
    // DOM order inside each row <g>: cells[0..N-1] — no row label gutter.
    const cells = row?.cells;
    if (!Array.isArray(cells)) return null;
    if (i < 0 || i >= cells.length) return null;
    return { path: `rows.${rowIdx}.cells.${i}`, maxLength: 22 };
  },

  'quadrant-2x2-generic': (dataId, i, data) => {
    const map: Record<string, number | null> = {
      'q-tl': 0,
      'q-tr': 1,
      'q-bl': 2,
      'q-br': 3,
    };
    const qi = map[dataId];
    if (qi == null) return null;
    const q = getAt(data, 'quadrants', qi) as { items?: string[] } | undefined;
    // DOM order inside each quadrant <g>: label (textIndex 0), then items[0..N-1].
    if (i === 0) return { path: `quadrants.${qi}.label`, maxLength: 22, textAlign: 'left' };
    const itemIdx = i - 1;
    const items = q?.items;
    if (!Array.isArray(items)) return null;
    if (itemIdx < 0 || itemIdx >= Math.min(5, items.length)) return null;
    return { path: `quadrants.${qi}.items.${itemIdx}`, maxLength: 40, textAlign: 'left' };
  },

  'quadrant-bcg': (dataId, i) => {
    // Labels are fixed ("Stars", "Question Marks", etc.) — textIndex 0 skipped.
    // Only item bullets are editable. Resolver key uses dataId → array field.
    const map: Record<string, string> = {
      stars: 'stars',
      'question-marks': 'questionMarks',
      'cash-cows': 'cashCows',
      dogs: 'dogs',
    };
    const field = map[dataId];
    if (!field) return null;
    if (i === 0) return null; // quadrant label text, static
    const itemIdx = i - 1;
    if (itemIdx < 0 || itemIdx >= 5) return null;
    return { path: `${field}.${itemIdx}`, maxLength: 32, textAlign: 'left' };
  },

  'quadrant-impact-effort': (dataId, i) => {
    const map: Record<string, string> = {
      'quick-wins': 'quickWins',
      'major-projects': 'majorProjects',
      'fill-ins': 'fillIns',
      'thankless-tasks': 'thanklessTasks',
    };
    const field = map[dataId];
    if (!field) return null;
    if (i === 0) return null; // static quadrant label
    const itemIdx = i - 1;
    if (itemIdx < 0 || itemIdx >= 5) return null;
    return { path: `${field}.${itemIdx}`, maxLength: 32, textAlign: 'left' };
  },

  'perceptual-map': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'item');
    if (idx === null) return null;
    // Only the label is editable inline; coordinates (x, y) need a numeric
    // input with drag support and are out of scope for inline edit.
    if (i === 0) return { path: `items.${idx}.label`, maxLength: 20 };
    return null;
  },

  // ── Timeline ────────────────────────────────────────────────────────────
  // Batch 4a-ii-c-ii — timeline-horizontal-5event removed; consolidated
  // timeline-horizontal resolver is above in the Batch 4a-ii-c-ii block.

  // ── Hierarchy ───────────────────────────────────────────────────────────
  'hierarchy-org-simple': (dataId, i, data) => {
    if (dataId === 'root') {
      const root = getAt(data, 'root') as { label?: string; subtitle?: string } | undefined;
      const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 18 }];
      if (root?.subtitle != null) fields.push({ name: 'subtitle', max: 22 });
      const f = fields[i];
      if (!f) return null;
      return { path: `root.${f.name}`, maxLength: f.max };
    }
    const idx = matchIndexedId(dataId, 'child');
    if (idx === null) return null;
    const ch = getAt(data, 'children', idx) as { label?: string; subtitle?: string } | undefined;
    const fields: Array<{ name: string; max: number }> = [{ name: 'label', max: 18 }];
    if (ch?.subtitle != null) fields.push({ name: 'subtitle', max: 22 });
    const f = fields[i];
    if (!f) return null;
    return { path: `children.${idx}.${f.name}`, maxLength: f.max };
  },

  'hierarchy-pyramid-4tier': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'tier');
    if (idx === null) return null;
    if (i === 0) return { path: `tiers.${idx}.label`, maxLength: 28 };
    if (i === 1) return { path: `tiers.${idx}.detail`, maxLength: 44 };
    return null;
  },

  // ── Cycle ───────────────────────────────────────────────────────────────
  // Batch 4a-ii-b — cycle-4step removed; cycle-steps resolver above handles
  // both old counts after silent preset-ID migration.

  // ── Positioning ─────────────────────────────────────────────────────────
  'quadrant-swot': (dataId, i) => {
    const arrayField =
      dataId === 'strengths'
        ? 'strengths'
        : dataId === 'weaknesses'
          ? 'weaknesses'
          : dataId === 'opportunities'
            ? 'opportunities'
            : dataId === 'threats'
              ? 'threats'
              : null;
    if (!arrayField) return null;
    if (i === 0) return null;
    const itemIdx = i - 1;
    if (itemIdx > 4) return null;
    return { path: `${arrayField}.${itemIdx}`, maxLength: 60, textAlign: 'left' };
  },

  // ── Relationships ───────────────────────────────────────────────────────
  'venn-3circle': () => null,

  // ── Charts ──────────────────────────────────────────────────────────────
  'chart-bar-vertical': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'bar');
    if (idx === null) return null;
    if (i === 0) return { path: `bars.${idx}.value`, type: 'number' };
    if (i === 1) return { path: `bars.${idx}.label`, maxLength: 14 };
    return null;
  },

  'chart-pie': (dataId) => {
    const idx = matchIndexedId(dataId, 'slice');
    if (idx === null) return null;
    return { path: `slices.${idx}.label`, maxLength: 20 };
  },

  'kpi-card-grid-3': (dataId, i, data) => {
    const idx = matchIndexedId(dataId, 'kpi');
    if (idx === null) return null;
    const card = getAt(data, 'cards', idx) as
      | { label?: string; value?: string | number; unit?: string; delta?: string }
      | undefined;
    if (!card) return null;
    const fields: Array<{ name: string; max?: number; type?: TextEditType }> = [
      { name: 'label', max: 24 },
      { name: 'value', type: typeof card.value === 'number' ? 'number' : 'string', max: 12 },
    ];
    if (card.delta != null) fields.push({ name: 'delta', max: 12 });
    const f = fields[i];
    if (!f) return null;
    return { path: `cards.${idx}.${f.name}`, maxLength: f.max, type: f.type };
  },

  // ── Construction ────────────────────────────────────────────────────────
  'con-cdm-hierarchy': (dataId) => {
    switch (dataId) {
      case 'client':
        return { path: 'client', maxLength: 40 };
      case 'principal-designer':
        return { path: 'principalDesigner', maxLength: 40 };
      case 'principal-contractor':
        return { path: 'principalContractor', maxLength: 40 };
      case 'designers':
        return { path: 'designers', maxLength: 40 };
      case 'contractors':
        return { path: 'contractors', maxLength: 40 };
      case 'workers':
        return { path: 'workers', maxLength: 40 };
      default:
        return null;
    }
  },

  'con-hierarchy-of-controls': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'level');
    if (idx === null) return null;
    if (i === 0) return { path: `levels.${idx}.name`, maxLength: 16 };
    if (i === 1) return { path: `levels.${idx}.detail`, maxLength: 60 };
    return null;
  },

  'con-raci-matrix-4col': (dataId, i) => {
    const idx = matchIndexedId(dataId, 'task');
    if (idx === null) return null;
    if (i === 0) return { path: `tasks.${idx}.name`, maxLength: 40, textAlign: 'left' };
    return null;
  },

  'con-risk-matrix-5x5': () => null,
};

/**
 * Resolve a dblclick on an SVG <text> to a data path, or null if the
 * target isn't inline-editable under the current preset.
 */
export function resolveTextEditTarget(
  presetId: string,
  dataId: string,
  textIndex: number,
  data: unknown,
): TextEditTarget | null {
  const resolver = PRESET_TEXT_PATHS[presetId];
  if (!resolver) return null;
  return resolver(dataId, textIndex, data);
}

/**
 * Apply a committed text value to a (shallow-cloned) copy of `data` at the
 * resolver's path. Returns the new data on success, or the original data
 * unchanged if the path is invalid or a numeric coercion fails.
 */
export function applyTextEdit(
  data: unknown,
  target: TextEditTarget,
  nextRaw: string,
): unknown {
  let nextValue: unknown = nextRaw;
  if (target.type === 'number') {
    const n = parseFloat(nextRaw.replace(/[, ]/g, ''));
    if (!Number.isFinite(n)) return data;
    nextValue = n;
  } else {
    let s = nextRaw;
    if (target.maxLength != null && s.length > target.maxLength) {
      s = s.slice(0, target.maxLength);
    }
    nextValue = s;
  }

  const parts = target.path.split('.');
  if (parts.length === 0) return data;

  return setDeep(data, parts, nextValue);
}

function setDeep(node: unknown, parts: string[], value: unknown): unknown {
  if (parts.length === 0) return value;
  const [head, ...rest] = parts;

  const asIdx = /^\d+$/.test(head) ? parseInt(head, 10) : null;

  if (asIdx !== null) {
    if (!Array.isArray(node)) return node;
    if (asIdx < 0 || asIdx >= node.length) return node;
    const copy = node.slice();
    copy[asIdx] = setDeep(copy[asIdx], rest, value);
    return copy;
  }

  if (node == null || typeof node !== 'object' || Array.isArray(node)) return node;
  const obj = node as Record<string, unknown>;
  const copy: Record<string, unknown> = { ...obj };
  copy[head] = setDeep(obj[head], rest, value);
  return copy;
}
