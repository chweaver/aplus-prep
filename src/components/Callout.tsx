import type { ReactNode } from 'react';

type Kind = 'why' | 'trap' | 'review';

const STYLES: Record<Kind, string> = {
  why: 'border-emerald-700/40 bg-emerald-950/30 text-emerald-100',
  trap: 'border-rose-800/40 bg-rose-950/30 text-rose-100',
  review: 'border-amber-700/40 bg-amber-950/30 text-amber-100',
};

interface Props {
  kind: Kind;
  className?: string;
  children: ReactNode;
}

export default function Callout({ kind, className = '', children }: Props) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${STYLES[kind]} ${className}`}>
      {children}
    </div>
  );
}
