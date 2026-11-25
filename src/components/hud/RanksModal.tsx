import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  Gift,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';
import type { GuildEmblemColor, GuildRecord } from '../../services/guildService';
import {
  fetchServerRankings,
  type GuildRankingRecord,
  type PlayerRankingRecord,
} from '../../services/rankingsService';
import {
  fetchReferralRankings,
  formatReferralMonthLabel,
  getCurrentReferralMonthKey,
  type ReferralProfileRecord,
} from '../../services/referralService';
import type { RemoteWorldPlayer } from '../../services/worldPresenceService';
import { getDigimonFormProfile } from '../../types/digimon';
import {
  isValidCoverPhotoDataUrl,
  processCoverPhotoUpload,
} from '../../utils/avatarPhoto';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';

const RANKS_ICON_SRC =
  '/assets/aistudio/file_000000003018820e80f1f96c3e36d9ef_597f2c97.png';

type RankCategoryTab = 'tamers' | 'digimons' | 'guilds' | 'invites';
type DigimonSortMode = 'cp' | 'level';
type GuildSortMode = 'level' | 'totalKills' | 'dailyKills';
type InviteRankMode = 'monthly' | 'total';

interface RanksModalProps {
  selfPlayer: PlayerRankingRecord;
  playerGuild: GuildRecord | null;
  remotePlayers: readonly RemoteWorldPlayer[];
  onUpdateTamerCover?: (coverUrl: string | null) => void;
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

const GUILD_SHIELD_COLORS: Record<GuildEmblemColor, string> = {
  cyan: 'border-cyan-300/75 bg-cyan-500/20 text-cyan-200',
  amber: 'border-amber-300/75 bg-amber-500/20 text-amber-200',
  crimson: 'border-rose-300/75 bg-rose-500/20 text-rose-200',
  emerald: 'border-emerald-300/75 bg-emerald-500/20 text-emerald-200',
  violet: 'border-violet-300/75 bg-violet-500/20 text-violet-200',
};

function RankMedalBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-gradient-to-b from-amber-300/35 to-amber-600/35 text-xs font-black tabular-nums text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.45)]">
        <Crown className="h-4 w-4 text-amber-300" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300/80 bg-slate-300/20 text-xs font-black tabular-nums text-slate-100">
        2º
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-400/80 bg-orange-500/20 text-xs font-black tabular-nums text-orange-200">
        3º
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-[#051840] text-[11px] font-black tabular-nums text-cyan-200/85">
      {rank}º
    </span>
  );
}

