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
    id: 'general',
    title: 'General',
    items: [
      {
        id: 'general-1',
        question: 'What file format are the templates in?',
        answer: 'Our templates come in .xlsx and .xlsm (Excel) format. Templates with VBA macros use the .xlsm format. Both can be opened in Microsoft Excel on Windows and Mac.'
      },
      {
        id: 'general-2',
        question: 'Do these work on Mac?',
        answer: 'Yes, all templates work on both Windows and Mac versions of Microsoft Excel. Please note that some advanced VBA macro features may have limited functionality on Mac, but all core features work on both platforms.'
      },
      {
        id: 'general-3',
        question: 'Do I need to install anything?',
        answer: 'No installation required. Simply download the Excel file and open it. All formatting, formulas, and macros are built into the file. You just need Microsoft Excel.'
      },
      {
        id: 'general-4',
        question: 'Are updates included?',
        answer: 'Yes. When we update a template with new features or improvements, you can re-download the latest version at any time from your original Gumroad purchase receipt.'
      }
    ]
  },
  {
    id: 'purchasing',
    title: 'Purchasing',
    items: [
      {
        id: 'purchasing-1',
        question: 'What is the free PDF preview?',
        answer: 'Every product on our site has a free downloadable PDF that shows the complete template layout, all tabs, dashboards, and features. This lets you see exactly what you\'re buying before you make a purchase. No email required.'
      },
      {
        id: 'purchasing-2',
        question: 'How do I receive my file after purchase?',
        answer: 'Your purchase is handled by Gumroad, a trusted global platform. After payment, Gumroad instantly delivers your Excel file to your email. You can also re-download it anytime from your Gumroad receipt.'
      },
      {
        id: 'purchasing-3',
        question: 'Can I get a refund?',
        answer: 'Refunds are handled through Gumroad. If you\'re unhappy with a purchase, please contact us first and we\'ll do our best to resolve any issues. If needed, we\'ll process a refund through Gumroad.'
      },
      {
        id: 'purchasing-4',
        question: 'Do you offer bulk or site licences?',
        answer: 'Yes, we offer discounted licences for teams and organisations. Contact us with your requirements, team size, and which templates you need, and we\'ll provide a tailored quote.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical',
    items: [
      {
        id: 'technical-1',
        question: 'How do I enable macros in .xlsm files?',
        answer: 'When you open an .xlsm file, Excel will display a yellow security warning bar at the top. Click "Enable Content" to activate the macros. If you don\'t see this bar, you may need to adjust your macro settings in Excel\'s Trust Center (File > Options > Trust Center > Trust Center Settings > Macro Settings).'
      },
      {
        id: 'technical-2',
        question: 'The macros aren\'t working — what should I do?',
        answer: 'First, make sure you\'ve clicked "Enable Content" when prompted. If the issue persists, go to File > Options > Trust Center > Trust Center Settings > Macro Settings, and select "Enable all macros". If you\'re still having trouble, contact us and we\'ll help troubleshoot.'
      }
    ]
  },
  {
    id: 'custom',
    title: 'Custom Services',
    items: [
      {
        id: 'custom-1',
        question: 'Can you build a custom template for my company?',
        answer: 'Absolutely. We regularly build bespoke Excel tools for construction companies, utilities, and infrastructure firms. Get in touch via our contact form with your requirements, and we\'ll provide a quote and estimated timeline.'
      }
    ]
  }
];
