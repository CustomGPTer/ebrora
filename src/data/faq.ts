export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQSection {
  id: string;
  title: string;
  items: FAQItem[];
}

export const FAQ_DATA: FAQSection[] = [
  {
    id: 'ai-tools',
    title: 'AI Tools',
    items: [
      {
        id: 'ai-1',
        question: 'What are the AI tools and how do they work?',
        answer: 'Ebrora offers 35 AI-powered document generators covering Health & Safety, Quality, Commercial, and Programme categories. You describe your work or upload a document, answer a few tailored questions, and the AI generates a professional, regulation-compliant document in minutes. Tools include RAMS Builder, COSHH Assessment, ITP Builder, Lift Plan, CE Notification, Working at Height Assessment, RIDDOR Report, Traffic Management Plan, and many more.'
      },
      {
        id: 'ai-2',
        question: 'What format do AI-generated documents come in?',
        answer: 'Most AI tools generate professional Word documents (.docx) that you can edit, brand, and use immediately. Some tools like the ITP Builder generate Excel workbooks (.xlsx) where spreadsheet format is more appropriate.'
      },
      {
        id: 'ai-3',
        question: 'Are the AI-generated documents compliant with UK regulations?',
        answer: 'Yes. Our AI tools are designed around UK construction regulations and standards including CDM 2015, COSHH Regulations 2002, Manual Handling Operations Regulations 1992, LOLER, PUWER, BS 7121, NEC3/NEC4, JCT, and relevant HSE guidance. However, you should always review AI-generated documents before use and verify they meet your specific site requirements.'
      },
      {
        id: 'ai-4',
        question: 'How many AI documents can I generate?',
        answer: 'Free users can generate 3 documents per month across all AI tools. Standard subscribers get 30 documents per month, and Professional subscribers get unlimited generations. Document limits reset on your billing date each month.'
      },
      {
        id: 'ai-5',
        question: 'Which AI tools are available on the Free plan?',
        answer: 'Free users have access to most AI tools including RAMS Builder, COSHH Assessment, Manual Handling, DSE, Toolbox Talk Generator, Confined Spaces, Incident Report, Lift Plan, and more. Some advanced tools like Programme Checker, RAMS Review, and commercial letter generators are restricted to Standard and Professional plans.'
      },
      {
        id: 'ai-6',
        question: 'Can I edit the AI-generated documents?',
        answer: 'Absolutely. All documents are delivered as standard Word or Excel files that you can edit freely. Add your company logo, adjust content, merge with other documents — they\'re yours to use however you need.'
      },
      {
        id: 'ai-7',
        question: 'How long do download links last?',
        answer: 'AI-generated document download links expire 24 hours after generation. Make sure to download your documents promptly. If a link expires, you\'ll need to regenerate the document.'
      }
    ]
  },
  {
    id: 'templates',
    title: 'Premium Templates',
    items: [
      {
        id: 'templates-1',
        question: 'What file format are the premium templates in?',
        answer: 'Our premium templates come in .xlsx and .xlsm (Excel) format. Templates with VBA macros use the .xlsm format. Both can be opened in Microsoft Excel on Windows and Mac.'
      },
      {
        id: 'templates-2',
        question: 'Do premium templates work on Mac?',
        answer: 'Yes, all templates work on both Windows and Mac versions of Microsoft Excel. Please note that some advanced VBA macro features may have limited functionality on Mac, but all core features work on both platforms.'
      },
      {
        id: 'templates-3',
        question: 'What is the free PDF preview?',
        answer: 'Every premium template has a free downloadable PDF that shows the complete layout, all tabs, dashboards, and features. This lets you see exactly what you\'re buying before you make a purchase. No email required.'
      },
      {
        id: 'templates-4',
        question: 'How do I receive my template after purchase?',
        answer: 'Premium template purchases are handled by Gumroad. After payment, Gumroad instantly delivers your Excel file to your email. You can also re-download it anytime from your Gumroad receipt.'
      },
      {
        id: 'templates-5',
        question: 'How do I enable macros in .xlsm files?',
        answer: 'When you open an .xlsm file, Excel will display a yellow security warning bar at the top. Click "Enable Content" to activate the macros. If you don\'t see this bar, you may need to adjust your macro settings in Excel\'s Trust Center (File > Options > Trust Center > Trust Center Settings > Macro Settings).'
      },
      {
        id: 'templates-6',
        question: 'Are updates included with premium templates?',
        answer: 'Yes. When we update a template with new features or improvements, you can re-download the latest version at any time from your original Gumroad purchase receipt.'
      },
      {
        id: 'templates-7',
        question: 'Can you build a custom template for my company?',
        answer: 'Absolutely. We regularly build bespoke Excel tools for construction companies, utilities, and infrastructure firms. Get in touch via our contact form with your requirements, and we\'ll provide a quote and estimated timeline.'
      }
    ]
  },
  {
    id: 'free-templates',
    title: 'Free Templates',
    items: [
      {
        id: 'free-1',
        question: 'What free templates are available?',
        answer: 'We offer over 500 free templates across 31 categories including permit to work forms, plant check sheets, daily diaries, meeting agendas, induction forms, environmental checklists, and much more. All are professionally designed and ready to use on UK construction sites.'
      },
      {
        id: 'free-2',
        question: 'Do I need an account to download free templates?',
        answer: 'No account required. Free templates can be downloaded instantly by anyone. Simply browse the Free Templates section, find what you need, and click download.'
      },
      {
        id: 'free-3',
        question: 'What format are free templates in?',
        answer: 'Free templates come in Excel (.xlsx), Word (.docx), and PowerPoint (.pptx) formats depending on the template type. The file format is shown on each template card.'
      },
      {
        id: 'free-4',
        question: 'Can I use free templates commercially?',
        answer: 'Yes. All free templates are provided for use on your construction projects. You can edit them, add your company branding, and use them commercially. You cannot resell the templates themselves.'
      },
      {
        id: 'free-5',
        question: 'What\'s the difference between free and premium templates?',
        answer: 'Free templates are practical, ready-to-use documents for common site tasks. Premium templates are more sophisticated tools with advanced features like VBA automation, dashboards, calculations, and integrations — designed to save significant time on complex workflows.'
      }
    ]
  },
  {
    id: 'toolbox-talks',
    title: 'Toolbox Talks',
    items: [
      {
        id: 'tbt-1',
        question: 'What are toolbox talks?',
        answer: 'Toolbox talks are short safety briefings delivered to site teams before work begins. They cover specific hazards, safe working practices, and regulatory requirements. Our library contains over 1,500 talks across 60+ categories covering everything from working at height to manual handling to COSHH.'
      },
      {
        id: 'tbt-2',
        question: 'Are the toolbox talks free?',
        answer: 'Yes, all 1,500+ toolbox talks are completely free to download and use. No account or subscription required.'
      },
      {
        id: 'tbt-3',
        question: 'What format are toolbox talks in?',
        answer: 'Toolbox talks are provided as PDF documents that you can print or display on a tablet. Each talk includes key points, hazards, control measures, and space for attendance signatures.'
      },
      {
        id: 'tbt-4',
        question: 'Can I create custom toolbox talks?',
        answer: 'Yes! Our AI Toolbox Talk Builder lets you generate bespoke, site-specific toolbox talks for any activity, hazard, or condition. Describe the topic and the AI creates a professional talk tailored to your specific situation.'
      },
      {
        id: 'tbt-5',
        question: 'Are the toolbox talks compliant with CDM 2015?',
        answer: 'Our toolbox talks are designed to support CDM 2015 requirements for worker engagement and providing information. They cover HSE guidance and industry best practice. As with all safety documentation, you should review talks to ensure they\'re appropriate for your specific site conditions.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Billing',
    items: [
      {
        id: 'account-1',
        question: 'What subscription plans are available?',
        answer: 'We offer three tiers: Free (3 AI documents/month, access to most tools), Standard at £9.99/month (30 AI documents/month, all tools, priority support), and Professional at £24.99/month (unlimited AI documents, all tools, priority support, early access to new features).'
      },
      {
        id: 'account-2',
        question: 'How do I upgrade or downgrade my plan?',
        answer: 'You can change your plan anytime from your Account Dashboard. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.'
      },
      {
        id: 'account-3',
        question: 'What payment methods do you accept?',
        answer: 'Subscriptions are processed through PayPal, which accepts all major credit and debit cards as well as PayPal balance. Premium template purchases through Gumroad accept cards, PayPal, Apple Pay, and Google Pay.'
      },
      {
        id: 'account-4',
        question: 'Can I cancel my subscription?',
        answer: 'Yes, you can cancel anytime from your Account Dashboard. Your access continues until the end of your current billing period. There are no cancellation fees or long-term commitments.'
      },
      {
        id: 'account-5',
        question: 'Do you offer team or enterprise plans?',
        answer: 'We\'re developing team plans with shared document limits and centralised billing. For enterprise requirements, contact us with your team size and needs, and we\'ll provide a tailored quote.'
      },
      {
        id: 'account-6',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot password" on the login page and enter your email address. You\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it.'
      },
      {
        id: 'account-7',
        question: 'Can I get a refund?',
        answer: 'For subscriptions, you can cancel anytime and won\'t be charged again, but we don\'t offer refunds for partial months. For premium template purchases through Gumroad, contact us if you\'re unhappy and we\'ll work to resolve any issues or process a refund if needed.'
      }
    ]
  }
];
