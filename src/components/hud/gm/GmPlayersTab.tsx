import { useMemo, useState } from 'react';
import {
  Ban,
  Coins,
  Gem,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import type { BanDurationPreset } from '../../../services/banService';
import type { GmPlayerEntry } from '../../../services/gmControlService';
import { formatDigitalCurrency } from '../../../utils/currency';

type PlayerFilterMode = 'all' | 'online' | 'offline' | 'banned';

const MAP_LABELS: Record<string, string> = {
  'dats-center': 'DATS Center',
  'hunting-plains': 'Planície Digital',
  'data-forest': 'Floresta de Dados',
  'digi-mountain': 'Montanha Digi',
  'digital-desert': 'Deserto Digital',
  'data-sea': 'Mar de Dados',
  'digimon-island': 'Ilha dos Digimons',
  'dark-area': 'Área Sombria',
  'virtual-world': 'Mundo Virtual',
};

interface GmPlayersTabProps {
  players: GmPlayerEntry[];
  selfUid: string;
  loading: boolean;
  onAdjustCurrency: (input: {
    targetUid: string;
    bitsDelta: number;
    dCoinDelta: number;
    reason: string;
  }) => Promise<void>;
  onKickPlayer: (targetUid: string, targetName: string) => Promise<void>;
  onBanPlayer: (input: {
    targetUid: string;
    username: string;
    tamerName: string;
    reason: string;
    durationPreset: BanDurationPreset;
  }) => Promise<void>;
  onUnbanPlayer: (targetUid: string, targetName: string) => Promise<void>;
}

export function GmPlayersTab({
  players,
  selfUid,
  loading,
  onAdjustCurrency,
  onKickPlayer,
  onBanPlayer,
  onUnbanPlayer,
}: GmPlayersTabProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlayerFilterMode>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const [bitsDeltaInput, setBitsDeltaInput] = useState('0');
  const [dCoinDeltaInput, setDCoinDeltaInput] = useState('0');
  const [currencyReason, setCurrencyReason] = useState('');
  const [banDuration, setBanDuration] = useState<BanDurationPreset>('7d');
  const [banReason, setBanReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (filter === 'online' && !p.online) return false;
      if (filter === 'offline' && (p.online || p.isBanned)) return false;
      if (filter === 'banned' && !p.isBanned) return false;
      if (!q) return true;
      return (
        p.tamerName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q) ||
        (p.guildName ?? '').toLowerCase().includes(q)
      );
    });
  }, [players, search, filter]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.uid === selectedUid) ?? null,
    [players, selectedUid]
  );

  const counts = useMemo(
    () => ({
      all: players.length,
      online: players.filter((p) => p.online).length,
      offline: players.filter((p) => !p.online && !p.isBanned).length,
      banned: players.filter((p) => p.isBanned).length,
    }),
    [players]
  );

  const handleApplyCurrency = async (
    customBits?: number,
    customDCoin?: number,
    defaultReason?: string
  ) => {
    if (!selectedPlayer) return;
    const bDelta =
      customBits !== undefined
        ? customBits
        : Number.parseInt(bitsDeltaInput, 10) || 0;
    const dDelta =
      customDCoin !== undefined
        ? customDCoin
        : Number.parseInt(dCoinDeltaInput, 10) || 0;
    if (bDelta === 0 && dDelta === 0) return;

    setActionBusy(true);
    try {
      await onAdjustCurrency({
        targetUid: selectedPlayer.uid,
        bitsDelta: bDelta,
        dCoinDelta: dDelta,
        reason: currencyReason.trim() || defaultReason || 'Ajuste administrativo GM',
      });
      if (customBits === undefined) setBitsDeltaInput('0');
      if (customDCoin === undefined) setDCoinDeltaInput('0');
      setCurrencyReason('');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubmitBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !banReason.trim()) return;
    setActionBusy(true);
    try {
      await onBanPlayer({
        targetUid: selectedPlayer.uid,
        username: selectedPlayer.username,
        tamerName: selectedPlayer.tamerName,
        reason: banReason.trim(),
        durationPreset: banDuration,
      });
      setBanReason('');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + Filter Controls */}
      <div className="flex flex-col gap-2 rounded-xl border border-cyan-400/25 bg-[#041232] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar Tamer, @usuário, guilda ou UID..."
            className="h-10 w-full rounded-lg border border-cyan-400/35 bg-[#020b22] pl-9 pr-3 text-xs text-white outline-none focus:border-amber-300"
          />
        </div>

        <div className="grid grid-cols-4 gap-1 sm:flex">
          {(
            [
              { id: 'all', label: `Todos (${counts.all})` },
              { id: 'online', label: `Online (${counts.online})` },
              { id: 'offline', label: `Offline (${counts.offline})` },
              { id: 'banned', label: `Ban (${counts.banned})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`min-h-[36px] rounded-lg border px-2.5 text-[10.5px] font-black whitespace-nowrap transition ${
                filter === f.id
                  ? 'border-amber-300 bg-amber-500/20 text-amber-100'
                  : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Player Inspector & Moderation Card */}
      {selectedPlayer && (
        <div className="rounded-xl border border-amber-300/60 bg-[#051844] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-2.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  {selectedPlayer.tamerName}
                </h3>
                <span className="text-[11px] font-bold text-cyan-300">
                  @{selectedPlayer.username}
                </span>
                {selectedPlayer.isBanned ? (
                  <span className="rounded border border-rose-400/60 bg-rose-950/70 px-1.5 py-0.5 text-[9.5px] font-black text-rose-200">
                    BANIDO
                  </span>
                ) : selectedPlayer.online ? (
                  <span className="rounded border border-emerald-400/60 bg-emerald-950/70 px-1.5 py-0.5 text-[9.5px] font-black text-emerald-200">
                    ONLINE · {MAP_LABELS[selectedPlayer.mapId] ?? selectedPlayer.mapId}
                  </span>
                ) : (
                  <span className="rounded border border-slate-500/50 bg-slate-900/80 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-300">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                UID: {selectedPlayer.uid}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUid(null)}
              aria-label="Fechar inspetor do jogador"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#041232] text-cyan-100 hover:bg-sky-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Account Vitals & Economy Snapshot */}
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#041232] p-2">
              <p className="text-[10px] text-slate-400">Bits Atuais</p>
              <p className="text-xs font-black tabular-nums text-amber-300">
                {formatDigitalCurrency(selectedPlayer.bits)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#041232] p-2">
              <p className="text-[10px] text-slate-400">DL Din Atuais</p>
              <p className="text-xs font-black tabular-nums text-cyan-300">
                {selectedPlayer.dCoin.toLocaleString('pt-BR')} DL Din
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#041232] p-2">
              <p className="text-[10px] text-slate-400">Níveis</p>
              <p className="text-xs font-black tabular-nums text-white">
                Tamer {selectedPlayer.tamerLevel} · Digi {selectedPlayer.digimonLevel}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#041232] p-2">
              <p className="text-[10px] text-slate-400">Guilda & Kills</p>
              <p className="truncate text-xs font-bold text-slate-200">
                {selectedPlayer.guildName || 'Sem Guilda'} ·{' '}
                {selectedPlayer.defeatedEnemiesTotal}
              </p>
            </div>
          </div>

          {/* Inventory Preview */}
          {selectedPlayer.inventoryPreview.length > 0 && (
            <div className="mt-2.5 rounded-lg border border-white/10 bg-[#041232] p-2">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-cyan-200">
                <Package className="h-3.5 w-3.5" />
                <span>Mochila ({selectedPlayer.inventoryCount} slots ocupados)</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedPlayer.inventoryPreview.map((item, idx) => (
                  <span
                    key={`${item.name}-${idx}`}
                    className="rounded border border-cyan-400/20 bg-[#061844] px-2 py-0.5 text-[10px] font-semibold text-slate-200"
                  >
                    {item.name} ×{item.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Currency Adjustment Controls */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            <div className="rounded-lg border border-cyan-400/25 bg-[#041232] p-2.5">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase text-cyan-200">
                <Gem className="h-3.5 w-3.5 text-cyan-300" />
                <span>Ajustar Bits / DL Din da Conta</span>
              </p>

              <div className="mb-2 flex flex-wrap gap-1.5">
                {[
                  { label: '+100M Bits', bits: 100_000, dCoin: 0 },
                  { label: '+10 DL Din', bits: 0, dCoin: 10 },
                  { label: '+50 DL Din', bits: 0, dCoin: 50 },
                  { label: '+100 DL Din', bits: 0, dCoin: 100 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      void handleApplyCurrency(
                        preset.bits,
                        preset.dCoin,
                        `Crédito rápido (${preset.label})`
                      )
                    }
                    className="min-h-[32px] rounded-lg border border-cyan-300/45 bg-[#082c74] px-2 text-[10px] font-black text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9.5px] font-bold text-amber-200">
                    Delta Bits (+/-)
                  </label>
                  <input
                    type="number"
                    value={bitsDeltaInput}
                    onChange={(e) => setBitsDeltaInput(e.target.value)}
                    className="mt-0.5 h-9 w-full rounded-lg border border-cyan-400/35 bg-[#020b22] px-2 text-xs font-bold tabular-nums text-white outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-cyan-200">
                    Delta DL Din (+/-)
                  </label>
                  <input
                    type="number"
                    value={dCoinDeltaInput}
                    onChange={(e) => setDCoinDeltaInput(e.target.value)}
                    className="mt-0.5 h-9 w-full rounded-lg border border-cyan-400/35 bg-[#020b22] px-2 text-xs font-bold tabular-nums text-white outline-none focus:border-amber-300"
                  />
                </div>
              </div>

              <div className="mt-1.5 flex gap-1.5">
                <input
                  type="text"
                  maxLength={64}
                  value={currencyReason}
                  onChange={(e) => setCurrencyReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="h-9 flex-1 rounded-lg border border-cyan-400/35 bg-[#020b22] px-2 text-xs text-white outline-none focus:border-amber-300"
                />
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleApplyCurrency()}
                  className="h-9 rounded-lg border border-amber-300/75 bg-amber-500 px-3 text-[11px] font-black text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            </div>

            {/* Kick & Ban Controls */}
            <div className="rounded-lg border border-rose-400/25 bg-[#041232] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase text-rose-200">
                  <Ban className="h-3.5 w-3.5 text-rose-400" />
                  <span>Moderação & Banimento</span>
                </p>

                {selectedPlayer.online && selectedPlayer.uid !== selfUid && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      void onKickPlayer(
                        selectedPlayer.uid,
                        selectedPlayer.tamerName
                      )
                    }
                    className="flex min-h-[28px] items-center gap-1 rounded-md border border-amber-300/60 bg-amber-500/20 px-2 text-[10px] font-black text-amber-100 hover:bg-amber-500/35 disabled:opacity-50"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Kick</span>
                  </button>
                )}
              </div>

              {selectedPlayer.uid === selfUid ? (
                <div className="flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-[#061844] p-2.5 text-[11px] font-bold text-cyan-200">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                  <span>Esta é a sua sessão GM ativa (protegida contra banimento).</span>
                </div>
              ) : selectedPlayer.isBanned && selectedPlayer.banRecord ? (
                <div className="space-y-2 rounded-lg border border-rose-400/35 bg-rose-950/35 p-2.5">
                  <p className="text-[11px] font-bold text-rose-100">
                    Motivo: {selectedPlayer.banRecord.reason}
                  </p>
                  <p className="text-[10px] text-rose-200/80">
                    Tipo:{' '}
                    {selectedPlayer.banRecord.permanent
                      ? 'Permanente'
                      : `Até ${new Date(
                          selectedPlayer.banRecord.expiresAtMs
                        ).toLocaleString('pt-BR')}`}
                  </p>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      void onUnbanPlayer(
                        selectedPlayer.uid,
                        selectedPlayer.tamerName
                      )
                    }
                    className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/65 bg-emerald-700 px-3 text-[11px] font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Remover Banimento</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void handleSubmitBan(e)} className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: '24h', label: '24h' },
                        { id: '7d', label: '7 Dias' },
                        { id: '30d', label: '30 Dias' },
                        { id: 'permanent', label: 'Permanente' },
                      ] as const
                    ).map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setBanDuration(dur.id)}
                        className={`min-h-[32px] rounded-md border text-[10px] font-black ${
                          banDuration === dur.id
                            ? 'border-rose-300 bg-rose-600 text-white'
                            : 'border-white/15 bg-[#061844] text-slate-300 hover:text-white'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={240}
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Motivo do banimento (min. 3 letras)..."
                      className="h-9 flex-1 rounded-lg border border-rose-400/35 bg-[#020b22] px-2 text-xs text-white outline-none focus:border-rose-300"
                    />
                    <button
                      type="submit"
                      disabled={actionBusy || banReason.trim().length < 3}
                      className="h-9 rounded-lg border border-rose-300/75 bg-rose-600 px-3 text-[11px] font-black text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      Banir
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Players Table / List */}
      <div className="overflow-hidden rounded-xl border border-cyan-400/25 bg-[#041232]">
        <div className="hidden grid-cols-[1.5fr_0.9fr_1fr_0.9fr_0.9fr_100px] gap-2 border-b border-white/10 bg-[#061844] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200 md:grid">
          <span>Jogador / Tamer</span>
          <span>Status</span>
          <span>Parceiro / Mapa</span>
          <span className="text-right">Bits</span>
          <span className="text-right">DL Din</span>
          <span className="text-right">Ações</span>
        </div>

        {loading && players.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-300">
            Carregando contas cadastradas no servidor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhum jogador encontrado com esse filtro.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((p) => {
              const isSelected = p.uid === selectedUid;
              return (
                <div
                  key={p.uid}
                  className={`flex flex-col gap-2 px-3 py-2.5 transition md:grid md:grid-cols-[1.5fr_0.9fr_1fr_0.9fr_0.9fr_100px] md:items-center ${
                    isSelected ? 'bg-[#092766]' : 'hover:bg-[#061c4f]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-black text-white">
                        {p.tamerName}
                      </span>
                      {p.isGm && (
                        <span className="rounded border border-amber-300/60 bg-amber-500/20 px-1 py-[1px] text-[9px] font-black text-amber-200">
                          GM
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10.5px] font-semibold text-cyan-300/85">
                      @{p.username} · Tamer Nv.{p.tamerLevel}
                    </p>
                  </div>

                  <div>
                    {p.isBanned ? (
                      <span className="inline-flex items-center gap-1 rounded border border-rose-400/50 bg-rose-950/70 px-1.5 py-0.5 text-[10px] font-black text-rose-200">
                        BANIDO
                      </span>
                    ) : p.online ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-400/50 bg-emerald-950/70 px-1.5 py-0.5 text-[10px] font-black text-emerald-200">
                        ONLINE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-slate-600/60 bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        OFFLINE
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 text-[10.5px]">
                    <p className="truncate font-bold text-slate-100">
                      {p.activeFormId || p.starterDigimonName || 'Sem Digimon'} · Nv.
                      {p.digimonLevel}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {MAP_LABELS[p.mapId] ?? p.mapId}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 md:block md:text-right">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 md:hidden">
                      <Coins className="h-3 w-3 text-amber-300" /> Bits:
                    </span>
                    <span className="text-xs font-black tabular-nums text-amber-300">
                      {formatDigitalCurrency(p.bits)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 md:block md:text-right">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 md:hidden">
                      <Gem className="h-3 w-3 text-cyan-300" /> DL Din:
                    </span>
                    <span className="text-xs font-black tabular-nums text-cyan-300">
                      {p.dCoin.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUid((curr) => (curr === p.uid ? null : p.uid))
                      }
                      className="min-h-[34px] w-full rounded-lg border border-cyan-300/50 bg-[#082c74] px-2.5 text-[10.5px] font-black text-white hover:bg-sky-700 md:w-auto"
                    >
                      {isSelected ? 'Fechar' : 'Gerenciar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
