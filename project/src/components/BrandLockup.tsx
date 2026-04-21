type BrandLockupProps = {
  theme?: 'light' | 'dark';
  compact?: boolean;
  subtitle?: string;
};

export function BrandLockup({
  theme = 'light',
  compact = false,
  subtitle = 'Stellar / Soroban'
}: BrandLockupProps) {
  const dark = theme === 'dark';
  const frame = dark
    ? 'border-white/10 bg-slate-950/45 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]'
    : 'border-slate-200 bg-white/92 text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.08)]';
  const badge = dark
    ? 'border-white/12 bg-slate-900/70 text-slate-100'
    : 'border-slate-200 bg-white text-slate-700';
  const caption = dark ? 'text-slate-300' : 'text-slate-500';
  const wordmarkSrc = dark ? '/BRAND-GUIDELINE-_5_-Kopya.webp' : '/BRAND-GUIDELINE-_2_.webp';
  const networkLabel = subtitle.replace(/\s+[xX]\s+/, ' / ');
  const wordmarkHeight = compact ? 'h-8 sm:h-9' : 'h-10 sm:h-12';

  return (
    <div
      className={[
        'inline-flex rounded-[26px] border px-4 py-3 backdrop-blur',
        compact ? 'items-center gap-3' : 'flex-col items-start gap-3',
        frame
      ].join(' ')}
    >
      <div className={['flex min-w-0 items-center', compact ? 'gap-3' : 'flex-wrap gap-3'].join(' ')}>
        <img
          src={wordmarkSrc}
          alt="Forg3t"
          className={`${wordmarkHeight} w-auto shrink-0 object-contain`}
          loading="eager"
          decoding="async"
        />
        <span
          className={[
            'inline-flex items-center rounded-full border font-semibold uppercase',
            compact
              ? 'px-3 py-1 text-[10px] tracking-[0.24em]'
              : 'px-3.5 py-1.5 text-[11px] tracking-[0.28em]',
            badge
          ].join(' ')}
        >
          {networkLabel}
        </span>
      </div>
      {!compact && (
        <p className={`max-w-2xl text-sm leading-6 ${caption}`}>
          Verifiable AI unlearning workflows shaped for trust, evidence, and compliance operations.
        </p>
      )}
    </div>
  );
}
