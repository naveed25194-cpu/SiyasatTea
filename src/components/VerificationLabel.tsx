import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface VerificationLabelProps {
  status: string;
  compact?: boolean;
}

export function VerificationLabel({ status, compact = false }: VerificationLabelProps) {
  const normalized = status.trim();

  let icon = <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  let colorClass = 'text-amber-700 dark:text-amber-400';

  if (normalized === 'Officially documented') {
    icon = <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    colorClass = 'text-[#14532D] dark:text-emerald-400';
  } else if (normalized === 'Independently corroborated') {
    icon = <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    colorClass = 'text-[#0F294A] dark:text-sky-400';
  } else if (normalized === 'Disputed') {
    icon = <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    colorClass = 'text-rose-700 dark:text-rose-400';
  } else if (normalized === 'Unavailable') {
    icon = <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    colorClass = 'text-slate-500 dark:text-slate-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        compact ? 'text-xs' : 'text-xs'
      } ${colorClass}`}
    >
      {icon}
      <span>{normalized}</span>
    </span>
  );
}
