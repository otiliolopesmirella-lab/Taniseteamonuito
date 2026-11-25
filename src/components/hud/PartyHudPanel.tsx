import { memo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  LogOut,
  Users,
  X,
} from 'lucide-react';
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
  actorUid: string;
  currentMapId: string;
  onAcceptInvite: (invite: PartyInviteRecord) => void;
  onDeclineInvite: (inviteId: string) => void;
  onLeaveParty: () => void;
  onKickMember: (targetUid: string) => void;
}

export const PartyHudPanel = memo(function PartyHudPanel({
  party,
  incomingInvites,
  actorUid,
  currentMapId,
  onAcceptInvite,
  onDeclineInvite,
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

  return (
    <>
      {/* Incoming Party Invite Banner(s) */}
      {incomingInvites.length > 0 && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="pointer-events-auto fixed left-1/2 top-[116px] z-40 flex w-[min(92vw,360px)] -translate-x-1/2 flex-col gap-1.5 sm:top-[106px]"
        >
          {incomingInvites.slice(0, 2).map((inv) => {
            const digiForm = getDigimonFormProfile(inv.fromDigimonFormId);
            return (
              <div
                key={inv.inviteId}
                role="alert"
                className="animate-dmo-window flex items-center justify-between gap-2 rounded-2xl border-2 border-cyan-300/85 bg-[#051a48]/96 px-3 py-2 shadow-[0_0_24px_rgba(34,211,238,0.48)]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {/* Tamer Photo + Digimon Portrait side by side */}
                  <div className="flex shrink-0 items-center gap-1">
                    <TamerPortraitAvatar
                      tamerId={inv.fromCharacterId}
                      tamerName={inv.fromName}
                      customPhotoUrl={inv.fromPhotoUrl}
                      sizeClass="h-8 w-8 border border-cyan-300/80"
                    />
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-amber-300/70 bg-[#04102b]">
                      <img
                        src={digiForm.portraitUrl}
                        alt={digiForm.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9.5px] font-black uppercase tracking-wider text-cyan-300">
                      Convite de Party
                    </p>
                    <p className="truncate text-[11px] font-extrabold text-white">
                      {inv.fromName}{' '}
                      <span className="text-amber-300">Nv.{inv.fromTamerLevel}</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onAcceptInvite(inv)}
                    className="flex items-center gap-1 rounded-lg border border-emerald-300/80 bg-emerald-600 px-2 py-1 text-[10px] font-black text-white shadow hover:bg-emerald-500 active:scale-95"
                  >
                    <Check className="h-3 w-3" />
                    <span>Aceitar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineInvite(inv.inviteId)}
                    aria-label="Recusar convite de Party"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-400/60 bg-rose-900/70 text-rose-200 hover:bg-rose-800 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
            </div>
          )}
        </div>
      )}
    </>
  );
});
