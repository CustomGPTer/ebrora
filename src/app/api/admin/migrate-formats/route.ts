// ONE-TIME migration: align rams_formats slugs with frontend TemplateSlug values
// Hit GET /api/admin/migrate-formats once, then delete this file
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FORMATS = [
    { slug: 'standard-5x5',        name: 'Standard 5\u00d75',               scoring_type: '5x5', is_free: true,  order: 1  },
    { slug: 'simple-hml',          name: 'Simple H/M/L',                  scoring_type: 'HML', is_free: true,  order: 2  },
    { slug: 'tier1-formal',        name: 'Tier 1 Formal',                 scoring_type: '5x5', is_free: false, order: 3  },
    { slug: 'cdm-compliant',       name: 'CDM Compliant',                 scoring_type: '5x5', is_free: false, order: 4  },
    { slug: 'narrative',           name: 'Narrative',                     scoring_type: 'HML', is_free: false, order: 5  },
    { slug: 'principal-contractor',name: 'Principal Contractor',          scoring_type: '5x5', is_free: false, order: 6  },
    { slug: 'compact',             name: 'Compact',                       scoring_type: 'HML', is_free: false, order: 7  },
    { slug: 'rpn',                 name: 'RPN (Risk Priority Number)',    scoring_type: 'RPN', is_free: false, order: 8  },
    { slug: 'structured-checklist',name: 'Structured Checklist',          scoring_type: '5x5', is_free: false, order: 9  },
    { slug: 'step-by-step',        name: 'Step-by-Step Integrated',       scoring_type: 'HML', is_free: false, order: 10 },
  ];

export async function GET() {
    const results: string[] = [];

    for (const f of FORMATS) {
          await prisma.ramsFormat.upsert({
                  where: { slug: f.slug },
                  update: { name: f.name, scoring_type: f.scoring_type, is_free: f.is_free, enabled: true, order: f.order },
                  create: { slug: f.slug, name: f.name, scoring_type: f.scoring_type, is_free: f.is_free, enabled: true, order: f.order },
                });
          results.push(f.slug);
        }

    return NextResponse.json({ ok: true, upserted: results });
  }