export function RanksModal({
  selfPlayer,
  playerGuild,
  remotePlayers,
  onUpdateTamerCover,
  onPlayTone,
  onClose,
}: RanksModalProps) {
  const [activeTab, setActiveTab] = useState<RankCategoryTab>('tamers');
  const [digimonSort, setDigimonSort] = useState<DigimonSortMode>('cp');
  const [guildSort, setGuildSort] = useState<GuildSortMode>('level');
  const [inviteSort, setInviteSort] = useState<InviteRankMode>('monthly');
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerRankingRecord[]>([]);
  const [guilds, setGuilds] = useState<GuildRankingRecord[]>([]);
  const [monthlyInviters, setMonthlyInviters] = useState<ReferralProfileRecord[]>(
    []
  );
  const [totalInviters, setTotalInviters] = useState<ReferralProfileRecord[]>(
    []
  );
  const [inviteMonthLabel, setInviteMonthLabel] = useState<string>(() =>
    formatReferralMonthLabel(getCurrentReferralMonthKey())
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFeedback, setCoverFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickCoverPhoto = async (
    file: File | null | undefined,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file || !onUpdateTamerCover) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setCoverFeedback(null);
    setUploadingCover(true);
    try {
      const res = await processCoverPhotoUpload(file);
      if (!res.ok || !res.dataUrl) {
        onPlayTone('error');
        setCoverFeedback({
          type: 'err',
          text: res.error ?? 'Não foi possível carregar esta capa.',
        });
        return;
      }
      onUpdateTamerCover(res.dataUrl);
      setCoverFeedback({
        type: 'ok',
        text: 'Capa do Rank atualizada!',
      });
    } catch {
      onPlayTone('error');
      setCoverFeedback({
        type: 'err',
        text: 'Não foi possível processar esta capa.',
      });
    } finally {
      setUploadingCover(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore input reset error
        }
      }
    }
  };

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const [data, refRank] = await Promise.all([
        fetchServerRankings({
          currentSelfPlayer: selfPlayer,
          currentPlayerGuild: playerGuild,
          remotePlayers,
        }),
        fetchReferralRankings({
          tamerName: selfPlayer.tamerName,
          characterId: selfPlayer.characterId,
          tamerPhotoUrl: selfPlayer.tamerPhotoUrl ?? null,
          tamerCoverUrl: selfPlayer.tamerCoverUrl ?? null,
          isGm: selfPlayer.isGm,
        }),
      ]);
      setPlayers(data.players);
      setGuilds(data.guilds);
      setMonthlyInviters(refRank.monthlyRanking);
      setTotalInviters(refRank.totalRanking);
      setInviteMonthLabel(refRank.monthLabel);
    } finally {
      setLoading(false);
    }
  }, [selfPlayer, playerGuild, remotePlayers]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  const sortedTamers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.tamerLevel !== a.tamerLevel) return b.tamerLevel - a.tamerLevel;
      if (b.tamerExp !== a.tamerExp) return b.tamerExp - a.tamerExp;
      if (b.defeatedEnemiesTotal !== a.defeatedEnemiesTotal) {
        return b.defeatedEnemiesTotal - a.defeatedEnemiesTotal;
      }
      return b.digimonCombatPower - a.digimonCombatPower;
    });
  }, [players]);

  const sortedDigimons = useMemo(() => {
    return [...players].sort((a, b) => {
      if (digimonSort === 'level') {
        if (b.digimonLevel !== a.digimonLevel) return b.digimonLevel - a.digimonLevel;
        return b.digimonCombatPower - a.digimonCombatPower;
      }
      if (b.digimonCombatPower !== a.digimonCombatPower) {
        return b.digimonCombatPower - a.digimonCombatPower;
      }
      return b.digimonLevel - a.digimonLevel;
    });
  }, [players, digimonSort]);

  const sortedGuilds = useMemo(() => {
    return [...guilds].sort((a, b) => {
      if (guildSort === 'totalKills') {
        if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
        return b.level - a.level;
      }
      if (guildSort === 'dailyKills') {
        if (b.dailyKills !== a.dailyKills) return b.dailyKills - a.dailyKills;
        return b.totalKills - a.totalKills;
      }
      if (b.level !== a.level) return b.level - a.level;
      if (b.exp !== a.exp) return b.exp - a.exp;
      return b.totalKills - a.totalKills;
    });
  }, [guilds, guildSort]);

  const myTamerRankIdx = sortedTamers.findIndex(
    (p) => p.userId === selfPlayer.userId
  );
  const myDigimonRankIdx = sortedDigimons.findIndex(
    (p) => p.userId === selfPlayer.userId
  );
  const myGuildRankIdx = playerGuild
    ? sortedGuilds.findIndex((g) => g.guildId === playerGuild.guildId)
    : -1;
  const displayedInviters =
    inviteSort === 'monthly' ? monthlyInviters : totalInviters;
  const myInviteRankIdx = displayedInviters.findIndex(
    (entry) => entry.ownerUid === selfPlayer.userId
  );
  const myInviteEntry =
    myInviteRankIdx >= 0 ? displayedInviters[myInviteRankIdx] : null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Rankings de Tamers, Digimons e Guildas"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/82 p-2.5 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window flex max-h-[86dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_40px_rgba(0,174,255,0.52)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cyan-400/35 bg-[#07266b] px-3.5 py-2.5 sm:px-4">
          <div className="flex items-center gap-2.5">
            <img
              src={RANKS_ICON_SRC}
              alt="Ranks"
              draggable={false}
              className="h-9 w-9 shrink-0 rounded-xl border border-amber-300/75 bg-[#04143a] object-cover shadow-[0_0_12px_rgba(251,191,36,0.45)]"
            />
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white">
                HALL DOS RANKS
              </h2>
              <p className="text-[10.5px] font-bold text-amber-200/90">
                Classificação Oficial · Tamers, Digimons, Guildas e Convites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                void loadRankings();
              }}
              aria-label="Atualizar Rankings"
              className="flex h-8 items-center gap-1 rounded-xl border border-cyan-300/45 bg-[#051a48] px-2.5 text-[10.5px] font-extrabold text-cyan-100 transition hover:bg-sky-700 active:scale-95"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Ranks"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/50 bg-[#04163e] text-cyan-100 transition hover:bg-sky-700 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Primary 4-Tab Navigation: Tamers | Digimons | Guilds | Convites */}
        <div className="grid shrink-0 grid-cols-4 gap-1.5 border-b border-cyan-400/25 bg-[#041438] p-2.5">
          {[
            { id: 'tamers' as const, label: 'Tamers', icon: Users },
            { id: 'digimons' as const, label: 'Digimons', icon: Sparkles },
            { id: 'guilds' as const, label: 'Guildas', icon: Shield },
            { id: 'invites' as const, label: 'Convites', icon: Gift },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  setActiveTab(tab.id);
                }}
                className={`flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-black transition sm:gap-1.5 sm:text-xs ${
                  active
                    ? 'border-amber-300 bg-gradient-to-b from-[#1758cb] to-[#0a2b73] text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                    : 'border-cyan-400/25 bg-[#061c4b] text-cyan-200/80 hover:border-cyan-300/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-bar (summary + sort toggle) */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 bg-[#051842] px-3.5 py-2 text-[10.5px]">
          {activeTab === 'tamers' && (
            <>
              <span className="font-bold text-cyan-100">
                Sua posição:{' '}
                <strong className="font-black tabular-nums text-amber-300">
                  {myTamerRankIdx >= 0 ? `#${myTamerRankIdx + 1}` : '—'}
                </strong>{' '}
                · {selfPlayer.tamerName} (Nv. {selfPlayer.tamerLevel})
              </span>
              <span className="font-bold tabular-nums text-cyan-200/80">
                {sortedTamers.length} Tamer(s)
              </span>
            </>
          )}

          {activeTab === 'digimons' && (
            <>
              <span className="font-bold text-cyan-100">
                Seu Parceiro:{' '}
                <strong className="font-black tabular-nums text-amber-300">
                  {myDigimonRankIdx >= 0 ? `#${myDigimonRankIdx + 1}` : '—'}
                </strong>{' '}
                · {selfPlayer.digimonName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setDigimonSort('cp');
                  }}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                    digimonSort === 'cp'
                      ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                      : 'border-cyan-400/30 bg-[#041130] text-slate-300'
                  }`}
                >
                  Poder (CP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setDigimonSort('level');
                  }}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                    digimonSort === 'level'
                      ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                      : 'border-cyan-400/30 bg-[#041130] text-slate-300'
                  }`}
                >
                  Nível
                </button>
              </div>
            </>
          )}

          {activeTab === 'guilds' && (
            <>
              <span className="font-bold text-cyan-100">
                {playerGuild ? (
                  <>
                    Sua Guilda:{' '}
                    <strong className="font-black tabular-nums text-amber-300">
                      {myGuildRankIdx >= 0 ? `#${myGuildRankIdx + 1}` : '—'}
                    </strong>{' '}
                    · [{playerGuild.tag}]
                  </>
                ) : (
                  'Sem Guilda vinculada'
                )}
              </span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'level' as const, label: 'Nível' },
                  { id: 'totalKills' as const, label: 'Caça Total' },
                  { id: 'dailyKills' as const, label: 'Hoje' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onPlayTone('click');
                      setGuildSort(opt.id);
                    }}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                      guildSort === opt.id
                        ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                        : 'border-cyan-400/30 bg-[#041130] text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'invites' && (
            <>
              <span className="font-bold text-cyan-100">
                Sua posição:{' '}
                <strong className="font-black tabular-nums text-amber-300">
                  {myInviteRankIdx >= 0 ? `#${myInviteRankIdx + 1}` : '—'}
                </strong>{' '}
                ·{' '}
                {inviteSort === 'monthly'
                  ? `${myInviteEntry?.effectiveMonthlyInvites ?? 0} no mês`
                  : `${myInviteEntry?.totalInvites ?? 0} total`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setInviteSort('monthly');
                  }}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                    inviteSort === 'monthly'
                      ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                      : 'border-cyan-400/30 bg-[#041130] text-slate-300'
                  }`}
                >
                  Mensal ({inviteMonthLabel})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setInviteSort('total');
                  }}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                    inviteSort === 'total'
                      ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                      : 'border-cyan-400/30 bg-[#041130] text-slate-300'
                  }`}
                >
                  Geral (Total)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3.5 text-xs text-sky-100">
          {loading && players.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-cyan-200">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="font-bold">Carregando classificação do servidor...</span>
            </div>
          ) : null}

          {/* Self Rank Cover Photo Editor */}
          {activeTab === 'tamers' && onUpdateTamerCover && (
            <div className="relative overflow-hidden rounded-xl border border-cyan-400/40 bg-[#051845] p-2.5">
              {isValidCoverPhotoDataUrl(selfPlayer.tamerCoverUrl) && (
                <>
                  <img
                    src={selfPlayer.tamerCoverUrl}
                    alt="Sua capa no Rank"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030e2c]/90 via-[#04143a]/75 to-[#030e2c]/90" />
                </>
              )}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white">
                    Minha Capa no Rank
                  </p>
                  <p className="text-[10px] font-semibold text-cyan-200/85">
                    Exibida como banner atrás do seu card na classificação
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    tabIndex={-1}
                    className="sr-only"
                    onChange={(e) => {
                      const inputEl = e.currentTarget;
                      const f = inputEl.files?.[0];
                      void handlePickCoverPhoto(f, inputEl);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-1 rounded-lg border border-cyan-300/75 bg-gradient-to-b from-[#0b5ed7] to-[#052a73] px-2.5 py-1 text-[10px] font-black text-white shadow hover:brightness-115 active:scale-95 disabled:opacity-60"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>
                      {uploadingCover
                        ? 'Enviando...'
                        : selfPlayer.tamerCoverUrl
                          ? 'Trocar Capa'
                          : 'Colocar Capa'}
                    </span>
                  </button>
                  {selfPlayer.tamerCoverUrl && (
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => {
                        onUpdateTamerCover(null);
                        setCoverFeedback({
                          type: 'ok',
                          text: 'Capa removida do Rank.',
                        });
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-400/50 bg-slate-800/85 px-2 py-1 text-[10px] font-bold text-slate-200 hover:bg-slate-700"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
              {coverFeedback && (
                <p
                  className={`relative z-10 mt-1 text-[10px] font-bold ${
                    coverFeedback.type === 'ok'
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {coverFeedback.text}
                </p>
              )}
            </div>
          )}

          {/* TAMERS TAB */}
          {activeTab === 'tamers' &&
            sortedTamers.map((entry, idx) => {
              const rank = idx + 1;
              const isSelf = entry.userId === selfPlayer.userId;
              const coverUrl = isValidCoverPhotoDataUrl(entry.tamerCoverUrl)
                ? entry.tamerCoverUrl
                : null;
              return (
                <div
                  key={entry.userId}
                  className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 transition ${
                    isSelf
                      ? 'border-amber-300/80 bg-gradient-to-r from-[#133f94] to-[#082258] shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                      : 'border-cyan-400/25 bg-[#041335]/90'
                  }`}
                >
                  {coverUrl && (
                    <>
                      <img
                        src={coverUrl}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030d27]/88 via-[#041335]/72 to-[#030d27]/90" />
                    </>
                  )}
                  <div className="relative z-10">
                    <RankMedalBadge rank={rank} />
                  </div>

                  <div className="relative z-10 shrink-0">
                    <TamerPortraitAvatar
                      tamerId={entry.characterId}
                      tamerName={entry.tamerName}
                      customPhotoUrl={entry.tamerPhotoUrl ?? null}
                      sizeClass="h-10 w-10 border border-cyan-300/60"
                    />
                  </div>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {entry.tamerName}
                      </span>
                      {entry.isGm && (
                        <span className="rounded bg-amber-400/25 px-1.5 py-0.5 text-[9px] font-black text-amber-200">
                          GM
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded bg-cyan-400/25 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] font-semibold text-cyan-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {entry.guildName ? `${entry.guildName} · ` : ''}
                      Parceiro: {entry.digimonName} (Nv. {entry.digimonLevel})
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0 text-right">
                    <p className="text-xs font-black tabular-nums text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Nv. {entry.tamerLevel}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-[9.5px] font-bold tabular-nums text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      <Swords className="h-2.5 w-2.5" />
                      <span>{entry.defeatedEnemiesTotal.toLocaleString('pt-BR')}</span>
                    </p>
                  </div>
                </div>
              );
            })}

          {/* DIGIMONS TAB */}
          {activeTab === 'digimons' &&
            sortedDigimons.map((entry, idx) => {
              const rank = idx + 1;
              const isSelf = entry.userId === selfPlayer.userId;
              const form = getDigimonFormProfile(entry.digimonFormId);
              const coverUrl = isValidCoverPhotoDataUrl(entry.tamerCoverUrl)
                ? entry.tamerCoverUrl
                : null;
              return (
                <div
                  key={`digi-${entry.userId}`}
                  className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 transition ${
                    isSelf
                      ? 'border-amber-300/80 bg-gradient-to-r from-[#133f94] to-[#082258] shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                      : 'border-cyan-400/25 bg-[#041335]/90'
                  }`}
                >
                  {coverUrl && (
                    <>
                      <img
                        src={coverUrl}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030d27]/88 via-[#041335]/74 to-[#030d27]/90" />
                    </>
                  )}
                  <div className="relative z-10">
                    <RankMedalBadge rank={rank} />
                  </div>

                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/55 bg-[#030e27]">
                    <img
                      src={form.portraitUrl}
                      alt={entry.digimonName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {entry.digimonName}
                      </span>
                      <span className="rounded border border-amber-300/50 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-amber-200">
                        {entry.hatchGrade}/5 · {entry.hatchSizePct}%
                      </span>
                      {isSelf && (
                        <span className="rounded bg-cyan-400/25 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">
                          SEU
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] font-semibold text-cyan-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Tamer: {entry.tamerName} · {form.stage}
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0 text-right">
                    <p className="text-xs font-black tabular-nums text-cyan-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {entry.digimonCombatPower.toLocaleString('pt-BR')} CP
                    </p>
                    <p className="text-[10px] font-extrabold tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Nv. {entry.digimonLevel}
                    </p>
                  </div>
                </div>
              );
            })}

          {/* GUILDS TAB */}
          {activeTab === 'guilds' &&
            (sortedGuilds.length === 0 ? (
              <div className="rounded-xl border border-cyan-400/30 bg-[#041335] p-6 text-center">
                <Shield className="mx-auto h-8 w-8 text-cyan-300" />
                <p className="mt-2 text-sm font-black text-white">
                  Nenhuma Guilda registrada ainda
                </p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Funde ou participe de uma Guilda no menu Guild para aparecer no ranking oficial do servidor!
                </p>
              </div>
            ) : (
              sortedGuilds.map((guild, idx) => {
                const rank = idx + 1;
                const isMine = playerGuild?.guildId === guild.guildId;
                return (
                  <div
                    key={guild.guildId}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                      isMine
                        ? 'border-amber-300/80 bg-gradient-to-r from-[#133f94] to-[#082258] shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                        : 'border-cyan-400/25 bg-[#041335]/90'
                    }`}
                  >
                    <RankMedalBadge rank={rank} />

                    {guild.emblemPhotoUrl ? (
                      <img
                        src={guild.emblemPhotoUrl}
                        alt={guild.name}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 shrink-0 rounded-xl border border-cyan-300/70 object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black ${GUILD_SHIELD_COLORS[guild.emblemColor]}`}
                      >
                        {guild.tag}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-black text-white">
                          [{guild.tag}] {guild.name}
                        </span>
                        {isMine && (
                          <span className="rounded bg-cyan-400/25 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">
                            SUA GUILDA
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px] font-semibold text-cyan-200/80">
                        Mestre: {guild.masterName} · {guild.memberCount}/{guild.maxMembers} membros
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-black tabular-nums text-amber-200">
                        Nv. {guild.level}
                      </p>
                      <p className="text-[9.5px] font-bold tabular-nums text-emerald-300">
                        {guild.totalKills.toLocaleString('pt-BR')} abates ({guild.dailyKills} hoje)
                      </p>
                    </div>
                  </div>
                );
              })
            ))}

          {/* INVITES TAB (Mensal & Geral) */}
          {activeTab === 'invites' && (
            <>
              <div className="rounded-xl border border-amber-300/45 bg-gradient-to-r from-[#241604]/85 via-[#071e52]/95 to-[#041336]/95 px-3 py-2 text-[10.5px] text-sky-100">
                <span className="font-black text-amber-200">
                  {inviteSort === 'monthly'
                    ? `Rank Mensal de Convites — ${inviteMonthLabel}`
                    : 'Rank Geral de Convites (Todos os Tempos)'}
                </span>
                <p className="mt-0.5 text-[10px] text-sky-200/85">
                  Compartilhe seu link na aba <strong>Convites</strong> em{' '}
                  <strong>Amigos</strong>. Cada conta indicada conta na hora e
                  rende <strong>10% em DL Din</strong> nas recargas do amigo!
                </p>
              </div>

              {displayedInviters.length === 0 ? (
                <div className="rounded-xl border border-cyan-400/30 bg-[#041335] p-6 text-center">
                  <Gift className="mx-auto h-8 w-8 text-amber-300" />
                  <p className="mt-2 text-sm font-black text-white">
                    Nenhum convite registrado neste período ainda
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Seja o primeiro a aparecer no topo compartilhando seu link
                    de convite em Amigos → Convites!
                  </p>
                </div>
              ) : (
                displayedInviters.map((entry, idx) => {
                  const rank = idx + 1;
                  const isSelf = entry.ownerUid === selfPlayer.userId;
                  const coverUrl = isValidCoverPhotoDataUrl(entry.tamerCoverUrl)
                    ? entry.tamerCoverUrl
                    : null;
                  const primaryCount =
                    inviteSort === 'monthly'
                      ? entry.effectiveMonthlyInvites
                      : entry.totalInvites;
                  return (
                    <div
                      key={`inv-${entry.ownerUid}`}
                      className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 transition ${
                        isSelf
                          ? 'border-amber-300/80 bg-gradient-to-r from-[#133f94] to-[#082258] shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                          : 'border-cyan-400/25 bg-[#041335]/90'
                      }`}
                    >
                      {coverUrl && (
                        <>
                          <img
                            src={coverUrl}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030d27]/88 via-[#041335]/72 to-[#030d27]/90" />
                        </>
                      )}

                      <div className="relative z-10">
                        <RankMedalBadge rank={rank} />
                      </div>

                      <div className="relative z-10 shrink-0 rounded-full border border-cyan-300/60 bg-[#030e27] p-0.5">
                        <TamerPortraitAvatar
                          tamerId={entry.characterId}
                          tamerName={entry.tamerName}
                          customPhotoUrl={entry.tamerPhotoUrl}
                          sizeClass="h-10 w-10"
                        />
                      </div>

                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {entry.tamerName}
                          </span>
                          {entry.isGm && (
                            <span className="rounded border border-amber-300/70 bg-amber-500/25 px-1.5 py-0.5 text-[9px] font-black text-amber-200">
                              GM
                            </span>
                          )}
                          {isSelf && (
                            <span className="rounded bg-cyan-400/25 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10px] font-semibold text-cyan-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          {inviteSort === 'monthly'
                            ? `Total geral: ${entry.totalInvites.toLocaleString('pt-BR')} convidado(s)`
                            : `Neste mês: ${entry.effectiveMonthlyInvites.toLocaleString('pt-BR')} convidado(s)`}
                        </p>
                      </div>

                      <div className="relative z-10 shrink-0 text-right">
                        <p className="text-xs font-black tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          {primaryCount.toLocaleString('pt-BR')}{' '}
                          {primaryCount === 1 ? 'convidado' : 'convidados'}
                        </p>
                        {entry.totalCommissionEarned > 0 && (
                          <p className="text-[9.5px] font-bold tabular-nums text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            +{entry.totalCommissionEarned.toLocaleString('pt-BR')} DL Din
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
