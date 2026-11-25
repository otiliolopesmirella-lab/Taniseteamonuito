import {
  AlertTriangle,
  Bell,
  Bug,
  Compass,
  CornerUpLeft,
  Mail,
  Settings,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import type { DwCoinShopOffer } from '../../data/dwCoinShopCatalog';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import {
  getUnlockedArchiveSlots,
  sanitizeDigimonArchive,
  sanitizePartyDigimons,
} from '../../services/archiveService';
import { isCurrentAuthUserBootstrappedGm } from '../../services/gmRoleService';
import type { GuildRecord } from '../../services/guildService';
import type { AutoHuntConfig } from '../../services/autoHuntService';
import {
  computeDerivedDigimonAttributes,
  computeTamerAttributes,
  getUnlockedInventorySlots,
} from '../../services/hudGameService';
import type { ServerExpRatePct } from '../../services/serverConfigService';
import type { RemoteWorldPlayer } from '../../services/worldPresenceService';
import type { AppPreferences } from '../../types/auth';
import type { TamerCharacter, TamerId } from '../../types/character';
import type { DigimonFormId, DigimonFormProfile } from '../../types/digimon';
import type {
  AccountHudPersistence,
  DigimonRuntimeStats,
  EquipmentSlotId,
  HatchQualityGrade,
  HudNotificationItem,
  HudWindowId,
  InventoryItem,
  LiveWorldHudSnapshot,
  TamerRuntimeStats,
} from '../../types/hud';
import { playDigitalTone } from '../../utils/soundFx';
import { PWAInstallButton } from '../PWAInstallButton';
import { AdminTestModal } from './AdminTestModal';
import { AutoHuntModal } from './AutoHuntModal';
import { DigiEggIncubatorModal } from './DigiEggIncubatorModal';
import { DigimonArchiveModal } from './DigimonArchiveModal';
import { DigimonCharacterModal } from './DigimonCharacterModal';
import { DwCoinShopModal } from './DwCoinShopModal';
import { FriendsModal } from './FriendsModal';
import { GuildSystemModal } from './GuildSystemModal';
import { RanksModal } from './RanksModal';
import { TamerCharacterModal } from './TamerCharacterModal';
import { WorldMapModal } from './WorldMapModal';

interface HudWindowsOverlayProps {
  activeWindow: HudWindowId;
  hudAccount: AccountHudPersistence;
  character: TamerCharacter;
  tamerName: string;
  tamerStats: TamerRuntimeStats;
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  inventory: InventoryItem[];
  guildName: string | null;
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  snapshot: LiveWorldHudSnapshot;
  bits: number;
  dCoin: number;
  defeatedTotal: number;
  notifications: HudNotificationItem[];
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onEquipItem: (item: InventoryItem) => void;
  onUnequipSlot: (slot: EquipmentSlotId) => void;
  onUpdateTamerPhoto?: (photoUrl: string | null) => void;
  onUpdateTamerCover?: (coverUrl: string | null) => void;
  onBuyShopItem: (itemKey: string) => void;
  onEvolveDigimon: (targetFormId: DigimonFormId) => void;
  onRequestUnlockEvolution?: (targetFormId: DigimonFormId) => void;
  onExecuteDataInject: (
    eggItemId: string,
    useHatchBackup?: boolean
  ) => {
    ok: boolean;
    outcome: 'success' | 'fail' | 'broken' | 'error';
    message: string;
    newLevel?: number;
    brokeEgg?: boolean;
    usedHatchBackup?: boolean;
    preventedBreak?: boolean;
    updatedEggId?: string;
  };
  onExecuteEggHatch: (eggItemId: string) => {
    ok: boolean;
    message: string;
    hatchedSpecies?: string;
    hatchedGrade?: 3 | 4 | 5;
  };
  onExecuteEggReinforce: (
    eggItemId: string,
    materialItemId: string | null
  ) => {
    ok: boolean;
    message: string;
    newReinforceLevel?: number;
    updatedEggId?: string;
  };
  onSwapArchiveSlot: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onMoveArchiveToParty: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onMovePartyToArchive: (reserveIndex: 0 | 1) => {
    ok: boolean;
    message: string;
  };
  onReleaseArchiveSlot: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onAdminSetDigimonLevel: (level: number) => void;
  onAdminAddDigimonExp: (expAmount: number) => void;
  onAdminPullAnyDigimon: (formId: DigimonFormId, grade: HatchQualityGrade) => void;
  onAdminAddDigimonToParty: (
    formId: DigimonFormId,
    grade: HatchQualityGrade
  ) => void;
  onAdminAddDigimonToArchive: (
    formId: DigimonFormId,
    grade: HatchQualityGrade
  ) => void;
  onAdminUnlockArchiveSlots: (targetUnlockedSlots: number) => void;
  onAdminSimulateEggDrop: (
    eggItemKey: string,
    sourceName: string,
    isBoss?: boolean
  ) => void;
  onAdminSetHatchGrade: (grade: HatchQualityGrade) => void;
  onAdminGrantItem: (itemKey: string, quantity: number, eggHatchLevel?: number) => void;
  onAdminGrantAllDatas: (quantityEach: number) => void;
  onAdminGrantAllEggs: (eggHatchLevel: number) => void;
  onAdminGrantCurrency: (bitsDelta: number, dCoinDelta: number) => void;
  onAdminClearInventory: () => void;
  onAdminSwitchTamer?: (tamerId: TamerId) => void;
  onOpenSelectionFlow?: (screen: 'character-select' | 'digimon-select') => void;
  onAdminRestoreVitals: () => void;
  onTravelToMap: (mapId: PlayableMapId) => void;
  onAdminOpenTutorial?: () => void;
  onAdminResetTutorial?: () => void;
  serverExpRatePct?: ServerExpRatePct;
  onAdminSetServerExpRate?: (rate: ServerExpRatePct) => void;
  playerGuild?: GuildRecord | null;
  actorUid?: string;
  accountKey?: string;
  remotePlayers?: readonly RemoteWorldPlayer[];
  onStartWhisper?: (friendName: string) => void;
  onlinePlayerUids?: string[];
  onlineDigimonByUid?: Record<string, DigimonFormId>;
  onDeductGuildCreationBits?: (costBits: number) => boolean;
  onNotifyImportantEvent?: (title: string, detail: string) => void;
  onBuyDwCoinOffer?: (offer: DwCoinShopOffer) => { ok: boolean; message: string };
  onClearNotifications?: () => void;
  autoHuntConfig?: AutoHuntConfig;
  onUpdateAutoHuntConfig?: (next: AutoHuntConfig) => void;
  isGM: boolean;
  cloudIsGm?: boolean;
  onOpenFeedback?: () => void;
  onConfirmExit: () => void;
  onClose: () => void;
}

export function HudWindowsOverlay({
  activeWindow,
  hudAccount,
  character,
  tamerName,
  tamerStats,
  equippedItems,
  inventory,
  guildName,
  digimon,
  digimonStats,
  snapshot,
  bits,
  dCoin,
  defeatedTotal,
  notifications,
  preferences,
  onUpdatePreferences,
  onEquipItem,
  onUnequipSlot,
  onUpdateTamerPhoto,
  onUpdateTamerCover,
  onBuyShopItem,
  onEvolveDigimon,
  onRequestUnlockEvolution,
  onExecuteDataInject,
  onExecuteEggHatch,
  onExecuteEggReinforce,
  onSwapArchiveSlot,
  onMoveArchiveToParty,
  onMovePartyToArchive,
  onReleaseArchiveSlot,
  onPlayTone,
  onAdminSetDigimonLevel,
  onAdminAddDigimonExp,
  onAdminPullAnyDigimon,
  onAdminAddDigimonToParty,
  onAdminAddDigimonToArchive,
  onAdminUnlockArchiveSlots,
  onAdminSimulateEggDrop,
  onAdminSetHatchGrade,
  onAdminGrantItem,
  onAdminGrantAllDatas,
  onAdminGrantAllEggs,
  onAdminGrantCurrency,
  onAdminClearInventory,
  onAdminSwitchTamer,
  onOpenSelectionFlow,
  onAdminRestoreVitals,
  onTravelToMap,
  onAdminOpenTutorial,
  onAdminResetTutorial,
  serverExpRatePct = 100,
  onAdminSetServerExpRate,
  playerGuild = null,
  actorUid = '',
  accountKey = '',
  remotePlayers = [],
  onStartWhisper,
  onlinePlayerUids = [],
  onlineDigimonByUid = {},
  onDeductGuildCreationBits,
  onNotifyImportantEvent,
  onBuyDwCoinOffer,
  onClearNotifications,
  autoHuntConfig,
  onUpdateAutoHuntConfig,
  isGM: isGmProp,
  cloudIsGm = false,
  onOpenFeedback,
  onConfirmExit,
  onClose,
}: HudWindowsOverlayProps) {
  const isGM = Boolean(
    isGmProp && cloudIsGm && isCurrentAuthUserBootstrappedGm()
  );
  if (!activeWindow) return null;

  if (activeWindow === 'character') {
    return (
      <TamerCharacterModal
        character={character}
        tamerName={tamerName}
        tamerStats={tamerStats}
        tamerPhotoUrl={hudAccount.tamerPhotoUrl ?? null}
        tamerCoverUrl={hudAccount.tamerCoverUrl ?? null}
        equippedItems={equippedItems}
        inventory={inventory}
        guildName={guildName}
        onEquipItem={onEquipItem}
        onUnequipSlot={onUnequipSlot}
        onUpdateTamerPhoto={onUpdateTamerPhoto}
        onUpdateTamerCover={onUpdateTamerCover}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'digimon') {
    return (
      <DigimonCharacterModal
        digimon={digimon}
        digimonStats={digimonStats}
        tamerStats={tamerStats}
        equippedItems={equippedItems}
        inventory={inventory}
        defeatedTotal={defeatedTotal}
        onEvolveForm={onEvolveDigimon}
        onRequestUnlockForm={onRequestUnlockEvolution}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'incubator') {
    return (
      <DigiEggIncubatorModal
        hudAccount={hudAccount}
        onExecuteDataInject={onExecuteDataInject}
        onExecuteHatch={onExecuteEggHatch}
        onExecuteReinforce={onExecuteEggReinforce}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'archive') {
    return (
      <DigimonArchiveModal
        hudAccount={hudAccount}
        activeDigimon={digimon}
        activeDigimonStats={digimonStats}
        onSwapWithSlot={onSwapArchiveSlot}
        onMoveArchiveToParty={onMoveArchiveToParty}
        onMovePartyToArchive={onMovePartyToArchive}
        onReleaseSlot={onReleaseArchiveSlot}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'admin') {
    if (!isGM) return null;
    const unlockedArch = getUnlockedArchiveSlots(hudAccount);
    const partyCount = sanitizePartyDigimons(hudAccount.partyDigimons).length;
    const archiveCount = sanitizeDigimonArchive(
      hudAccount.digimonArchive,
      unlockedArch
    ).length;
    return (
      <AdminTestModal
        digimon={digimon}
        digimonStats={digimonStats}
        currentMapId={snapshot.mapId}
        currentTamerId={character.id}
        actorUid={actorUid}
        gmTamerName={tamerName}
        bits={bits}
        dCoin={dCoin}
        inventory={inventory}
        unlockedSlots={getUnlockedInventorySlots(hudAccount)}
        partyCount={partyCount}
        archiveCount={archiveCount}
        unlockedArchiveSlots={unlockedArch}
        onSetDigimonLevel={onAdminSetDigimonLevel}
        onAddDigimonExp={onAdminAddDigimonExp}
        onEvolveForm={onEvolveDigimon}
        onPullAnyDigimon={onAdminPullAnyDigimon}
        onAddDigimonToParty={onAdminAddDigimonToParty}
        onAddDigimonToArchive={onAdminAddDigimonToArchive}
        onUnlockArchiveSlots={onAdminUnlockArchiveSlots}
        onSimulateEggDrop={onAdminSimulateEggDrop}
        onSetHatchGrade={onAdminSetHatchGrade}
        onGrantItem={onAdminGrantItem}
        onGrantAllDatas={onAdminGrantAllDatas}
        onGrantAllEggs={onAdminGrantAllEggs}
        onGrantCurrency={onAdminGrantCurrency}
        onClearInventory={onAdminClearInventory}
        onSwitchTamer={onAdminSwitchTamer}
        onOpenSelectionFlow={onOpenSelectionFlow}
        onRestoreVitals={onAdminRestoreVitals}
        onTravelToMap={onTravelToMap}
        onOpenBeginnerTutorial={onAdminOpenTutorial}
        onResetBeginnerTutorial={onAdminResetTutorial}
        serverExpRatePct={serverExpRatePct}
        onSetServerExpRate={onAdminSetServerExpRate}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'map') {
    return (
      <WorldMapModal
        snapshot={snapshot}
        tamerStats={tamerStats}
        digimonStats={digimonStats}
        defeatedTotal={defeatedTotal}
        soundEnabled={preferences.soundEnabled}
        isGM={isGM}
        onTravelToMap={onTravelToMap}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'guild') {
    return (
      <GuildSystemModal
        guild={playerGuild}
        actorUid={actorUid}
        tamerName={tamerName}
        tamerLevel={tamerStats.level}
        activeDigimonFormId={digimon.id}
        onlinePlayerUids={onlinePlayerUids}
        onlineDigimonByUid={onlineDigimonByUid}
        bits={bits}
        isGM={isGM}
        onDeductCreationBits={onDeductGuildCreationBits ?? (() => false)}
        onNotifyEvent={onNotifyImportantEvent ?? (() => {})}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'shop') {
    return (
      <DwCoinShopModal
        dCoin={dCoin}
        playerId={actorUid || accountKey || tamerName}
        unlockedInventorySlots={getUnlockedInventorySlots(hudAccount)}
        unlockedArchiveSlots={getUnlockedArchiveSlots(hudAccount)}
        isGM={isGM}
        onBuyOffer={
          onBuyDwCoinOffer ??
          (() => ({ ok: false, message: 'Loja indisponível no momento.' }))
        }
        onGmTestRechargePack={
          isGM ? (amount) => onAdminGrantCurrency(0, amount) : undefined
        }
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'friends') {
    return (
      <FriendsModal
        accountKey={accountKey || actorUid || tamerName}
        selfTamerName={tamerName}
        remotePlayers={remotePlayers}
        onStartWhisper={(friendName) => {
          onStartWhisper?.(friendName);
          onClose();
        }}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'auto') {
    if (!autoHuntConfig || !onUpdateAutoHuntConfig) return null;
    return (
      <AutoHuntModal
        config={autoHuntConfig}
        currentMapId={snapshot.mapId}
        digimonName={digimonStats.nickname?.trim() || digimon.name}
        digimonHp={digimonStats.hp}
        digimonMaxHp={digimonStats.maxHp}
        digimonDs={digimonStats.ds}
        digimonMaxDs={digimonStats.maxDs}
        inventory={inventory}
        onUpdateConfig={onUpdateAutoHuntConfig}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'ranks') {
    const tamerAttrs = computeTamerAttributes(tamerStats, equippedItems);
    const derivedDigimon = computeDerivedDigimonAttributes(
      tamerAttrs,
      digimonStats,
      defeatedTotal,
      digimon.id
    );
    return (
      <RanksModal
        selfPlayer={{
          userId: actorUid || accountKey || tamerName,
          tamerName,
          characterId: character.id,
          tamerLevel: tamerStats.level,
          tamerExp: tamerStats.exp,
          digimonFormId: digimon.id,
          digimonName: digimonStats.nickname?.trim() || digimon.name,
          digimonLevel: digimonStats.level,
          digimonCombatPower: derivedDigimon.combatPower,
          hatchGrade: digimonStats.hatchGrade ?? 3,
          hatchSizePct: digimonStats.hatchSizePct ?? 100,
          defeatedEnemiesTotal: defeatedTotal,
          guildName,
          isGm: Boolean(cloudIsGm),
          tamerPhotoUrl: hudAccount.tamerPhotoUrl ?? null,
          tamerCoverUrl: hudAccount.tamerCoverUrl ?? null,
        }}
        playerGuild={playerGuild}
        remotePlayers={remotePlayers}
        onUpdateTamerCover={onUpdateTamerCover}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  const titles: Record<
    Exclude<
      HudWindowId,
      | null
      | 'character'
      | 'digimon'
      | 'incubator'
      | 'archive'
      | 'admin'
      | 'map'
      | 'guild'
      | 'auto'
      | 'ranks'
      | 'shop'
      | 'friends'
    >,
    string
  > = {
    missions: 'Missões da DATS',
    settings: 'Configurações do Jogo',
    messenger: 'Mensageiro DATS',
    notifications: 'Notificações Importantes',
    'exit-confirm': 'Sair do Mundo Digital',
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titles[activeWindow]}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/80 p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[410px] overflow-hidden rounded-2xl border border-cyan-300/80 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_36px_rgba(0,174,255,0.5)]"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between border-b border-cyan-400/40 bg-[#082d7a] px-4 py-2.5">
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            {titles[activeWindow]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/70 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70dvh] overflow-y-auto p-4 text-xs text-sky-100">

          {activeWindow === 'missions' && (
            <div className="space-y-3 rounded-xl border border-amber-300/35 bg-[#041232] p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-500/15 text-amber-300">
                <Compass className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black tracking-wide text-white">
                  Em Desenvolvimento
                </p>
                <p className="text-[11px] font-bold text-amber-200/90">
                  Sistema de Missões Principais e Diárias da DATS
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Estamos preparando a campanha oficial de missões com Richard Sampson, recompensas de história e tarefas diárias para Tamers. Em breve disponível!
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-[#072056] px-3 py-1 text-[10px] font-extrabold text-cyan-200">
                <Wrench className="h-3.5 w-3.5" />
                <span>Disponível em atualização futura</span>
              </div>
            </div>
          )}



          {activeWindow === 'settings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-cyan-400/25 bg-[#041232] px-3 py-2.5">
                <div>
                  <p className="font-bold text-white">Efeitos sonoros</p>
                  <p className="text-[11px] text-slate-300">
                    Áudio de botões, portais e ações
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !preferences.soundEnabled;
                    onUpdatePreferences({ ...preferences, soundEnabled: next });
                    if (next) playDigitalTone('confirm', true);
                  }}
                  className={`min-h-[36px] min-w-[72px] rounded-lg border px-2.5 text-[11px] font-extrabold ${
                    preferences.soundEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  {preferences.soundEnabled ? 'ATIVO' : 'MUDO'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-cyan-400/25 bg-[#041232] px-3 py-2.5">
                <div>
                  <p className="font-bold text-white">Animações e partículas</p>
                  <p className="text-[11px] text-slate-300">
                    Efeitos visuais da interface
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      animationsEnabled: !preferences.animationsEnabled,
                    })
                  }
                  className={`min-h-[36px] min-w-[72px] rounded-lg border px-2.5 text-[11px] font-extrabold ${
                    preferences.animationsEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  {preferences.animationsEnabled ? 'ATIVO' : 'DESL.'}
                </button>
              </div>

              <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
                <p className="mb-2 flex items-center gap-1.5 font-bold text-white">
                  <Settings className="h-3.5 w-3.5 text-cyan-300" />
                  Qualidade Gráfica
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['alta', 'equilibrada'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        onUpdatePreferences({
                          ...preferences,
                          graphicsQuality: mode,
                        })
                      }
                      className={`min-h-[36px] rounded-lg border text-[11px] font-extrabold ${
                        preferences.graphicsQuality === mode
                          ? 'border-amber-300 bg-amber-500/20 text-amber-200'
                          : 'border-cyan-400/25 bg-[#071f54] text-slate-300'
                      }`}
                    >
                      {mode === 'alta' ? 'Alta Fidelidade' : 'Econômica'}
                    </button>
                  ))}
                </div>
              </div>

              <PWAInstallButton
                variant="compact"
                soundEnabled={preferences.soundEnabled}
                showInstalledState
              />

              {onOpenFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    playDigitalTone('click', preferences.soundEnabled);
                    onClose();
                    onOpenFeedback();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-3.5 py-2 text-xs font-extrabold tracking-wide text-[#081226] shadow-[0_0_14px_rgba(255,174,0,0.4)] transition-transform active:scale-[0.98]"
                >
                  <Bug className="h-4 w-4 shrink-0" />
                  <span>REPORTAR BUG / FEEDBACK ALFA</span>
                </button>
              )}
            </div>
          )}

          {activeWindow === 'messenger' && (
            <div className="space-y-2.5 rounded-xl border border-cyan-400/30 bg-[#041232] p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="text-sm font-extrabold text-white">
                Caixa de Mensagens Diretas
              </p>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Nenhuma mensagem recebida no momento. O mensageiro está pronto para receber correio e sussurros quando o serviço online estiver ativo.
              </p>
            </div>
          )}

          {activeWindow === 'notifications' && (
            <div className="space-y-2.5">
              {notifications.length > 0 && onClearNotifications && (
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-cyan-200/80">
                    Apenas eventos importantes ({notifications.length})
                  </span>
                  <button
                    type="button"
                    onClick={onClearNotifications}
                    className="flex min-h-[32px] items-center gap-1 rounded-lg border border-rose-400/45 bg-rose-950/60 px-2.5 text-[10.5px] font-extrabold text-rose-200 hover:bg-rose-900/75"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Limpar tudo</span>
                  </button>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="rounded-xl border border-cyan-400/30 bg-[#041232] p-5 text-center">
                  <Bell className="mx-auto h-7 w-7 text-cyan-300" />
                  <p className="mt-2 font-bold text-white">
                    Nenhuma notificação importante
                  </p>
                  <p className="mt-1 text-[10.5px] text-slate-300">
                    Avisos de Raid Boss, evoluções desbloqueadas, drops raros, eventos de EXP e Guilda aparecem aqui.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-amber-200">
                        {n.title}
                      </span>
                      <span className="text-[9.5px] text-cyan-300/75">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-200">
                      {n.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeWindow === 'exit-confirm' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/40 bg-[#041232] p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-extrabold text-white">
                    Deseja sair do jogo e voltar para a tela inicial?
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Seu Tamer, Digimon parceiro, posição, nível, Bits e inventário serão salvos automaticamente na nuvem antes de desconectar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-xl border border-cyan-400/50 bg-[#072666] font-extrabold text-white hover:bg-sky-800"
                >
                  Continuar Jogando
                </button>
                <button
                  type="button"
                  onClick={onConfirmExit}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-rose-300/70 bg-rose-700 font-extrabold text-white hover:bg-rose-600"
                >
                  <CornerUpLeft className="h-4 w-4" />
                  <span>Confirmar Saída</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
