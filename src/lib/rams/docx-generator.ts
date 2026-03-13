// =============================================================================
// RAMS Builder — Document Generator (dispatcher)
// =============================================================================
import { TemplateSlug, TemplateContent } from './types';
import { packDocument } from './docx-helpers';
import { buildTemplate01 } from './templates/template-01-standard';
import { buildTemplate02 } from './templates/template-02-simple-hml';
import { buildTemplate03 } from './templates/template-03-tier1-formal';
import { buildTemplate04 } from './templates/template-04-cdm';
import { buildTemplate05 } from './templates/template-05-narrative';
import { buildTemplate06 } from './templates/template-06-principal-contractor';
import { buildTemplate07 } from './templates/template-07-compact';
import { buildTemplate08 } from './templates/template-08-rpn';
import { buildTemplate09 } from './templates/template-09-checklist';
import { buildTemplate10 } from './templates/template-10-step-by-step';

const builders: Record<TemplateSlug, (content: any) => Promise<import('docx').Document>> = {
  'standard-5x5': buildTemplate01,
  'simple-hml': buildTemplate02,
  'tier1-formal': buildTemplate03,
  'cdm-compliant': buildTemplate04,
  'narrative': buildTemplate05,
  'principal-contractor': buildTemplate06,
  'compact': buildTemplate07,
  'rpn': buildTemplate08,
  'structured-checklist': buildTemplate09,
  'step-by-step': buildTemplate10,
};

/**
 * Generate a complete RAMS document as a Buffer.
 * @param templateSlug - which template to build
 * @param content - the structured JSON content from AI Call 2
 * @returns Buffer containing the .docx file
 */
export async function generateRamsDocument(
  templateSlug: TemplateSlug,
  content: TemplateContent
): Promise<Buffer> {
  const builder = builders[templateSlug];
  if (!builder) {
    throw new Error(`Unknown template slug: ${templateSlug}`);
  }
  const doc = await builder(content);
  return packDocument(doc);
}
