import { memo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  LogOut,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type { GuildInviteRecord } from '../../services/guildService';
import {
  MAX_PARTY_MEMBERS,
  type PartyInviteRecord,
  type PartyRecord,
} from '../../services/partyService';
import { getDigimonFormProfile } from '../../types/digimon';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';

interface PartyHudPanelProps {
  party: PartyRecord | null;
  incomingInvites: readonly PartyInviteRecord[];
  incomingGuildInvites?: readonly GuildInviteRecord[];
  actorUid: string;
  currentMapId: string;
  onAcceptInvite: (invite: PartyInviteRecord) => void;
  onDeclineInvite: (inviteId: string) => void;
  onAcceptGuildInvite?: (invite: GuildInviteRecord) => void;
  onDeclineGuildInvite?: (inviteId: string) => void;
  onLeaveParty: () => void;
  onKickMember: (targetUid: string) => void;
}

export const PartyHudPanel = memo(function PartyHudPanel({
  party,
  incomingInvites,
  incomingGuildInvites = [],
  actorUid,
  currentMapId,
  onAcceptInvite,
  onDeclineInvite,
  onAcceptGuildInvite,
  onDeclineGuildInvite,
  onLeaveParty,
  onKickMember,
}: PartyHudPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const members = party
    ? party.memberUids
        .map((uid) => party.members[uid])
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
    : [];
  const isLeader = party?.leaderUid === actorUid;
  const hasAnyInvites =
    incomingInvites.length > 0 || incomingGuildInvites.length > 0;

  return (
    <>
      {/* Incoming Party & Guild Invite Prompt(s) with explicit Sim / Não choice */}
      {hasAnyInvites && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="pointer-events-auto fixed left-1/2 top-[116px] z-40 flex w-[min(94vw,384px)] -translate-x-1/2 flex-col gap-2 sm:top-[106px]"
        >
          {/* Party Invites */}
          {incomingInvites.slice(0, 2).map((inv) => {
            const digiForm = getDigimonFormProfile(inv.fromDigimonFormId);
            return (
              <div
                key={inv.inviteId}
                role="alert"
                className="animate-dmo-window rounded-2xl border-2 border-cyan-300/85 bg-[#051a48]/98 p-3 shadow-[0_0_26px_rgba(34,211,238,0.48)]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex shrink-0 items-center gap-1">
                    <TamerPortraitAvatar
                      tamerId={inv.fromCharacterId}
                      tamerName={inv.fromName}
                      customPhotoUrl={inv.fromPhotoUrl}
                      sizeClass="h-9 w-9 border border-cyan-300/80"
                    />
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-amber-300/70 bg-[#04102b]">
                      <img
                        src={digiForm.portraitUrl}
                        alt={digiForm.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>Convite de Party</span>
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-bold leading-snug text-white">
                      <span className="font-black text-amber-200">
                        {inv.fromName}
                      </span>{' '}
                      <span className="text-[10.5px] text-amber-300">
                        (Nv.{inv.fromTamerLevel})
                      </span>{' '}
                      convidou você para a Party. Deseja aceitar?
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAcceptInvite(inv)}
                    className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-emerald-300/85 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-emerald-500 active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                    <span>Sim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineInvite(inv.inviteId)}
                    className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-rose-400/70 bg-rose-900/80 px-3 py-1.5 text-xs font-black text-rose-100 hover:bg-rose-800 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5 stroke-[2.8]" />
                    <span>Não</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Guild Invites */}
          {incomingGuildInvites.slice(0, 2).map((inv) => (
            <div
              key={inv.inviteId}
              role="alert"
              className="animate-dmo-window rounded-2xl border-2 border-indigo-300/90 bg-[#0c1445]/98 p-3 shadow-[0_0_26px_rgba(129,140,248,0.48)]"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/75 bg-indigo-500/20 text-indigo-200">
                  <Shield className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Convite de Guilda
                  </p>
                  <p className="mt-0.5 text-[11.5px] font-bold leading-snug text-white">
                    <span className="font-black text-amber-200">
                      {inv.fromName}
                    </span>{' '}
                    convidou você para entrar na Guilda{' '}
                    <span className="font-black text-indigo-200">
                      [{inv.guildTag}] {inv.guildName}
                    </span>{' '}
                    <span className="text-[10.5px] text-cyan-200">
                      (Nv.{inv.guildLevel})
                    </span>
                    . Deseja aceitar?
                  </p>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAcceptGuildInvite?.(inv)}
                  className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-emerald-300/85 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-emerald-500 active:scale-95"
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                  <span>Sim</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeclineGuildInvite?.(inv.inviteId)}
                  className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-rose-400/70 bg-rose-900/80 px-3 py-1.5 text-xs font-black text-rose-100 hover:bg-rose-800 active:scale-95"
                >
                  <X className="h-3.5 w-3.5 stroke-[2.8]" />
                  <span>Não</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Party HUD Column */}
      {party && members.length > 0 && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="pointer-events-auto w-[198px] overflow-hidden rounded-xl border border-cyan-300/60 bg-[#04143a]/90 shadow-[0_6px_22px_rgba(2,10,32,0.82)] select-none sm:w-[228px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-1 border-b border-cyan-400/30 bg-gradient-to-r from-[#0b3e9e] to-[#062261] px-2 py-1">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex min-w-0 flex-1 items-center gap-1 text-left"
            >
              <Users className="h-3 w-3 shrink-0 text-cyan-300" />
              <span className="truncate text-[10px] font-black tracking-wide text-white">
                Party ({members.length}/{MAX_PARTY_MEMBERS})
              </span>
              {collapsed ? (
                <ChevronDown className="h-3 w-3 shrink-0 text-cyan-200" />
              ) : (
                <ChevronUp className="h-3 w-3 shrink-0 text-cyan-200" />
              )}
            </button>

            <button
              type="button"
              onClick={onLeaveParty}
              title={
                isLeader && members.length === 1
                  ? 'Encerrar Party'
                  : 'Sair da Party'
              }
              className="flex items-center gap-0.5 rounded border border-rose-300/55 bg-rose-900/70 px-1.5 py-0.5 text-[9px] font-black text-rose-100 hover:bg-rose-700 active:scale-95"
            >
              <LogOut className="h-2.5 w-2.5" />
              <span>Sair</span>
            </button>
          </div>

          {!collapsed && (
            <div className="space-y-1 p-1.5">
              {members.map((m) => {
                const digi = getDigimonFormProfile(m.digimonFormId);
                const hpPct = Math.max(
                  0,
                  Math.min(100, (m.hp / Math.max(1, m.maxHp)) * 100)
                );
                const isMemberLeader = m.uid === party.leaderUid;
                const isSameMap = m.mapId === currentMapId;
                const isSelf = m.uid === actorUid;

                return (
                  <div
                    key={m.uid}
                    className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1 ${
                      isSelf
                        ? 'border-cyan-300/60 bg-[#08296e]/90'
                        : 'border-cyan-400/25 bg-[#03102e]/88'
                    }`}
                  >
                    {/* Tamer Avatar Photo + Partner Digimon Portrait side by side */}
                    <div className="flex shrink-0 items-center gap-1">
                      <TamerPortraitAvatar
                        tamerId={m.characterId}
                        tamerName={m.tamerName}
                        customPhotoUrl={m.tamerPhotoUrl}
                        sizeClass="h-7 w-7 border border-cyan-300/75"
                      />
                      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-amber-300/55 bg-[#04102b]">
                        <img
                          src={digi.portraitUrl}
                          alt={m.digimonName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain p-0.5"
                        />
                      </div>
                    </div>

                    {/* Player Name + Level + HP Bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {isMemberLeader && (
                          <Crown className="h-2.5 w-2.5 shrink-0 text-amber-300" />
                        )}
                        <span
                          className={`truncate text-[10px] font-black ${
                            isSelf ? 'text-cyan-100' : 'text-white'
                          }`}
                        >
                          {m.tamerName}
                        </span>
                        <span className="shrink-0 text-[8.5px] font-extrabold tabular-nums text-amber-300">
                          Nv.{m.tamerLevel}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-1">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-cyan-400/30 bg-[#020714]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-[width] duration-200"
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        <span
                          className={`shrink-0 text-[7.5px] font-bold ${
                            isSameMap ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {isSameMap ? 'Mapa' : 'Longe'}
                        </span>
                      </div>
                    </div>

                    {isLeader && !isSelf && (
                      <button
                        type="button"
                        onClick={() => onKickMember(m.uid)}
                        title={`Remover ${m.tamerName} da Party`}
                        aria-label={`Remover ${m.tamerName} da Party`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-rose-400/40 bg-rose-950/70 text-rose-200 hover:bg-rose-800"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {isLeader && members.length < MAX_PARTY_MEMBERS && (
                <p className="px-1 pt-0.5 text-[9px] font-semibold text-cyan-200/80">
                  Líder: clique em um player ou use{' '}
                  <span className="font-black text-amber-200">/invite Nome</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
});
