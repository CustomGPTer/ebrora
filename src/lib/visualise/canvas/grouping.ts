// =============================================================================
// Canvas grouping — group / ungroup helpers on VisualCanvasState.
//
// Groups are a layer over node ids — nodes inside a group move together.
// The Set of node ids inside a group is stored in `canvas.groups[groupId]`;
// each participating node also gets `canvas.nodes[nodeId].groupId` set so
// we can look up a node's group in O(1) from either direction.
//
// Selection model for groups (applied by the caller, not this module):
// clicking any node in a group selects ALL nodes in the group. Shift+click
// on a node in a group adds the whole group. Ctrl+click on a node in a
// group toggles the whole group. Ungroup breaks these associations.
// =============================================================================

import type { VisualCanvasState } from '@/lib/visualise/types';

type NodeEntry = VisualCanvasState['nodes'][string];

const DEFAULT_NODE: NodeEntry = { x: 0, y: 0, w: 1, h: 1, zIndex: 0 };

/**
 * Put the given ids into a new group. Existing group memberships are
 * overridden (a node can belong to only one group at a time).
 * Returns a new VisualCanvasState — input is not mutated.
 */
export function groupNodes(
  canvas: VisualCanvasState,
  nodeIds: string[],
  newGroupId: string,
): VisualCanvasState {
  if (nodeIds.length < 2) return canvas;

  const nextNodes: VisualCanvasState['nodes'] = { ...canvas.nodes };
  const nextGroups: VisualCanvasState['groups'] = { ...canvas.groups };

  // If any node already belongs to another group, remove it from that group first.
  for (const id of nodeIds) {
    const existing = nextNodes[id];
    if (existing?.groupId && existing.groupId !== newGroupId) {
      const oldGroup = nextGroups[existing.groupId];
      if (oldGroup) {
        const filtered = oldGroup.nodeIds.filter((n) => n !== id);
        if (filtered.length === 0) {
          delete nextGroups[existing.groupId];
        } else {
          nextGroups[existing.groupId] = { nodeIds: filtered };
        }
      }
    }
    const prev = existing ?? DEFAULT_NODE;
    nextNodes[id] = { ...prev, groupId: newGroupId };
  }

  // De-duplicate ids in the new group.
  nextGroups[newGroupId] = { nodeIds: Array.from(new Set(nodeIds)) };

  return { ...canvas, nodes: nextNodes, groups: nextGroups };
}

/**
 * Remove a single node from its group. If the group has only one member
 * remaining, also delete the empty-ish group.
 */
export function ungroupNode(
  canvas: VisualCanvasState,
  nodeId: string,
): VisualCanvasState {
  const node = canvas.nodes[nodeId];
  if (!node?.groupId) return canvas;

  const groupId = node.groupId;
  const group = canvas.groups[groupId];
  if (!group) return canvas;

  const remaining = group.nodeIds.filter((id) => id !== nodeId);
  const nextGroups = { ...canvas.groups };
  if (remaining.length <= 1) {
    // Also un-group the sole remaining node — one-node groups are meaningless.
    delete nextGroups[groupId];
    const nextNodes = { ...canvas.nodes };
    for (const id of group.nodeIds) {
      if (nextNodes[id]) {
        const { groupId: _gid, ...rest } = nextNodes[id];
        nextNodes[id] = rest as NodeEntry;
      }
    }
    return { ...canvas, nodes: nextNodes, groups: nextGroups };
  }

  nextGroups[groupId] = { nodeIds: remaining };
  const { groupId: _gid, ...rest } = node;
  return {
    ...canvas,
    nodes: { ...canvas.nodes, [nodeId]: rest as NodeEntry },
    groups: nextGroups,
  };
}

/**
 * Dissolve an entire group — remove the group entry and clear groupId on
 * all its members. Members keep their positions.
 */
export function dissolveGroup(
  canvas: VisualCanvasState,
  groupId: string,
): VisualCanvasState {
  const group = canvas.groups[groupId];
  if (!group) return canvas;

  const nextNodes: VisualCanvasState['nodes'] = { ...canvas.nodes };
  for (const id of group.nodeIds) {
    const n = nextNodes[id];
    if (!n) continue;
    const { groupId: _gid, ...rest } = n;
    nextNodes[id] = rest as NodeEntry;
  }
  const nextGroups = { ...canvas.groups };
  delete nextGroups[groupId];
  return { ...canvas, nodes: nextNodes, groups: nextGroups };
}

/**
 * Given a seed set of ids, expand to include every id that shares a group
 * with any member of the seed. Used when the user clicks a single node in
 * a group — selection expands to the whole group.
 */
export function expandToGroups(
  seedIds: Iterable<string>,
  canvas: VisualCanvasState,
): Set<string> {
  const result = new Set<string>();
  for (const id of seedIds) result.add(id);

  const seen = new Set<string>();
  for (const id of seedIds) {
    const g = canvas.nodes[id]?.groupId;
    if (!g || seen.has(g)) continue;
    seen.add(g);
    const group = canvas.groups[g];
    if (!group) continue;
    for (const member of group.nodeIds) result.add(member);
  }
  return result;
}
