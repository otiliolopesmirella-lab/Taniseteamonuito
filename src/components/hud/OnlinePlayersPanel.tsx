import { memo, useState } from 'react';
import {
  Crown,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  RemoteWorldPlayer,
  SharedWorldMapId,
  WorldSyncStatus,
} from '../../services/worldPresenceService';
import { getDigimonFormProfile } from '../../types/digimon';
import { TAMER_CHARACTERS } from '../../sprites/tamerSprites';

interface OnlinePlayersBadgeProps {
  currentMapId: SharedWorldMapId;
  localTamerName: string;
  localIsGm: boolean;
  localLevel: number;
  localDigimonName: string;
  remotePlayers: RemoteWorldPlayer[];
  syncStatus: WorldSyncStatus;
  onSelectPlayer: (player: RemoteWorldPlayer) => void;
  onMeetPlayer: (player: RemoteWorldPlayer) => void;
  onInviteParty?: (player: RemoteWorldPlayer) => void;
}

const MAP_LABELS: Record<SharedWorldMapId, string> = {
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

export const OnlinePlayersBadge = memo(function OnlinePlayersBadge({
  currentMapId,
  localTamerName,
  localIsGm,
  localLevel,
  localDigimonName,
  remotePlayers,
  syncStatus,
  onSelectPlayer,
  onMeetPlayer,
}: OnlinePlayersBadgeProps) {
  const [open, setOpen] = useState(false);

  const sameMapPlayers = remotePlayers.filter((p) => p.mapId === currentMapId);
  const otherMapPlayers = remotePlayers.filter((p) => p.mapId !== currentMapId);
  const totalOnline = remotePlayers.length + 1;
  const sameMapCount = sameMapPlayers.length + 1;

  const dotColor =
    syncStatus === 'error'
      ? 'bg-rose-400'
      : syncStatus === 'connecting'
        ? 'bg-amber-300'
        : 'bg-emerald-400';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto relative flex flex-col items-end select-none"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Ver jogadores online no Mundo Digital"
        className="flex items-center gap-1.5 rounded-full border border-emerald-400/65 bg-[#051844]/95 px-2.5 py-1 text-[10px] font-extrabold text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.34)] transition hover:border-emerald-300 hover:bg-[#09296b] active:scale-95"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
        </span>
        <Users className="h-3 w-3 text-emerald-300" />
        <span className="tabular-nums">
          {sameMapCount} aqui · {totalOnline} online
        </span>
      </button>

      {open && (
        <div className="dmo-frame mt-1.5 w-[258px] overflow-hidden rounded-xl shadow-[0_12px_36px_rgba(2,8,28,0.92)] sm:w-[284px]">
          <div className="flex items-center justify-between border-b border-cyan-300/40 bg-gradient-to-b from-[#0f52cc] to-[#072a76] px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[11px] font-black tracking-wide text-white">
                Jogadores Online ({totalOnline})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar lista de jogadores online"
              className="rounded p-0.5 text-cyan-100 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[270px] space-y-2 overflow-y-auto bg-[#03102e]/95 p-2 text-[11px]">
            {/* Same Map Section */}
            <div>
              <p className="mb-1 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-emerald-300">
                <MapPin className="h-3 w-3" />
                <span>
                  Neste Mapa — {MAP_LABELS[currentMapId]} ({sameMapCount})
                </span>
              </p>

              <div className="space-y-1">
                {/* Local Player Row */}
                <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-400/40 bg-cyan-950/50 px-2 py-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {localIsGm && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-300" />
                      )}
                      <span className="truncate font-extrabold text-cyan-100">
                        {localTamerName}
                      </span>
                      <span className="rounded bg-cyan-500/25 px-1 text-[8.5px] font-bold text-cyan-200">
                        Você
                      </span>
                    </div>
                    <p className="truncate text-[9.5px] text-sky-200/80">
                      Lv.{localLevel} · {localDigimonName}
                    </p>
                  </div>
                </div>

                {sameMapPlayers.map((p) => {
                  const form = getDigimonFormProfile(p.digimonFormId);
                  return (
                    <div
                      key={p.uid}
                      className="flex items-center justify-between gap-1.5 rounded-lg border border-emerald-400/30 bg-[#061b48]/90 px-2 py-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlayer(p);
                          setOpen(false);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1">
                          {p.isGm && (
                            <Crown className="h-3 w-3 shrink-0 text-amber-300" />
                          )}
                          <span
                            className={`truncate font-extrabold ${
                              p.isGm ? 'text-amber-200' : 'text-white'
                            }`}
                          >
                            {p.tamerName}
                          </span>
                        </div>
                        <p className="truncate text-[9.5px] text-emerald-200/85">
                          Lv.{p.tamerLevel} · {form.name} (Lv.{p.digimonLevel})
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onMeetPlayer(p);
                          setOpen(false);
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-300/60 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-100 hover:bg-emerald-500/35"
                      >
                        <LocateFixed className="h-2.5 w-2.5" />
                        <span>Encontrar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Map Section */}
            {otherMapPlayers.length > 0 && (
              <div className="border-t border-cyan-500/25 pt-2">
                <p className="mb-1 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-amber-300">
                  <Navigation className="h-3 w-3" />
                  <span>Em Outro Mapa ({otherMapPlayers.length})</span>
                </p>

                <div className="space-y-1">
                  {otherMapPlayers.map((p) => {
                    const form = getDigimonFormProfile(p.digimonFormId);
                    return (
                      <div
                        key={p.uid}
                        className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/25 bg-[#07183c]/85 px-2 py-1"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            {p.isGm && (
                              <Crown className="h-3 w-3 shrink-0 text-amber-300" />
                            )}
                            <span className="truncate font-extrabold text-amber-100">
                              {p.tamerName}
                            </span>
                          </div>
                          <p className="truncate text-[9.5px] text-sky-200/75">
                            {MAP_LABELS[p.mapId]} · {form.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onMeetPlayer(p);
                            setOpen(false);
                          }}
                          className="shrink-0 rounded-md border border-amber-300/60 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-200 hover:bg-amber-500/35"
                        >
                          Ir até lá
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {remotePlayers.length === 0 && (
              <p className="rounded-lg border border-cyan-400/20 bg-[#041438] px-2.5 py-2 text-center text-[10px] leading-relaxed text-sky-200/80">
                {syncStatus === 'error'
                  ? 'Reconectando ao servidor mundial...'
                  : 'Conectado ao mapa compartilhado! Entre com 2 contas diferentes no mesmo link para ver os personagens juntos ao vivo.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

interface RemotePlayerInspectorCardProps {
  player: RemoteWorldPlayer;
  partyMemberUids?: readonly string[];
  partyFull?: boolean;
  onInviteParty?: (player: RemoteWorldPlayer) => void;
  onMeetPlayer: (player: RemoteWorldPlayer) => void;
  onWaveHello: (targetName: string) => void;
  onClose: () => void;
}

export const RemotePlayerInspectorCard = memo(function RemotePlayerInspectorCard({
  player,
  partyMemberUids = [],
  partyFull = false,
  onInviteParty,
  onMeetPlayer,
  onWaveHello,
  onClose,
}: RemotePlayerInspectorCardProps) {
  const form = getDigimonFormProfile(player.digimonFormId);
  const tamerMeta =
    TAMER_CHARACTERS.find((c) => c.id === player.characterId) ??
    TAMER_CHARACTERS[0];
  const alreadyInParty = partyMemberUids.includes(player.uid);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`Perfil do jogador ${player.tamerName}`}
      className="pointer-events-auto absolute left-1/2 top-[116px] z-35 w-[min(92vw,328px)] -translate-x-1/2 rounded-2xl border-2 border-emerald-400/80 bg-[#051844]/98 p-3 shadow-[0_0_28px_rgba(16,185,129,0.45)] sm:top-[106px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={form.portraitUrl}
            alt={form.name}
            className="h-11 w-11 shrink-0 rounded-xl border border-cyan-300/60 bg-[#082463] object-contain p-1"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {player.isGm && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-400/25 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                  <Crown className="h-2.5 w-2.5" />
                  GM
                </span>
              )}
              <h3 className="truncate text-sm font-black text-white">
                {player.tamerName}
              </h3>
            </div>
            <p className="truncate text-[10.5px] font-semibold text-cyan-200">
              {tamerMeta.shortLabel} · Tamer Lv.{player.tamerLevel}
              {player.guildName ? ` · [${player.guildName}]` : ''}
            </p>
            <p className="truncate text-[10.5px] font-bold text-amber-200">
              Parceiro: {form.name} ({form.stage}) · Lv.{player.digimonLevel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar perfil do jogador"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#082252] text-cyan-200 hover:bg-sky-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {onInviteParty && (
          <button
            type="button"
            disabled={alreadyInParty || partyFull}
            onClick={() => {
              onInviteParty(player);
              onClose();
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-extrabold shadow transition active:scale-95 ${
              alreadyInParty || partyFull
                ? 'cursor-not-allowed border-slate-500/50 bg-slate-800/80 text-slate-300'
                : 'border-amber-300/85 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>
              {alreadyInParty
                ? 'Na Party'
                : partyFull
                  ? 'Party Cheia'
                  : 'Convidar Party'}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onMeetPlayer(player);
            onClose();
          }}
          className="flex items-center justify-center gap-1 rounded-xl border border-cyan-300/70 bg-[#0a2f78] px-3 py-1.5 text-[11px] font-extrabold text-cyan-100 shadow hover:bg-[#0d3d99] active:scale-95"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          <span>Ir até</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onWaveHello(player.tamerName);
            onClose();
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300/70 bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow hover:brightness-110 active:scale-95"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Olá</span>
        </button>
      </div>
    </div>
  );
});
