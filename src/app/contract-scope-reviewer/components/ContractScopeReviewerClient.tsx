'use client';

// =============================================================================
// ContractScopeReviewerClient — Full Multi-Step Wizard
//
// Flow:
//   Step 1: Choose Template (Quick / Detailed / Comprehensive)
//   Step 2: Contract Type (NEC/JCT cascading dropdowns)
//   Step 3: Context, Role, Sector, Value, Duration
//   Step 4: Upload document (PDF / DOCX)
//   Step 5: AI reads doc → shows 4 dynamic questions (dropdowns)
//   Step 6: Processing (AI generating report)
//   Step 7: Download DOCX
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CONTRACT_SCOPE_TEMPLATE_CONFIGS } from '@/lib/contract-scope-reviewer/template-config';
import { CONTRACT_SCOPE_TEMPLATE_ORDER, CONTRACT_SCOPE_FREE_TEMPLATES } from '@/lib/contract-scope-reviewer/types';
import type { ContractScopeTemplateSlug, ContractScopeWizardState, ContractFamily, DynamicQuestion } from '@/lib/contract-scope-reviewer/types';
import { NEC_CONTRACT_TYPES, NEC_MAIN_OPTIONS, JCT_CONTRACT_TYPES, JCT_VARIANT_LABELS, REVIEW_CONTEXTS, USER_ROLES, SECTORS } from '@/lib/contract-scope-reviewer/contract-data';
import type { NecContractType, JctContractType, JctVariant, NecMainOption } from '@/lib/contract-scope-reviewer/types';

type WizardStep = 'template' | 'contract' | 'context' | 'upload' | 'questions' | 'processing' | 'download' | 'error';

const ACCENT = '#7C3AED';

const STEP_LABELS = ['Template', 'Contract', 'Details', 'Upload', 'Questions', 'Report'];
const STEP_MAP: Record<WizardStep, number> = { template: 0, contract: 1, context: 2, upload: 3, questions: 4, processing: 5, download: 5, error: 5 };

const PROCESSING_STEPS = [
  'Uploading document…',
  'Extracting content…',
  'Analysing scope…',
  'Cross-referencing contract clauses…',
  'Assessing risk severity…',
  'Building risk register…',
  'Generating professional report…',
  'Finalising document…',
];

