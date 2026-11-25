import { splitDigitalCurrency } from '../../utils/currency';

interface TmbCurrencyBarProps {
  bits: number;
  compact?: boolean;
}

function CoinBadge({
  letter,
  variant,
}: {
  letter: 'T' | 'M' | 'B';
  variant: 'tera' | 'mega' | 'bit';
}) {
  const styles =
    variant === 'tera'
      ? 'border-amber-200 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-[#3b1c00] shadow-[0_0_8px_rgba(250,204,21,0.55)]'
      : variant === 'mega'
        ? 'border-sky-100 bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 text-[#0c1b33] shadow-[0_0_7px_rgba(186,230,253,0.45)]'
        : 'border-orange-200 bg-gradient-to-b from-orange-300 via-amber-600 to-amber-800 text-[#260e00] shadow-[0_0_6px_rgba(245,158,11,0.4)]';

  return (
    <span
      className={`inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border text-[9.5px] font-black leading-none ${styles}`}
    >
      {letter}
    </span>
  );
}

/**
 * Displays player currency split into Tera (T), Mega (M), and Bit (B)
 * with gold/silver/bronze coin badges.
 */
export function TmbCurrencyBar({ bits, compact = false }: TmbCurrencyBarProps) {
  const { tera, mega, bit } = splitDigitalCurrency(bits);

  return (
    <div
      title={`Saldo total: ${tera.toLocaleString('pt-BR')} Tera · ${mega} Mega · ${bit} Bits (${Math.max(0, Math.floor(bits)).toLocaleString('pt-BR')} B)`}
      className={`dmo-well grid grid-cols-3 items-center divide-x divide-cyan-400/25 rounded-lg ${
        compact ? 'px-1.5 py-1' : 'px-2 py-1.5'
      }`}
    >
      {/* Tera (T) */}
      <div className="flex items-center justify-end gap-1 pr-1.5">
        <span
          className={`truncate font-black tabular-nums ${
            compact ? 'text-[11px]' : 'text-xs'
          } ${tera > 0 ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.35)]' : 'text-slate-300/85'}`}
        >
          {tera.toLocaleString('pt-BR')}
        </span>
        <CoinBadge letter="T" variant="tera" />
      </div>

      {/* Mega (M) */}
      <div className="flex items-center justify-end gap-1 px-1.5">
        <span
          className={`font-black tabular-nums ${
            compact ? 'text-[11px]' : 'text-xs'
          } ${mega > 0 || tera > 0 ? 'text-sky-100' : 'text-slate-300/85'}`}
        >
          {mega}
        </span>
        <CoinBadge letter="M" variant="mega" />
      </div>

      {/* Bit (B) */}
      <div className="flex items-center justify-end gap-1 pl-1.5">
        <span
          className={`font-black tabular-nums ${
            compact ? 'text-[11px]' : 'text-xs'
          } text-amber-200`}
        >
          {bit}
        </span>
        <CoinBadge letter="B" variant="bit" />
      </div>
    </div>
  );
}
