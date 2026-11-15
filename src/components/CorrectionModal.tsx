import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { validateCorrectionInput } from '../utils/platformLogic';

interface CorrectionModalProps {
  isOpen: boolean;
  entityType: string;
  entityId: number;
  entityLabel: string;
  defaultSection?: string;
  onClose: () => void;
}

export function CorrectionModal({
  isOpen,
  entityType,
  entityId,
  entityLabel,
  defaultSection = 'General Record',
  onClose,
}: CorrectionModalProps) {
  const [sectionName, setSectionName] = useState(defaultSection);
  const [submittedClaim, setSubmittedClaim] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      entityType,
      entityId,
      entityLabel,
      sectionName,
      submittedClaim,
      suggestedCorrection,
      evidenceUrl,
      submitterName,
      submitterEmail,
    };

    const validation = validateCorrectionInput(payload);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to submit correction request.');
        return;
      }
      setSubmittedOk(true);
    } catch {
      setErrorMsg('Network error while submitting correction request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Editorial Correction &amp; Fact-Check Intake
            </p>
            <h2
              id="correction-modal-title"
              className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Report Inaccurate Information — {entityLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close correction form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {submittedOk ? (
          <div className="py-6">
            <p className="text-base font-semibold text-[#14532D] dark:text-emerald-400">
              Correction report logged for editorial review.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Thank you for contributing to public record accuracy. Our editorial team reviews
              submitted citations before updating published records.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-[44px] rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1E3A5F]"
            >
              Return to Record
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="corr-section"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Record Section
              </label>
              <input
                id="corr-section"
                type="text"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="corr-claim"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Current Statement / Value Under Review
              </label>
              <textarea
                id="corr-claim"
                rows={2}
                value={submittedClaim}
                onChange={(e) => setSubmittedClaim(e.target.value)}
                placeholder="Quote the figure, date, or claim you are flagging..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="corr-suggestion"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Suggested Correction &amp; Context
              </label>
              <textarea
                id="corr-suggestion"
                rows={3}
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="Provide the verified correction and reference details..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="corr-evidence"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Official Source or Evidence URL (optional)
              </label>
              <input
                id="corr-evidence"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://ecp.gov.pk/..."
                className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="corr-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Your Name
                </label>
                <input
                  id="corr-name"
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="corr-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email Address
                </label>
                <input
                  id="corr-email"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-400">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[42px] rounded-lg bg-[#0F294A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1E3A5F] disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Correction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
