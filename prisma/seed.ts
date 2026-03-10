import { PrismaClient, PromptType, FieldType, QuestionGroup, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Clear existing data (optional - remove if you want to preserve data)
    // await prisma.generation.deleteMany({});
    // await prisma.question.deleteMany({});
    // await prisma.ramsFormat.deleteMany({});
    // await prisma.systemPrompt.deleteMany({});

    // ============================================
    // 1. Create RAMS Formats (10 formats)
    // ============================================
    console.log('Creating RAMS formats...');

    const formats = await Promise.all([
      prisma.ramsFormat.upsert({
        where: { slug: 'standard-5x5' },
        update: {},
        create: {
          name: 'Standard 5×5',
          slug: 'standard-5x5',
          scoring_type: '5x5',
          description: 'Standard 5×5 risk matrix for basic hazard assessment',
          is_free: true,
          enabled: true,
          order: 1,
          columns: {
            headers: ['1', '2', '3', '4', '5'],
            labels: ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
          },
          sections: {
            likelihood: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
            consequence: ['Negligible', 'Minor', 'Moderate', 'Severe', 'Catastrophic'],
          },
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'hml-simple' },
        update: {},
        create: {
          name: 'H/M/L Simple',
          slug: 'hml-simple',
          scoring_type: 'HML',
          description: 'High, Medium, Low simplified risk assessment',
          is_free: true,
          enabled: true,
          order: 2,
          columns: {
            headers: ['High', 'Medium', 'Low'],
          },
          sections: {
            risk_levels: ['High', 'Medium', 'Low'],
          },
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'tier-1-formal' },
        update: {},
        create: {
          name: 'Tier 1 Formal',
          slug: 'tier-1-formal',
          scoring_type: '5x5',
          description: 'Formal tier 1 risk assessment format',
          is_free: false,
          enabled: true,
          order: 3,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'cdm-compliant' },
        update: {},
        create: {
          name: 'CDM Compliant',
          slug: 'cdm-compliant',
          scoring_type: '5x5',
          description: 'Risk assessment compliant with CDM regulations',
          is_free: false,
          enabled: true,
          order: 4,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'civils-infrastructure' },
        update: {},
        create: {
          name: 'Civils & Infrastructure',
          slug: 'civils-infrastructure',
          scoring_type: '5x5',
          description: 'Specialized format for civil engineering and infrastructure projects',
          is_free: false,
          enabled: true,
          order: 5,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'narrative' },
        update: {},
        create: {
          name: 'Narrative',
          slug: 'narrative',
          scoring_type: 'HML',
          description: 'Narrative-based risk assessment with detailed descriptions',
          is_free: false,
          enabled: true,
          order: 6,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'compact' },
        update: {},
        create: {
          name: 'Compact',
          slug: 'compact',
          scoring_type: 'HML',
          description: 'Compact one-page risk assessment format',
          is_free: false,
          enabled: true,
          order: 7,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'me-works' },
        update: {},
        create: {
          name: 'M&E Works',
          slug: 'me-works',
          scoring_type: '5x5',
          description: 'Specialized format for mechanical and electrical installations',
          is_free: false,
          enabled: true,
          order: 8,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'rpn' },
        update: {},
        create: {
          name: 'RPN (Risk Priority Number)',
          slug: 'rpn',
          scoring_type: 'RPN',
          description: 'Risk Priority Number assessment for FMEA-style analysis',
          is_free: false,
          enabled: true,
          order: 9,
        },
      }),
      prisma.ramsFormat.upsert({
        where: { slug: 'principal-contractor' },
        update: {},
        create: {
          name: 'Principal Contractor',
          slug: 'principal-contractor',
          scoring_type: '5x5',
          description: 'Risk assessment format for principal contractors',
          is_free: false,
          enabled: true,
          order: 10,
        },
      }),
    ]);

    console.log(`Created ${formats.length} RAMS formats`);

    // ============================================
    // 2. Create Questions (20 questions)
    // ============================================
    console.log('Creating questions...');

    const questions = await Promise.all([
      prisma.question.upsert({
        where: { id: 'q-001' },
        update: {},
        create: {
          id: 'q-001',
          text: 'What is the activity or task?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.PROJECT_DETAILS,
          display_order: 1,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-002' },
        update: {},
        create: {
          id: 'q-002',
          text: 'What is the activity category?',
          field_type: FieldType.DROPDOWN,
          options: [
            'Excavation',
            'Working at Height',
            'Confined Space',
            'Hot Works',
            'Lifting Operations',
            'General Construction',
            'Demolition',
            'M&E Installation',
            'Concrete Works',
            'Piling',
          ],
          group: QuestionGroup.ACTIVITY_ENVIRONMENT,
          display_order: 2,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-003' },
        update: {},
        create: {
          id: 'q-003',
          text: 'What is the site name and address?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.PROJECT_DETAILS,
          display_order: 3,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-004' },
        update: {},
        create: {
          id: 'q-004',
          text: 'Who is the principal contractor?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.PROJECT_DETAILS,
          display_order: 4,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-005' },
        update: {},
        create: {
          id: 'q-005',
          text: 'Who is the supervisor or foreman?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.PROJECT_DETAILS,
          display_order: 5,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-006' },
        update: {},
        create: {
          id: 'q-006',
          text: 'What is the risk level?',
          field_type: FieldType.DROPDOWN,
          options: ['High', 'Medium', 'Low'],
          group: QuestionGroup.ACTIVITY_ENVIRONMENT,
          display_order: 6,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-007' },
        update: {},
        create: {
          id: 'q-007',
          text: 'Describe the location and environment',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.ACTIVITY_ENVIRONMENT,
          display_order: 7,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-008' },
        update: {},
        create: {
          id: 'q-008',
          text: 'What plant and equipment will be used?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.ACTIVITY_ENVIRONMENT,
          display_order: 8,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-009' },
        update: {},
        create: {
          id: 'q-009',
          text: 'What materials or substances are involved?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.ACTIVITY_ENVIRONMENT,
          display_order: 9,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-010' },
        update: {},
        create: {
          id: 'q-010',
          text: 'What is the sequence of works?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 10,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-011' },
        update: {},
        create: {
          id: 'q-011',
          text: 'Are permits required?',
          field_type: FieldType.DROPDOWN,
          options: ['Yes', 'No', 'Not Sure'],
          group: QuestionGroup.CONTROLS_PPE,
          display_order: 11,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-012' },
        update: {},
        create: {
          id: 'q-012',
          text: 'What existing controls are in place?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.CONTROLS_PPE,
          display_order: 12,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-013' },
        update: {},
        create: {
          id: 'q-013',
          text: 'Are there interfaces with other contractors or operations?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 13,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-014' },
        update: {},
        create: {
          id: 'q-014',
          text: 'What PPE is required?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.CONTROLS_PPE,
          display_order: 14,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-015' },
        update: {},
        create: {
          id: 'q-015',
          text: 'What training or competency is required?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.CONTROLS_PPE,
          display_order: 15,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-016' },
        update: {},
        create: {
          id: 'q-016',
          text: 'What constraints or access issues exist?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 16,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-017' },
        update: {},
        create: {
          id: 'q-017',
          text: 'What emergency procedures are in place?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.CONTROLS_PPE,
          display_order: 17,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-018' },
        update: {},
        create: {
          id: 'q-018',
          text: 'What is the duration of the activity?',
          field_type: FieldType.DROPDOWN,
          options: [
            'Less than 1 day',
            '1–5 days',
            '1–4 weeks',
            'More than 4 weeks',
          ],
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 18,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-019' },
        update: {},
        create: {
          id: 'q-019',
          text: 'How many operatives will be involved?',
          field_type: FieldType.DROPDOWN,
          options: ['1–2', '3–5', '6–10', 'More than 10'],
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 19,
          active: true,
        },
      }),
      prisma.question.upsert({
        where: { id: 'q-020' },
        update: {},
        create: {
          id: 'q-020',
          text: 'Is there any additional information?',
          field_type: FieldType.TEXT,
          word_limit: 50,
          group: QuestionGroup.METHOD_LOGISTICS,
          display_order: 20,
          active: true,
        },
      }),
    ]);

    console.log(`Created ${questions.length} questions`);

    // ============================================
    // 3. Create System Prompts
    // ============================================
    console.log('Creating system prompts...');

    // Base system prompt (applies to all formats)
    await prisma.systemPrompt.upsert({
      where: { id: 'prompt-base' },
      update: {},
      create: {
        id: 'prompt-base',
        type: PromptType.BASE,
        content: `You are an expert risk assessment specialist. Generate comprehensive Risk Assessments and Method Statements (RAMS) documents based on user input.

Your RAMS documents should include:
1. Clear identification of hazards
2. Assessment of risks (likelihood and consequence)
3. Existing control measures
4. Additional control measures required
5. Method of implementation
6. Responsibility assignment

Always ensure the RAMS is practical, site-specific, and complies with relevant regulations.`,
        version: 1,
        active: true,
      },
    });

    // Format-specific prompts for formats 1, 2, 3
    const formatSpecificPrompts = [
      {
        id: 'prompt-format-1',
        format_id: formats[0].id, // Standard 5x5
        content: `Generate a RAMS using a 5×5 risk matrix. Score each hazard using:
- Likelihood: 1-5 (Rare to Almost Certain)
- Consequence: 1-5 (Negligible to Catastrophic)
- Risk Score = Likelihood × Consequence
- Scores 15+: High risk, 6-14: Medium risk, 1-5: Low risk

Format the output with clear risk matrix scores.`,
      },
      {
        id: 'prompt-format-2',
        format_id: formats[1].id, // H/M/L Simple
        content: `Generate a simplified RAMS using High/Medium/Low risk categorization.
For each hazard:
1. Identify the hazard
2. Assess current controls
3. Determine risk level (H/M/L)
4. Recommend additional controls

Keep the format concise and easy to understand.`,
      },
      {
        id: 'prompt-format-3',
        format_id: formats[2].id, // Tier 1 Formal
        content: `Generate a formal Tier 1 RAMS document compliant with organizational standards.
Include:
1. Document header with approval signatures
2. Risk register with detailed assessments
3. Method statements with step-by-step procedures
4. Competency requirements
5. Emergency response procedures

Ensure the document is comprehensive and audit-ready.`,
      },
    ];

    for (const prompt of formatSpecificPrompts) {
      await prisma.systemPrompt.upsert({
        where: { id: prompt.id },
        update: {},
        create: {
          id: prompt.id,
          type: PromptType.FORMAT_VARIANT,
          format_id: prompt.format_id,
          content: prompt.content,
          version: 1,
          active: true,
        },
      });
    }

    console.log('Created system prompts (1 base + 3 format variants)');

    // ============================================
    // 4. Create Sample Promo Codes (optional)
    // ============================================
    console.log('Creating promo codes...');

    await prisma.promoCode.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        expires_at: new Date('2026-12-31'),
        usage_limit: 100,
        applicable_tiers: ['STANDARD', 'PROFESSIONAL'],
        active: true,
      },
    });

    await prisma.promoCode.upsert({
      where: { code: 'EARLYBIRD20' },
      update: {},
      create: {
        code: 'EARLYBIRD20',
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        expires_at: new Date('2026-06-30'),
        usage_limit: 50,
        applicable_tiers: ['PROFESSIONAL'],
        active: true,
      },
    });

    console.log('Created promo codes');

    // ============================================
    // 5. Create Sample Cross-Sell Tags (optional)
    // ============================================
    console.log('Creating cross-sell tags...');

    const crossSellTags = [
      {
        keyword: 'fire',
        product_name: 'Fire Safety Checklist',
        product_url: 'https://example.com/fire-safety',
      },
      {
        keyword: 'electrical',
        product_name: 'Electrical Safety Guide',
        product_url: 'https://example.com/electrical-safety',
      },
      {
        keyword: 'working-at-height',
        product_name: 'Fall Protection Manual',
        product_url: 'https://example.com/fall-protection',
      },
      {
        keyword: 'excavation',
        product_name: 'Excavation Best Practices',
        product_url: 'https://example.com/excavation-guide',
      },
      {
        keyword: 'ppe',
        product_name: 'PPE Selection Guide',
        product_url: 'https://example.com/ppe-guide',
      },
    ];

    for (const tag of crossSellTags) {
      await prisma.crossSellTag.upsert({
        where: { keyword: tag.keyword },
        update: {},
        create: tag,
      });
    }

    console.log(`Created ${crossSellTags.length} cross-sell tags`);

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