// ── Icons ─────────────────────────────────────────────────────────────────────
function SpinnerIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`animate-spin ${className}`} style={style} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function DocumentIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ currentStep }: { currentStep: WizardStep }) {
  const idx = STEP_MAP[currentStep] ?? 0;
  return (
    <div className="rams-progress">
      <div className="rams-progress-bar">
        {STEP_LABELS.map((label, n) => (
          <div key={n} className={`rams-progress-step ${n <= idx ? 'active' : ''}`}>
            <div className="rams-progress-dot">{n < idx ? '✓' : n + 1}</div>
            <span className="rams-progress-label">{label}</span>
          </div>
        ))}
        <div className="rams-progress-line">
          <div className="rams-progress-line-fill" style={{ width: `${(idx / (STEP_LABELS.length - 1)) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Styled Select ─────────────────────────────────────────────────────────────
function StyledSelect({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB',
          fontSize: '0.9rem', fontFamily: 'inherit', background: '#FAFAFA', color: '#111827',
          appearance: 'none', cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center',
        }}
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function ContractScopeReviewerClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('template');
  const [wizard, setWizard] = useState<Partial<ContractScopeWizardState>>({});

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 1 response
  const [documentSummary, setDocumentSummary] = useState('');
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
  const [parsedText, setParsedText] = useState('');
  const [parsedMeta, setParsedMeta] = useState<{ fileName: string; fileSize: number; fileType: string; characterCount: number }>({ fileName: '', fileSize: 0, fileType: '', characterCount: 0 });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Processing
  const [processingStep, setProcessingStep] = useState(0);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Download
  const [downloadData, setDownloadData] = useState<{ downloadUrl: string; filename: string; expiresAt: string } | null>(null);

  // Error
  const [errorMessage, setErrorMessage] = useState('');

  // Auth
  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan !== 'FREE';

  // Processing animation
  useEffect(() => {
    if (step === 'processing') {
      processingTimerRef.current = setInterval(() => {
        setProcessingStep(prev => prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev);
      }, 3500);
    }
    return () => { if (processingTimerRef.current) clearInterval(processingTimerRef.current); };
  }, [step]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const updateWizard = (patch: Partial<ContractScopeWizardState>) => setWizard(prev => ({ ...prev, ...patch }));

  const selectedNec = NEC_CONTRACT_TYPES.find(n => n.value === wizard.necContractType);
  const selectedJct = JCT_CONTRACT_TYPES.find(j => j.value === wizard.jctContractType);

  // ── Template access ──────────────────────────────────────────────────────
  const canAccessTemplate = (slug: ContractScopeTemplateSlug): boolean => {
    if (!isAuthenticated) return false;
    if (isPaid) return true;
    return CONTRACT_SCOPE_FREE_TEMPLATES.includes(slug);
  };

  const handleTemplateSelect = (slug: ContractScopeTemplateSlug) => {
    if (!isAuthenticated) { router.push('/auth/login?callbackUrl=/contract-scope-reviewer'); return; }
    if (!canAccessTemplate(slug)) { router.push('/pricing'); return; }
    updateWizard({ templateSlug: slug });
    setStep('contract');
  };

  // ── Contract step validation ─────────────────────────────────────────────
  const isContractStepValid = () => {
    if (!wizard.contractFamily) return false;
    if (wizard.contractFamily === 'NEC') {
      if (!wizard.necContractType) return false;
      if (selectedNec?.hasMainOption && !wizard.necMainOption) return false;
    } else {
      if (!wizard.jctContractType) return false;
      // JCT variant: only require if multiple variants exist and not just 'standard'
      if (selectedJct && selectedJct.variants.length > 1 && !wizard.jctVariant) return false;
    }
    return true;
  };

  // ── Context step validation ──────────────────────────────────────────────
  const isContextStepValid = () => {
    return !!wizard.reviewContext && !!wizard.userRole && !!wizard.sector;
  };

  // ── File handling ────────────────────────────────────────────────────────
  const handleFileSelected = (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!['pdf', 'docx'].includes(ext)) {
      setErrorMessage(`File type .${ext} is not accepted. Please upload a PDF or DOCX file.`);
      setStep('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 10 MB.`);
      setStep('error');
      return;
    }
    setSelectedFile(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelected(f); }, []);

  // ── Phase 1: Upload → questions ──────────────────────────────────────────
  const handleUploadForQuestions = async () => {
    if (!selectedFile) return;
    setStep('processing');
    setProcessingStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const formData = new FormData();
      formData.append('action', 'questions');
      formData.append('file', selectedFile);
      formData.append('wizardContext', JSON.stringify(wizard));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch('/api/ai-tools/contract-scope-reviewer', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeoutId);

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(res.status === 504 ? 'The document took too long to process. Please try a smaller file.' : `Server error (${res.status}).`);
        setStep('error');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(data.error || 'An error occurred.');
        setStep('error');
        return;
      }

      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setDocumentSummary(data.documentSummary || '');
      setDynamicQuestions(data.questions || []);
      setParsedText(data.parsedText || '');
      setParsedMeta({ fileName: data.fileName, fileSize: data.fileSize, fileType: data.fileType, characterCount: data.characterCount });
      setAnswers({});
      setStep('questions');
    } catch (err: any) {
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setErrorMessage(err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Something went wrong.'));
      setStep('error');
    }
  };

  // ── Phase 2: Answers → generate ──────────────────────────────────────────
  const allQuestionsAnswered = dynamicQuestions.length === 0 || dynamicQuestions.every(q => !!answers[q.id]);

  const handleGenerate = async () => {
    setStep('processing');
    setProcessingStep(3); // Start further along since doc is already parsed
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const answersArr = dynamicQuestions.map(q => ({ question: q.question, answer: answers[q.id] || '' }));
      const formData = new FormData();
      formData.append('action', 'generate');
      formData.append('wizardContext', JSON.stringify(wizard));
      formData.append('parsedText', parsedText);
      formData.append('answers', JSON.stringify(answersArr));
      formData.append('fileName', parsedMeta.fileName);
      formData.append('fileSize', String(parsedMeta.fileSize));
      formData.append('fileType', parsedMeta.fileType);
      formData.append('characterCount', String(parsedMeta.characterCount));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch('/api/ai-tools/contract-scope-reviewer', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeoutId);

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(res.status === 504 ? 'Report generation timed out. Please try again.' : `Server error (${res.status}).`);
        setStep('error');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setErrorMessage(data.error || 'An error occurred.');
        setStep('error');
        return;
      }

      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setDownloadData({ downloadUrl: data.downloadUrl, filename: data.filename, expiresAt: data.expiresAt });
      setStep('download');
    } catch (err: any) {
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setErrorMessage(err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Something went wrong.'));
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('template');
    setWizard({});
    setSelectedFile(null);
    setDynamicQuestions([]);
    setAnswers({});
    setDocumentSummary('');
    setParsedText('');
    setDownloadData(null);
    setErrorMessage('');
    setProcessingStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const cardStyle: React.CSSProperties = {
    maxWidth: '680px', margin: '0 auto', background: '#fff', borderRadius: '1.25rem',
    border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem',
  };

  // ── STEP 1: Template Picker ──────────────────────────────────────────────
  if (step === 'template') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <ProgressBar currentStep={step} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: `${ACCENT}15`, color: ACCENT, marginBottom: '1rem' }}>
              <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              AI-Powered Review
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Contract Scope Risk Reviewer</h1>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
              Upload your scope of works and get an AI-powered risk review tailored to your contract type, role, and sector.
            </p>
            {!isAuthenticated && <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '0.5rem' }}>Sign in to access templates</p>}
            {isAuthenticated && !isPaid && <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '0.5rem' }}>1 free template · <a href="/pricing" style={{ color: ACCENT, fontWeight: 600 }}>Upgrade for all 3</a></p>}
          </div>

          <div className="template-grid-5">
            {CONTRACT_SCOPE_TEMPLATE_ORDER.map(slug => {
              const tpl = CONTRACT_SCOPE_TEMPLATE_CONFIGS[slug];
              const accessible = canAccessTemplate(slug);
              const isFree = CONTRACT_SCOPE_FREE_TEMPLATES.includes(slug);
              const locked = !accessible && isAuthenticated;
              return (
                <button key={slug} type="button" className={`tpl-card ${locked ? 'tpl-card--locked' : ''}`} onClick={() => handleTemplateSelect(slug)}>
                  <div className="tpl-card-thumb" style={{ background: '#F3F4F6', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <DocumentIcon className="w-12 h-12 text-gray-300" />
                    <span className="tpl-card-preview-pill">{tpl.pageCount} pages</span>
                    {isFree && <span className="tpl-card-badge tpl-card-badge--free">Free</span>}
                    {locked && (
                      <div className="tpl-card-lock-overlay">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="tpl-card-lock-icon"><path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 10 13a2 2 0 0 1 2-2z" /></svg>
                        <span className="tpl-card-lock-label">Upgrade</span>
                      </div>
                    )}
                  </div>
                  <div className="tpl-card-body"><h3 className="tpl-card-title">{tpl.displayName}</h3><p className="tpl-card-desc">{tpl.description}</p></div>
                  <div className="tpl-card-footer">
                    {accessible ? <span className="tpl-card-cta">Use Template →</span> : !isAuthenticated ? <span className="tpl-card-cta tpl-card-cta--locked">Sign In</span> : <span className="tpl-card-cta tpl-card-cta--upgrade">Upgrade</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Contract Type (cascading) ────────────────────────────────────
  if (step === 'contract') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={cardStyle}>
          <ProgressBar currentStep={step} />
          <button onClick={() => setStep('template')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: ACCENT, fontWeight: 600, fontFamily: 'inherit', marginBottom: '1.5rem' }}>← Change template</button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Contract Type</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>Select the contract form so the AI can tailor its risk analysis to the specific clauses and mechanisms.</p>

          <StyledSelect
            label="Contract Family"
            value={wizard.contractFamily || ''}
            onChange={v => { updateWizard({ contractFamily: v as ContractFamily, necContractType: undefined, necMainOption: undefined, jctContractType: undefined, jctVariant: undefined }); }}
            options={[{ value: 'NEC', label: 'NEC (NEC3 / NEC4)' }, { value: 'JCT', label: 'JCT (Joint Contracts Tribunal)' }]}
            placeholder="Select contract family…"
          />

          {wizard.contractFamily === 'NEC' && (
            <>
              <StyledSelect
                label="NEC Contract Type"
                value={wizard.necContractType || ''}
                onChange={v => { updateWizard({ necContractType: v as NecContractType, necMainOption: undefined }); }}
                options={NEC_CONTRACT_TYPES.map(n => ({ value: n.value, label: n.label }))}
                placeholder="Select NEC contract…"
              />
              {selectedNec?.hasMainOption && (
                <StyledSelect
                  label="Main Option"
                  value={wizard.necMainOption || ''}
                  onChange={v => updateWizard({ necMainOption: v as NecMainOption })}
                  options={NEC_MAIN_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  placeholder="Select main option…"
                />
              )}
            </>
          )}

          {wizard.contractFamily === 'JCT' && (
            <>
              <StyledSelect
                label="JCT Contract Type"
                value={wizard.jctContractType || ''}
                onChange={v => { updateWizard({ jctContractType: v as JctContractType, jctVariant: undefined }); }}
                options={JCT_CONTRACT_TYPES.map(j => ({ value: j.value, label: j.label }))}
                placeholder="Select JCT contract…"
              />
              {selectedJct && selectedJct.variants.length > 1 && (
                <StyledSelect
                  label="Variant"
                  value={wizard.jctVariant || ''}
                  onChange={v => updateWizard({ jctVariant: v as JctVariant })}
                  options={selectedJct.variants.map(v => ({ value: v, label: JCT_VARIANT_LABELS[v] }))}
                  placeholder="Select variant…"
                />
              )}
            </>
          )}

          <button
            onClick={() => { if (selectedJct && selectedJct.variants.length === 1 && !wizard.jctVariant) { updateWizard({ jctVariant: selectedJct.variants[0] }); } setStep('context'); }}
            disabled={!isContractStepValid()}
            style={{
              width: '100%', padding: '0.9rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, fontSize: '0.95rem',
              color: '#fff', cursor: isContractStepValid() ? 'pointer' : 'not-allowed',
              background: isContractStepValid() ? ACCENT : '#D1D5DB', marginTop: '1rem', fontFamily: 'inherit',
            }}
          >Continue →</button>
        </div>
      </div>
    );
  }

  // ── STEP 3: Context / Role / Sector / Value / Duration ───────────────────
  if (step === 'context') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={cardStyle}>
          <ProgressBar currentStep={step} />
          <button onClick={() => setStep('contract')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: ACCENT, fontWeight: 600, fontFamily: 'inherit', marginBottom: '1.5rem' }}>← Back to contract type</button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Review Details</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>These details help the AI understand your perspective and tailor the review accordingly.</p>

          <StyledSelect
            label="Review Context"
            value={wizard.reviewContext || ''}
            onChange={v => updateWizard({ reviewContext: v as any })}
            options={REVIEW_CONTEXTS.map(r => ({ value: r.value, label: `${r.label} — ${r.description}` }))}
            placeholder="When are you reviewing this scope?"
          />

          <StyledSelect
            label="Your Role"
            value={wizard.userRole || ''}
            onChange={v => updateWizard({ userRole: v as any })}
            options={USER_ROLES.map(r => ({ value: r.value, label: r.label }))}
            placeholder="What is your role?"
          />

          <StyledSelect
            label="Sector"
            value={wizard.sector || ''}
            onChange={v => updateWizard({ sector: v as any })}
            options={SECTORS.map(s => ({ value: s.value, label: s.label }))}
            placeholder="Which sector?"
          />

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Estimated Value of Works (optional)</label>
            <input
              type="text"
              value={wizard.estimatedValue || ''}
              onChange={e => updateWizard({ estimatedValue: e.target.value })}
              placeholder="e.g. £2.5m"
              style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB', fontSize: '0.9rem', fontFamily: 'inherit', background: '#FAFAFA', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Expected Programme Duration (optional)</label>
            <input
              type="text"
              value={wizard.programmeDuration || ''}
              onChange={e => updateWizard({ programmeDuration: e.target.value })}
              placeholder="e.g. 18 months"
              style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB', fontSize: '0.9rem', fontFamily: 'inherit', background: '#FAFAFA', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={() => setStep('upload')}
            disabled={!isContextStepValid()}
            style={{
              width: '100%', padding: '0.9rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, fontSize: '0.95rem',
              color: '#fff', cursor: isContextStepValid() ? 'pointer' : 'not-allowed',
              background: isContextStepValid() ? ACCENT : '#D1D5DB', marginTop: '1rem', fontFamily: 'inherit',
            }}
          >Continue to Upload →</button>
        </div>
      </div>
    );
  }

  // ── STEP 4: Upload ───────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={cardStyle}>
          <ProgressBar currentStep={step} />
          <button onClick={() => setStep('context')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: ACCENT, fontWeight: 600, fontFamily: 'inherit', marginBottom: '1.5rem' }}>← Back to details</button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Upload Scope of Works</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>Upload your scope document. The AI will read it and ask you 4 targeted questions before generating the review.</p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {['PDF', 'DOCX'].map(fmt => (
              <span key={fmt} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${ACCENT}40`, color: ACCENT, background: `${ACCENT}08` }}>{fmt}</span>
            ))}
            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 500, background: '#F3F4F6', color: '#6B7280' }}>Max 10 MB</span>
          </div>

          <div
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? ACCENT : selectedFile ? ACCENT : '#E5E7EB'}`,
              borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              background: isDragging ? `${ACCENT}08` : selectedFile ? `${ACCENT}05` : '#FAFAFA',
              transition: 'all 0.15s ease',
            }}
          >
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }} accept=".pdf,.docx" />
            {selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DocumentIcon className="w-6 h-6" style={{ color: ACCENT }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{(selectedFile.size / 1024).toFixed(0)} KB — Click to change</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <UploadIcon className="w-10 h-10 text-gray-300" />
                <p style={{ fontWeight: 500, fontSize: '0.9rem', color: '#6B7280' }}>Drag & drop your scope document</p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>or click to browse</p>
              </div>
            )}
          </div>

          {/* Complexity warning */}
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '0.8rem', color: '#92400E' }}>
            <strong>Note:</strong> Very large or complex documents (100+ pages, embedded images, scanned PDFs) may exceed Ebrora's processing capabilities. For best results, upload text-based PDF or DOCX files under 50 pages.
          </div>

          <button
            onClick={handleUploadForQuestions}
            disabled={!selectedFile}
            style={{
              width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, fontSize: '1rem',
              color: '#fff', cursor: selectedFile ? 'pointer' : 'not-allowed',
              background: selectedFile ? ACCENT : '#D1D5DB', marginTop: '1.5rem', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            {selectedFile ? 'Upload & Analyse Document' : 'Select a file to continue'}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 5: Dynamic Questions ────────────────────────────────────────────
  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={cardStyle}>
          <ProgressBar currentStep={step} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>A Few More Questions</h2>

          {documentSummary && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, marginBottom: '1.25rem', fontSize: '0.85rem', color: '#374151' }}>
              <strong style={{ color: ACCENT }}>Document Summary:</strong> {documentSummary}
            </div>
          )}

          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            The AI has read your scope and needs a few more details to produce the most accurate review. Please answer all 4 questions below.
          </p>

          {dynamicQuestions.map((q, idx) => (
            <StyledSelect
              key={q.id}
              label={`${idx + 1}. ${q.question}`}
              value={answers[q.id] || ''}
              onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
              options={q.options.map(o => ({ value: o, label: o }))}
              placeholder="Select an answer…"
            />
          ))}

          <button
            onClick={handleGenerate}
            disabled={!allQuestionsAnswered}
            style={{
              width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, fontSize: '1rem',
              color: '#fff', cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed',
              background: allQuestionsAnswered ? ACCENT : '#D1D5DB', marginTop: '1rem', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Generate Risk Review Report
          </button>
        </div>
      </div>
    );
  }

  // ── PROCESSING ───────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div style={{ maxWidth: '420px', width: '100%', background: '#fff', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <SpinnerIcon className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>Generating Your Report</h2>
            <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>{selectedFile?.name || parsedMeta.fileName} — this usually takes 30–90 seconds</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {PROCESSING_STEPS.map((text, i) => {
              const isDone = i < processingStep;
              const isActive = i === processingStep;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isDone ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon className="w-3 h-3 text-white" /></div>
                      : isActive ? <SpinnerIcon className="w-5 h-5" style={{ color: ACCENT }} />
                      : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #E5E7EB' }} />}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: isDone ? '#9CA3AF' : isActive ? '#111827' : '#D1D5DB', textDecoration: isDone ? 'line-through' : 'none', fontWeight: isActive ? 500 : 400 }}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────
  if (step === 'download' && downloadData) {
    const expiryStr = new Date(downloadData.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const tpl = wizard.templateSlug ? CONTRACT_SCOPE_TEMPLATE_CONFIGS[wizard.templateSlug] : null;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div style={{ maxWidth: '420px', width: '100%', background: '#fff', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckIcon className="w-8 h-8" style={{ color: ACCENT }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Your Report is Ready</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            {tpl?.displayName || 'Risk Review'} generated from <strong>{parsedMeta.fileName || selectedFile?.name}</strong>
          </p>

          <div style={{ background: '#F9FAFB', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DocumentIcon className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{downloadData.filename}</p>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>Expires {expiryStr}</p>
            </div>
          </div>

          <a href={downloadData.downloadUrl} download={downloadData.filename}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.85rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: '#fff', background: ACCENT, textDecoration: 'none', marginBottom: '0.75rem' }}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Download Risk Review Report
          </a>

          <button onClick={handleReset} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.75rem', border: 'none', fontWeight: 500, fontSize: '0.85rem', color: '#6B7280', background: '#F3F4F6', cursor: 'pointer', fontFamily: 'inherit' }}>
            Review Another Scope
          </button>

          <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: '#9CA3AF', lineHeight: '1.5' }}>
            Ebrora can make mistakes. Always review AI-generated documents before use and verify compliance with current regulations and site-specific requirements.
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div style={{ maxWidth: '420px', width: '100%', background: '#fff', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg style={{ width: '32px', height: '32px', color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Something Went Wrong</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>{errorMessage || 'An unexpected error occurred.'}</p>
          <button onClick={handleReset} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: 'none', fontWeight: 600, fontSize: '0.9rem', color: '#fff', background: ACCENT, cursor: 'pointer', fontFamily: 'inherit' }}>
            Try Again
          </button>
          <Link href="/" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem', color: '#9CA3AF', textDecoration: 'none' }}>Back to tools</Link>
        </div>
      </div>
    );
  }

  return null;
}
