import type { Metadata } from 'next';
import ContractScopeReviewerClient from './components/ContractScopeReviewerClient';

export const metadata: Metadata = {
  title: 'Contract Scope Risk Reviewer | Ebrora',
  description:
    'AI-powered scope of works risk reviewer for NEC and JCT contracts. Upload your scope, answer tailored questions, get a professional risk review with clause references and severity ratings.',
};

export default function ContractScopeReviewerPage() {
  return <ContractScopeReviewerClient />;
}
