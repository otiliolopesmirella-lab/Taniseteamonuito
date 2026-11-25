import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Flame,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { DATA_FOREST_MAP_ID } from '../../maps/dataForestMap';
import type { WorldBossLiveState } from '../../services/worldBossService';
import { getWildDigimonPortraitUrl } from '../../sprites/wildDigimonSprites';

export interface WorldBossAnnouncement {
  id: number;
  kind: 'spawn' | 'defeat';
  bossName: string;
  level: number;
  mvpName: string | null;
  mvpDamage: number;
  raiderCount: number;
}

export function formatBossRespawnClock(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface WorldBossHudCardProps {
  bossState: WorldBossLiveState;
  bossNowMs: number;
  currentMapId: string;
  localTamerName: string;
  rankingDismissed: boolean;
  onDismissRanking: () => void;
  onNavigateToBoss: () => void;
}

export function WorldBossHudCard({
  bossState,
  bossNowMs,
  currentMapId,
  localTamerName,
  rankingDismissed,
  onDismissRanking,
  onNavigateToBoss,
}: WorldBossHudCardProps) {
  const [rankingExpanded, setRankingExpanded] = useState(false);

  const portraitUrl = getWildDigimonPortraitUrl('kuwagamon');
  const hpPct = Math.max(
    0,
    Math.min(100, (bossState.hp / Math.max(1, bossState.maxHp)) * 100)
  );
  const remainingMs = Math.max(0, bossState.respawnAtMs - bossNowMs);
  const inDataForest = currentMapId === DATA_FOREST_MAP_ID;

  const sortedContributors = useMemo(() => {
    const list = Object.entries(bossState.contributors)
      .map(([uid, entry]) => ({
        uid,
        tamerName: entry.tamerName,
        damage: entry.damage,
      }))
      .filter((entry) => entry.damage > 0)
      .sort((a, b) => b.damage - a.damage);
    const totalDamage = list.reduce((acc, item) => acc + item.damage, 0);
    return {
      list,
      totalDamage: Math.max(1, totalDamage),
    };
  }, [bossState.contributors]);

  const showRanking =
    sortedContributors.list.length > 0 && !rankingDismissed;

  const leader = sortedContributors.list[0];

  if (currentMapId !== bossState.mapId) {
    return null;
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex w-[136px] flex-col gap-1 select-none min-[390px]:w-[150px] sm:w-[162px]"
    >
      {/* Compact Boss Portrait Card directly below Minimap */}
      <button
        type="button"
        onClick={onNavigateToBoss}
        title={
          bossState.alive
            ? inDataForest
              ? 'Ir até a Grande Árvore (Boss Kuwagamon)'
              : 'Kuwagamon está vivo na Grande Árvore (Floresta de Dados)'
            : `Boss derrotado · Renasce em ${formatBossRespawnClock(remainingMs)}`
        }
        className={`group flex w-full items-center gap-1.5 rounded-xl border p-1.5 text-left transition-all active:scale-[0.98] ${
          bossState.alive
            ? 'border-amber-300/80 bg-gradient-to-b from-[#2b0916]/94 via-[#180612]/95 to-[#0b0410]/96 shadow-[0_0_16px_rgba(239,68,68,0.42)] hover:border-amber-200'
            : 'border-cyan-400/55 bg-gradient-to-b from-[#071b48]/94 to-[#030d27]/96 shadow-[0_0_12px_rgba(0,145,255,0.28)] hover:border-cyan-300'
        }`}
      >
        {/* Boss Portrait */}
        <div
          className={`relative flex h-8.5 w-8.5 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 sm:h-9.5 sm:w-9.5 ${
            bossState.alive
              ? 'border-amber-300/80 bg-gradient-to-b from-[#5c0d16] to-[#1a050b] shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'border-cyan-400/40 bg-gradient-to-b from-[#0b1f4d] to-[#040c21]'
          }`}
        >
          {portraitUrl ? (
            <img
              src={portraitUrl}
              alt={bossState.name}
              className={`max-h-full max-w-full object-contain transition ${
                bossState.alive ? 'group-hover:scale-105' : 'opacity-45 grayscale'
              }`}
            />
          ) : (
            <Flame className="h-4 w-4 text-rose-400" />
          )}

          <span
            className={`absolute bottom-0 right-0 rounded-tl px-1 py-[0.5px] text-[6.5px] font-black uppercase leading-none ${
              bossState.alive
                ? 'bg-rose-600/95 text-amber-200'
                : 'bg-slate-800/95 text-cyan-200'
            }`}
          >
            BOSS
          </span>
        </div>

        {/* Boss Name + HP Bar or 1h Respawn Timer */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`truncate text-[9.5px] font-black tracking-wide sm:text-[10px] ${
                bossState.alive ? 'text-amber-200' : 'text-slate-200'
              }`}
            >
              {bossState.name}
            </span>
            <span className="shrink-0 text-[8px] font-black tabular-nums text-amber-300 sm:text-[8.5px]">
              Nv.{bossState.level}
            </span>
          </div>

          {bossState.alive ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full border border-rose-400/45 bg-[#040612]">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-[width] duration-200"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-1 text-[7.5px] font-bold tabular-nums sm:text-[8px]">
                <span className="truncate text-rose-100/95">
                  {bossState.hp.toLocaleString('pt-BR')}
                </span>
                <span className="shrink-0 text-amber-300/95">
                  {inDataForest ? 'Árvore →' : 'Floresta'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 text-[8.5px] font-extrabold tabular-nums text-cyan-200 sm:text-[9px]">
              <Clock className="h-2.5 w-2.5 shrink-0 text-cyan-300" />
              <span className="truncate">
                Nasce {formatBossRespawnClock(remainingMs)}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Damage Ranking Bar (appears automatically when players hit the Boss; closeable after defeat) */}
      {showRanking && (
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-amber-300/70 bg-[#05153b]/95 shadow-[0_0_16px_rgba(251,191,36,0.28)]">
          {/* Compact Clickable Ranking Header + Close Button */}
          <div className="flex items-center justify-between gap-1 border-b border-cyan-400/25 bg-gradient-to-r from-[#0d3380] to-[#071f54] px-1.5 py-1">
            <button
              type="button"
              onClick={() => setRankingExpanded((prev) => !prev)}
              aria-expanded={rankingExpanded}
              className="flex min-w-0 flex-1 items-center gap-1 text-left"
              title="Clique para ver todos os jogadores batendo no Boss"
            >
              <Trophy className="h-3 w-3 shrink-0 text-amber-300" />
              <span className="truncate text-[9px] font-black tracking-wide text-amber-200 sm:text-[9.5px]">
                Ranking
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-cyan-500/20 px-1 py-[0.5px] text-[7.5px] font-black tabular-nums text-cyan-200">
                <Users className="h-2 w-2" />
                {sortedContributors.list.length}
              </span>
              {rankingExpanded ? (
                <ChevronUp className="ml-auto h-3 w-3 shrink-0 text-cyan-200" />
              ) : (
                <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-cyan-200" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRankingExpanded(false);
                onDismissRanking();
              }}
              aria-label="Fechar ranking de dano"
              title="Fechar ranking de dano"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-cyan-300/40 bg-[#041233] text-cyan-100 transition hover:border-rose-300 hover:bg-rose-600/80 active:scale-95"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Preview Line (when collapsed) */}
          {!rankingExpanded && leader && (
            <button
              type="button"
              onClick={() => setRankingExpanded(true)}
              className="flex items-center justify-between gap-1 px-1.5 py-1 text-left text-[8.5px] hover:bg-white/5"
            >
              <span className="flex min-w-0 items-center gap-1 font-extrabold text-amber-200">
                <span className="shrink-0 text-amber-300">1º</span>
                <span className="truncate">{leader.tamerName}</span>
              </span>
              <span className="shrink-0 font-black tabular-nums text-cyan-200">
                {leader.damage.toLocaleString('pt-BR')}
              </span>
            </button>
          )}

          {/* Expanded Full Damage Ranking List (ALL players attacking the Boss) */}
          {rankingExpanded && (
            <div className="max-h-[168px] space-y-1 overflow-y-auto p-1.5">
              {sortedContributors.list.map((entry, idx) => {
                const rank = idx + 1;
                const pct = Math.round(
                  (entry.damage / sortedContributors.totalDamage) * 100
                );
                const isSelf =
                  entry.tamerName.toLowerCase() === localTamerName.toLowerCase();

                const rankBadgeColor =
                  rank === 1
                    ? 'bg-amber-400 text-slate-950'
                    : rank === 2
                      ? 'bg-slate-200 text-slate-950'
                      : rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-[#0c2d6e] text-cyan-200';

                return (
                  <div
                    key={entry.uid}
                    className={`rounded-md border px-1.5 py-1 ${
                      isSelf
                        ? 'border-cyan-300/75 bg-[#0c317a]/90'
                        : 'border-cyan-400/20 bg-[#031030]/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[8.5px] sm:text-[9px]">
                      <span className="flex min-w-0 items-center gap-1">
                        <span
                          className={`flex h-3.5 min-w-[14px] shrink-0 items-center justify-center rounded px-0.5 text-[7.5px] font-black tabular-nums ${rankBadgeColor}`}
                        >
                          {rank}º
                        </span>
                        <span
                          className={`truncate font-extrabold ${
                            rank === 1 ? 'text-amber-200' : 'text-white'
                          }`}
                        >
                          {entry.tamerName}
                        </span>
                      </span>
                      <span className="shrink-0 font-black tabular-nums text-cyan-200">
                        {entry.damage.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-1">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#020718]">
                        <div
                          className={`h-full rounded-full ${
                            rank === 1
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-200'
                              : 'bg-gradient-to-r from-cyan-500 to-sky-300'
                          }`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[7px] font-bold tabular-nums text-cyan-300/90">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {!bossState.alive && (
                <p className="pt-0.5 text-center text-[7.5px] font-bold text-cyan-200/80">
                  Boss derrotado · Clique no X para fechar
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WorldBossGlobalBannerProps {
  announcement: WorldBossAnnouncement;
  inDataForest: boolean;
  onGoToTree: () => void;
  onClose: () => void;
}

export function WorldBossGlobalBanner({
  announcement,
  inDataForest,
  onGoToTree,
  onClose,
}: WorldBossGlobalBannerProps) {
  const portraitUrl = getWildDigimonPortraitUrl('kuwagamon');
  const isSpawn = announcement.kind === 'spawn';

  return (
    <div
      role="status"
      aria-live="polite"
      onPointerDown={(e) => e.stopPropagation()}
      className="animate-dmo-window pointer-events-auto fixed left-1/2 top-[174px] z-40 w-[min(92vw,420px)] -translate-x-1/2 select-none sm:top-[116px]"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-[1.5px] ${
          isSpawn
            ? 'border-amber-300 bg-gradient-to-b from-rose-500/80 via-amber-400/50 to-rose-700/80 shadow-[0_0_42px_rgba(239,68,68,0.65)]'
            : 'border-amber-200 bg-gradient-to-b from-amber-300/85 via-cyan-400/55 to-blue-600/80 shadow-[0_0_42px_rgba(250,204,21,0.6)]'
        }`}
      >
        <div
          className={`relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 sm:px-4 sm:py-3 ${
            isSpawn
              ? 'bg-gradient-to-r from-[#2e0712]/96 via-[#1a050d]/96 to-[#0c0416]/96'
              : 'bg-gradient-to-r from-[#0a2768]/96 via-[#061844]/96 to-[#030b24]/96'
          }`}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar aviso de boss"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg border border-white/25 bg-black/35 text-white/85 transition hover:bg-black/60 hover:text-white active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Boss Portrait */}
          <div
            className={`relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 p-1 sm:h-15 sm:w-15 ${
              isSpawn
                ? 'border-amber-300 bg-gradient-to-b from-[#69101a] to-[#1a0409] shadow-[0_0_18px_rgba(239,68,68,0.7)]'
                : 'border-amber-200 bg-gradient-to-b from-[#133d99] to-[#041133] shadow-[0_0_18px_rgba(250,204,21,0.55)]'
            }`}
          >
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={announcement.bossName}
                className={`max-h-full max-w-full object-contain ${
                  isSpawn ? '' : 'opacity-80'
                }`}
              />
            ) : (
              <Crown className="h-7 w-7 text-amber-300" />
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-tl-lg border-l border-t border-amber-200/70 ${
                isSpawn ? 'bg-rose-600 text-amber-200' : 'bg-amber-400 text-slate-950'
              }`}
            >
              {isSpawn ? (
                <Swords className="h-3 w-3" />
              ) : (
                <Trophy className="h-3 w-3" />
              )}
            </span>
          </div>

          {/* Banner Copy */}
          <div className="min-w-0 flex-1 pr-5">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${
                  isSpawn
                    ? 'bg-rose-600/90 text-amber-200'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {isSpawn ? (
                  <>
                    <Flame className="h-3 w-3" />
                    Raid Boss Apareceu!
                  </>
                ) : (
                  <>
                    <Crown className="h-3 w-3" />
                    Raid Boss Derrotado!
                  </>
                )}
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-black italic tracking-wide text-white drop-shadow sm:text-base">
              {announcement.bossName}{' '}
              <span className="text-xs font-extrabold text-amber-300">
                Nv.{announcement.level}
              </span>
            </p>

            {isSpawn ? (
              <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10.5px] font-semibold text-rose-100/95 sm:text-xs">
                  Nasceu na Grande Árvore · Floresta de Dados!
                </p>
                {inDataForest && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToTree();
                      onClose();
                    }}
                    className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                  >
                    Ir à Árvore
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-0.5 space-y-0.5 text-[10.5px] sm:text-xs">
                {announcement.mvpName ? (
                  <p className="truncate font-bold text-amber-200">
                    1º Dano: {announcement.mvpName} (
                    {announcement.mvpDamage.toLocaleString('pt-BR')})
                  </p>
                ) : null}
                <p className="font-semibold text-cyan-200">
                  {announcement.raiderCount} Tamer
                  {announcement.raiderCount > 1 ? 's' : ''} · Próximo nascimento em 1h
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
