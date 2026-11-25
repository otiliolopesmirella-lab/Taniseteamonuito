import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpCircle,
  Ban,
  BellRing,
  BookOpen,
  Check,
  Coins,
  Crown,
  Database,
  Egg,
  Gem,
  HeartPulse,
  MapPin,
  Package,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  Unlock,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { auth } from '../../firebase';
import { isCurrentAuthUserBootstrappedGm } from '../../services/gmRoleService';
import type { BanDurationPreset } from '../../services/banService';
import {
  adjustPlayerCurrencyForGm,
  approveDwCoinOrderForGm,
  banPlayerWithAuditForGm,
  cancelDwCoinOrderForGm,
  deleteAlphaFeedbackForGm,
  fetchServerSnapshotForGm,
  kickOnlinePlayerForGm,
  logGmAction,
  unbanPlayerWithAuditForGm,
  type GmDwCoinOrderEntry,
  type GmServerSnapshot,
} from '../../services/gmControlService';
import { forceRespawnWorldBossForGm } from '../../services/worldBossService';
import { GmEconomyTab } from './gm/GmEconomyTab';
import { GmModerationTab } from './gm/GmModerationTab';
import { GmOverviewTab } from './gm/GmOverviewTab';
import { GmPlayersTab } from './gm/GmPlayersTab';
import {
  DMO_HATCH_QUALITY_PROFILES,
  EVOLUTER_ICON_URL,
  EVOLUTER_ITEM_KEY,
  getCatalogItemByKey,
  getHatchQualityProfile,
  HATCH_BACKUP_ICON_URL,
  HATCH_BACKUP_ITEM_KEY,
  ITEM_RARITY_META,
  listAllDataDefinitions,
  listAllDigiEggDefinitions,
} from '../../data/itemsCatalog';
import { MUDFRIGIMON_CONSUMABLES } from '../../data/mudfrigimonShopCatalog';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import { DATA_FOREST_MAP_ID } from '../../maps/dataForestMap';
import { DATS_MAP_ID } from '../../maps/datsCenterMap';
import { DIGI_MOUNTAIN_MAP_ID } from '../../maps/digiMountainMap';
import { DIGITAL_DESERT_MAP_ID } from '../../maps/digitalDesertMap';
import { DATA_SEA_MAP_ID } from '../../maps/dataSeaMap';
import { DIGIMON_ISLAND_MAP_ID } from '../../maps/digimonIslandMap';
import { DARK_AREA_MAP_ID } from '../../maps/darkAreaMap';
import { VIRTUAL_WORLD_MAP_ID } from '../../maps/virtualWorldMap';
import { HUNTING_MAP_ID } from '../../maps/huntingFieldMap';
import {
  ARCHIVE_TOTAL_SLOTS,
  PARTY_RESERVE_SLOTS,
} from '../../services/archiveService';
import { DIGIMON_DROP_TABLES } from '../../services/dropService';
import {
  DIGIMON_EVOLUTION_CHAINS,
  getFormEvoluterCost,
  getUnlockedInventorySlots,
  INVENTORY_DEFAULT_UNLOCKED_SLOTS,
} from '../../services/hudGameService';
import { RICHARD_SAMPSON_NPC } from '../../sprites/npcSprites';
import { TAMER_CHARACTERS } from '../../sprites/tamerSprites';
import {
  ALLOWED_SERVER_EXP_RATES,
  publishServerAnnouncement,
  type ServerAnnouncementSeverity,
  type ServerExpRatePct,
} from '../../services/serverConfigService';
import type { TamerId } from '../../types/character';
import { formatDigitalCurrency } from '../../utils/currency';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
  type StarterDigimonId,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  HatchQualityGrade,
  InventoryItem,
} from '../../types/hud';

type AdminPanelTab =
  | 'overview'
  | 'players'
  | 'economy'
  | 'moderation'
  | 'digimons'
  | 'datas'
  | 'eggs'
  | 'drops'
  | 'itens';
type PullDestinationMode = 'active' | 'party' | 'archive';

interface AdminTestModalProps {
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  currentMapId: PlayableMapId;
  currentTamerId: TamerId;
  actorUid?: string;
  gmTamerName?: string;
  bits: number;
  dCoin: number;
  inventory: InventoryItem[];
  unlockedSlots?: number;
  partyCount?: number;
  archiveCount?: number;
  unlockedArchiveSlots?: number;
  onSetDigimonLevel: (level: number) => void;
  onAddDigimonExp: (expAmount: number) => void;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onPullAnyDigimon: (formId: DigimonFormId, grade: HatchQualityGrade) => void;
  onAddDigimonToParty?: (formId: DigimonFormId, grade: HatchQualityGrade) => void;
  onAddDigimonToArchive?: (
    formId: DigimonFormId,
    grade: HatchQualityGrade
  ) => void;
  onUnlockArchiveSlots?: (targetUnlockedSlots: number) => void;
  onSimulateEggDrop?: (
    eggItemKey: string,
    sourceName: string,
    isBoss?: boolean
  ) => void;
  onSetHatchGrade: (grade: HatchQualityGrade) => void;
  onGrantItem: (itemKey: string, quantity: number, eggHatchLevel?: number) => void;
  onGrantAllDatas: (quantityEach: number) => void;
  onGrantAllEggs: (eggHatchLevel: number) => void;
  onGrantCurrency: (bitsDelta: number, dCoinDelta: number) => void;
  gmInfiniteDCoin?: boolean;
  onToggleInfiniteDCoin?: (enabled: boolean) => void;
  onClearInventory: () => void;
  onSwitchTamer?: (tamerId: TamerId) => void;
  onOpenSelectionFlow?: (screen: 'character-select' | 'digimon-select') => void;
  onRestoreVitals: () => void;
  onTravelToMap: (mapId: PlayableMapId) => void;
  onOpenBeginnerTutorial?: () => void;
  onResetBeginnerTutorial?: () => void;
  serverExpRatePct?: ServerExpRatePct;
  onSetServerExpRate?: (rate: ServerExpRatePct) => void;
  onClose: () => void;
}

const STARTER_LINE_META: ReadonlyArray<{
  id: StarterDigimonId;
  label: string;
  dotClass: string;
}> = [
  { id: 'agumon', label: 'Linha Fogo (Agumon Savers)', dotClass: 'bg-amber-400' },
  { id: 'agumon_classic', label: 'Linha Clássica (Agumon Clássico)', dotClass: 'bg-orange-400' },
  { id: 'gabumon', label: 'Linha Gelo (Gabumon Clássico)', dotClass: 'bg-cyan-400' },
  { id: 'gaomon', label: 'Linha Velocidade (Gaomon)', dotClass: 'bg-sky-400' },
  { id: 'lalamon', label: 'Linha Natureza (Lalamon)', dotClass: 'bg-emerald-400' },
  { id: 'guilmon', label: 'Linha Vírus (Guilmon)', dotClass: 'bg-rose-500' },
  { id: 'impmon', label: 'Linha Trevas (Impmon / Beelzemon)', dotClass: 'bg-violet-500' },
  { id: 'veemon', label: 'Linha Cavaleiro Real (Veemon / UlforceVeedramon)', dotClass: 'bg-blue-400' },
  { id: 'keramon', label: 'Linha Anomalia (Keramon / Diaboromon)', dotClass: 'bg-purple-500' },
  { id: 'demimeramon', label: 'Linha Fogo / Metal (DemiMeramon / Boltmon)', dotClass: 'bg-orange-500' },
  { id: 'hawkmon', label: 'Linha Vento (Hawkmon / Gryphonmon)', dotClass: 'bg-emerald-400' },
  { id: 'tentomon', label: 'Linha Trovão (Tentomon / HerculesKabuterimon)', dotClass: 'bg-yellow-400' },
  { id: 'drimogemon', label: 'Linha Terra / Aço (Drimogemon / HiAndromon)', dotClass: 'bg-indigo-400' },
  { id: 'kiwimon', label: 'Linha Madeira / Vento (Kiwimon / Griffomon)', dotClass: 'bg-lime-400' },
  { id: 'gotsumon', label: 'Linha Terra / Gelo (Gotsumon / MetalEtemon)', dotClass: 'bg-amber-300' },
  { id: 'elecmon', label: 'Linha Trovão / Fera (Elecmon / SaberLeomon)', dotClass: 'bg-yellow-300' },
  { id: 'renamon', label: 'Linha Mística / Luz (Renamon / Sakuyamon)', dotClass: 'bg-purple-400' },
  { id: 'monodramon', label: 'Linha Dragão / Justiça (Monodramon / Justimon)', dotClass: 'bg-red-400' },
  { id: 'biyomon', label: 'Linha Vento / Fogo (Biyomon / Phoenixmon)', dotClass: 'bg-pink-400' },
  { id: 'kunemon', label: 'Linha Trovão / Inseto (Kunemon / GranKuwagamon)', dotClass: 'bg-yellow-400' },
];

const ALL_DATAS_CATALOG = listAllDataDefinitions();
const ALL_EGGS_CATALOG = listAllDigiEggDefinitions();

const STARTER_LINE_CARDS = STARTER_LINE_META.map((line) => ({
  ...line,
  forms: DIGIMON_EVOLUTION_CHAINS[line.id]
    .filter((step): step is typeof step & { formId: DigimonFormId } => Boolean(step.formId))
    .map((step) => getDigimonFormProfile(step.formId)),
}));

const TOTAL_PLAYABLE_FORMS = STARTER_LINE_CARDS.reduce(
  (total, line) => total + line.forms.length,
  0
);

const DIGIEGG_DROP_PREVIEW_ROWS = Object.values(DIGIMON_DROP_TABLES).flatMap(
  (table) => {
    const dataEntry = table.entries.find(
      (e) => e.rollGroup === 'data' && e.enabled !== false
    );
    const dataDef = dataEntry ? getCatalogItemByKey(dataEntry.itemKey) : null;
    const isBoss = table.species === 'kuwagamon';

    return table.entries
      .filter((e) => e.rollGroup === 'egg' && e.enabled !== false)
      .map((eggEntry) => {
        const eggDef = getCatalogItemByKey(eggEntry.itemKey);
        return {
          id: `${table.species}-${eggEntry.itemKey}`,
          species: table.species,
          monsterName: table.displayName,
          isBoss,
          eggItemKey: eggEntry.itemKey,
          eggName: eggDef?.name ?? eggEntry.itemKey,
          eggIconUrl: eggDef?.iconUrl ?? '',
          eggAccent: eggDef?.accentColor ?? '#facc15',
          eggChancePct: eggEntry.chance * 100,
          dataName: dataDef?.name ?? null,
          dataChancePct: dataEntry ? dataEntry.chance * 100 : null,
        };
      });
  }
);

function formatDropChancePct(pct: number): string {
  return `${pct.toFixed(pct < 1 ? 2 : 1).replace('.', ',')}%`;
}

function AdminTestModalInner({
  digimon,
  digimonStats,
  currentMapId,
  currentTamerId,
  actorUid = '',
  gmTamerName = 'GM',
  bits,
  dCoin,
  inventory,
  unlockedSlots = INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  partyCount = 0,
  archiveCount = 0,
  unlockedArchiveSlots = 4,
  onSetDigimonLevel,
  onAddDigimonExp,
  onPullAnyDigimon,
  onAddDigimonToParty,
  onAddDigimonToArchive,
  onUnlockArchiveSlots,
  onSimulateEggDrop,
  onSetHatchGrade,
  onGrantItem,
  onGrantAllDatas,
  onGrantAllEggs,
  onGrantCurrency,
  gmInfiniteDCoin = false,
  onToggleInfiniteDCoin,
  onClearInventory,
  onSwitchTamer,
  onOpenSelectionFlow,
  onRestoreVitals,
  onTravelToMap,
  onOpenBeginnerTutorial,
  onResetBeginnerTutorial,
  serverExpRatePct = 100,
  onSetServerExpRate,
  onClose,
}: AdminTestModalProps) {
  const safeUnlockedSlots = getUnlockedInventorySlots(unlockedSlots);
  const [activeTab, setActiveTab] = useState<AdminPanelTab>('overview');
  const [pullMode, setPullMode] = useState<PullDestinationMode>('active');
  const [customLevel, setCustomLevel] = useState(String(digimonStats.level));
  const [selectedEggLevel, setSelectedEggLevel] = useState<0 | 3 | 4 | 5>(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const [serverSnapshot, setServerSnapshot] = useState<GmServerSnapshot | null>(
    null
  );
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const effectiveSelfUid = auth.currentUser?.uid || actorUid;

  const loadServerSnapshot = useCallback(async () => {
    if (!isCurrentAuthUserBootstrappedGm()) {
      setServerSnapshot(null);
      setSnapshotLoading(false);
      return;
    }
    setSnapshotLoading(true);
    try {
      const snap = await fetchServerSnapshotForGm();
      setServerSnapshot(snap);
    } catch (err) {
      setActionNotice({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Erro ao carregar dados do servidor.',
      });
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServerSnapshot();
  }, [loadServerSnapshot]);

  const showNotice = useCallback((type: 'ok' | 'err', text: string) => {
    setActionNotice({ type, text });
  }, []);

  const handlePublishAnnouncement = async (input: {
    title: string;
    message: string;
    severity: ServerAnnouncementSeverity;
    maintenanceMode: boolean;
    active: boolean;
  }) => {
    const res = await publishServerAnnouncement({
      ...input,
      gmName: gmTamerName,
    });
    if (!res.ok) {
      showNotice('err', res.error ?? 'Falha ao publicar aviso.');
      return;
    }
    await logGmAction({
      action: 'announcement',
      targetUid: 'server',
      targetName: 'Servidor',
      summary: input.active
        ? `Publicou aviso (${input.severity}): ${input.title}`
        : 'Removeu banner global do servidor.',
      gmName: gmTamerName,
    });
    showNotice(
      'ok',
      input.active
        ? 'Aviso global publicado para todos os jogadores!'
        : 'Banner global removido.'
    );
    await loadServerSnapshot();
  };

  const handleForceRespawnBoss = async () => {
    const res = await forceRespawnWorldBossForGm();
    if (!res.ok) {
      showNotice('err', res.error ?? 'Não foi possível reviver Kuwagamon.');
      return;
    }
    await logGmAction({
      action: 'boss_respawn',
      targetUid: 'data-forest-kuwagamon',
      targetName: 'Kuwagamon',
      summary: 'Forçou respawn imediato do Boss Raid Kuwagamon.',
      gmName: gmTamerName,
    });
    showNotice('ok', 'Boss Raid Kuwagamon revivido com 100% de HP na Floresta!');
    await loadServerSnapshot();
  };

  const handleAdjustPlayerCurrency = async (input: {
    targetUid: string;
    bitsDelta: number;
    dCoinDelta: number;
    reason: string;
  }) => {
    try {
      const res = await adjustPlayerCurrencyForGm({
        ...input,
        gmName: gmTamerName,
      });
      showNotice(
        'ok',
        `Saldo atualizado! Novo total: ${formatDigitalCurrency(
          res.nextBits
        )} · ${res.nextDCoin.toLocaleString('pt-BR')} DL Din.`
      );
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao ajustar saldo.'
      );
    }
  };

  const handleKickPlayer = async (targetUid: string, targetName: string) => {
    try {
      await kickOnlinePlayerForGm({
        targetUid,
        targetName,
        gmName: gmTamerName,
      });
      showNotice('ok', `${targetName} foi desconectado do mapa.`);
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao desconectar jogador.'
      );
    }
  };

  const handleBanPlayer = async (input: {
    targetUid: string;
    username: string;
    tamerName: string;
    reason: string;
    durationPreset: BanDurationPreset;
  }) => {
    try {
      await banPlayerWithAuditForGm({
        ...input,
        gmName: gmTamerName,
      });
      showNotice(
        'ok',
        `Conta ${input.tamerName || input.username} banida com sucesso.`
      );
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao banir conta.'
      );
    }
  };

  const handleUnbanPlayer = async (targetUid: string, targetName: string) => {
    try {
      await unbanPlayerWithAuditForGm({
        targetUid,
        targetName,
        gmName: gmTamerName,
      });
      showNotice('ok', `Banimento removido da conta ${targetName}.`);
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao remover banimento.'
      );
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await approveDwCoinOrderForGm({
        orderId,
        gmName: gmTamerName,
      });
      showNotice(
        'ok',
        `Pedido aprovado! +${res.dwCoinCredited} DL Din creditados (novo saldo: ${res.nextBalance}).`
      );
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao aprovar pedido.'
      );
    }
  };

  const handleCancelOrder = async (order: GmDwCoinOrderEntry) => {
    try {
      await cancelDwCoinOrderForGm({
        orderId: order.orderId,
        targetUid: order.ownerUid,
        targetName: order.tamerName,
        gmName: gmTamerName,
      });
      showNotice('ok', `Pedido ${order.orderId} cancelado.`);
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao cancelar pedido.'
      );
    }
  };

  const handleDeleteFeedback = async (reportId: string, targetName: string) => {
    try {
      await deleteAlphaFeedbackForGm({
        reportId,
        targetName,
        gmName: gmTamerName,
      });
      showNotice('ok', 'Relato marcado como resolvido e removido.');
      await loadServerSnapshot();
    } catch (err) {
      showNotice(
        'err',
        err instanceof Error ? err.message : 'Erro ao remover relato.'
      );
    }
  };

  const activeQuality = getHatchQualityProfile(digimonStats.hatchGrade);
  const allDatas = ALL_DATAS_CATALOG;
  const allEggs = ALL_EGGS_CATALOG;

  function handleSelectDigimonForm(formId: DigimonFormId) {
    if (pullMode === 'party' && onAddDigimonToParty) {
      onAddDigimonToParty(formId, activeQuality.grade);
      return;
    }
    if (pullMode === 'archive' && onAddDigimonToArchive) {
      onAddDigimonToArchive(formId, activeQuality.grade);
      return;
    }
    onPullAnyDigimon(formId, activeQuality.grade);
  }

  const ownedQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.itemKey, (map.get(item.itemKey) ?? 0) + item.quantity);
      const eggLv = item.eggData?.hatchLevel ?? 0;
      const eggKey = `${item.itemKey}::${eggLv}`;
      map.set(eggKey, (map.get(eggKey) ?? 0) + item.quantity);
    }
    return map;
  }, [inventory]);

  const handleApplyCustomLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(customLevel, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(1, Math.min(99, parsed));
    setCustomLevel(String(clamped));
    onSetDigimonLevel(clamped);
  };

  function getOwnedQty(itemKey: string, eggHatchLevel?: number): number {
    if (eggHatchLevel === undefined) {
      return ownedQtyMap.get(itemKey) ?? 0;
    }
    return ownedQtyMap.get(`${itemKey}::${eggHatchLevel}`) ?? 0;
  }

  const serverManagementTabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'players', label: 'Jogadores', icon: Users },
    { id: 'economy', label: 'DL Din/Loja', icon: Gem },
    { id: 'moderation', label: 'Bans & Logs', icon: Ban },
  ] as const;

  const toolTabs = [
    { id: 'digimons', label: 'Digimons', icon: Sparkles },
    { id: 'datas', label: 'DATAs', icon: Database },
    { id: 'eggs', label: 'DigiEggs', icon: Egg },
    { id: 'drops', label: 'Drops', icon: BellRing },
    { id: 'itens', label: 'Itens/Mapas', icon: Package },
  ] as const;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Central de Comando GM"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/85 p-1.5 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ contain: 'layout style paint' }}
        className="animate-dmo-window flex max-h-[94dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-cyan-300/60 bg-[#041130]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-cyan-400/30 bg-[#082d7a] px-3.5 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/70 bg-amber-500/20 text-amber-300">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black tracking-wide text-white">
                Central de Comando GM · Servidor & Ferramentas
              </h2>
              <p className="truncate text-[10px] font-semibold text-cyan-200/85">
                Monitor ao vivo, Economia DL Din, Banimentos e Spawn · [F9]
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void loadServerSnapshot()}
              disabled={snapshotLoading}
              title="Atualizar dados do servidor"
              className="flex min-h-[34px] items-center gap-1 rounded-lg border border-cyan-300/60 bg-[#051d52] px-2.5 text-[11px] font-extrabold text-cyan-100 hover:bg-sky-800 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${snapshotLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            {onOpenBeginnerTutorial && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBeginnerTutorial();
                }}
                className="hidden min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-300/70 bg-amber-500/20 px-2.5 text-[11px] font-black text-amber-100 whitespace-nowrap transition hover:brightness-115 sm:flex"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                <span>Tutorial</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel GM"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/70 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 bg-[#030e2c] px-3.5 py-1.5 text-[10.5px] font-bold">
          <div className="flex items-center gap-2">
            <span style={{ color: digimon.theme.accentHex }} className="font-black">
              {digimon.name}
            </span>
            <span className="tabular-nums text-white">Nv.{digimonStats.level}</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums text-emerald-300">
              {serverSnapshot?.metrics.onlinePlayers ?? 0} Online
            </span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums text-slate-300">
              {serverSnapshot?.metrics.totalPlayers ?? 0} Contas
            </span>
          </div>
          <div className="flex items-center gap-2.5 tabular-nums">
            <span className="text-amber-300">{formatDigitalCurrency(bits)}</span>
            <span className="text-cyan-300">
              {dCoin.toLocaleString('pt-BR')} DL Din
            </span>
            <span className="text-slate-300">
              Mochila {inventory.length}/{safeUnlockedSlots}
            </span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionNotice && (
          <div
            className={`flex items-center justify-between gap-2 border-b px-3.5 py-2 text-xs font-bold ${
              actionNotice.type === 'ok'
                ? 'border-emerald-400/35 bg-emerald-950/75 text-emerald-100'
                : 'border-rose-400/35 bg-rose-950/75 text-rose-100'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs font-black opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dual-Section Navigation Bar (Server Control + Game Spawner Tools) */}
        <div
          role="tablist"
          aria-label="Seções do painel GM"
          className="space-y-1 border-b border-cyan-400/25 bg-[#051946] p-1.5"
        >
          <div className="grid grid-cols-4 gap-1">
            {serverManagementTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border px-1.5 text-[10.5px] font-black transition active:scale-95 sm:text-[11px] ${
                    active
                      ? 'border-amber-300 bg-amber-400/20 text-amber-100'
                      : 'border-cyan-400/25 bg-[#041232] text-cyan-100 hover:border-cyan-300/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {toolTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-extrabold transition active:scale-95 sm:text-[10.5px] ${
                    active
                      ? 'border-cyan-300 bg-cyan-500/25 text-white'
                      : 'border-white/10 bg-[#030e2c] text-slate-300 hover:border-cyan-400/35 hover:text-white'
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs text-sky-100 sm:p-4">
          {activeTab === 'overview' && (
            <GmOverviewTab
              snapshot={serverSnapshot}
              loading={snapshotLoading}
              serverExpRatePct={serverExpRatePct}
              onSetServerExpRate={onSetServerExpRate}
              onPublishAnnouncement={handlePublishAnnouncement}
              onForceRespawnBoss={handleForceRespawnBoss}
              onRefresh={() => void loadServerSnapshot()}
            />
          )}

          {activeTab === 'players' && (
            <GmPlayersTab
              players={serverSnapshot?.players ?? []}
              selfUid={effectiveSelfUid}
              loading={snapshotLoading}
              onAdjustCurrency={handleAdjustPlayerCurrency}
              onKickPlayer={handleKickPlayer}
              onBanPlayer={handleBanPlayer}
              onUnbanPlayer={handleUnbanPlayer}
            />
          )}

          {activeTab === 'economy' && (
            <GmEconomyTab
              snapshot={serverSnapshot}
              loading={snapshotLoading}
              gmDCoin={dCoin}
              gmInfiniteDCoin={gmInfiniteDCoin}
              onToggleGmInfiniteDCoin={onToggleInfiniteDCoin}
              onGrantSelfDCoin={(amount) => onGrantCurrency(0, amount)}
              onAdjustPlayerCurrency={handleAdjustPlayerCurrency}
              onApproveOrder={handleApproveOrder}
              onCancelOrder={handleCancelOrder}
              onRefreshSnapshot={loadServerSnapshot}
            />
          )}

          {activeTab === 'moderation' && (
            <GmModerationTab
              snapshot={serverSnapshot}
              onUnbanPlayer={handleUnbanPlayer}
              onDeleteFeedback={handleDeleteFeedback}
            />
          )}
          {activeTab === 'digimons' && (
            <>
              {/* Active Quality Selector (3/5, 4/5, 5/5) */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    Qualidade do Digimon
                  </span>
                  <span
                    style={{ color: activeQuality.badgeColor }}
                    className="text-[11px] font-black"
                  >
                    {activeQuality.label} · {activeQuality.qualityName} (
                    {digimonStats.hatchSizePct ?? activeQuality.defaultSizePct}%)
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {([3, 4, 5] as const).map((grade) => {
                    const prof = DMO_HATCH_QUALITY_PROFILES[grade];
                    const selected = activeQuality.grade === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => onSetHatchGrade(grade)}
                        style={
                          selected
                            ? { borderColor: prof.badgeColor }
                            : undefined
                        }
                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-2 py-1 text-center transition active:scale-95 ${
                          selected
                            ? 'bg-[#0a2f7d]/80 text-white shadow'
                            : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                        }`}
                      >
                        <span
                          style={{ color: prof.badgeColor }}
                          className="text-xs font-black"
                        >
                          {prof.label}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-200">
                          {prof.powerBonusPct > 0
                            ? `+${String(prof.powerBonusPct).replace('.', ',')}%`
                            : '+0%'}{' '}
                          · {prof.sizeRangeLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All Playable Digimons across all evolution lines */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>
                      Puxar Qualquer Digimon ({TOTAL_PLAYABLE_FORMS} Formas)
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    Usa {activeQuality.label}
                  </span>
                </div>

                {/* Pull Destination Selector (Replace Active / +2-Circle Party / +Archive) */}
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPullMode('active')}
                    className={`flex min-h-[42px] flex-col items-center justify-center rounded-xl border px-1.5 py-1 text-center transition active:scale-95 ${
                      pullMode === 'active'
                        ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                        : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                    }`}
                  >
                    <span className="text-[10.5px] font-black">
                      Substituir Ativo
                    </span>
                    <span className="text-[8.5px] opacity-85">
                      Troca imediata
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPullMode('party')}
                    className={`flex min-h-[42px] flex-col items-center justify-center rounded-xl border px-1.5 py-1 text-center transition active:scale-95 ${
                      pullMode === 'party'
                        ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100'
                        : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[10.5px] font-black">
                      <Users className="h-3 w-3" />
                      + Equipe ({partyCount}/{PARTY_RESERVE_SLOTS})
                    </span>
                    <span className="text-[8.5px] opacity-85">
                      2 Círculos HUD
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPullMode('archive')}
                    className={`flex min-h-[42px] flex-col items-center justify-center rounded-xl border px-1.5 py-1 text-center transition active:scale-95 ${
                      pullMode === 'archive'
                        ? 'border-fuchsia-300 bg-fuchsia-500/25 text-fuchsia-100'
                        : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[10.5px] font-black">
                      <PlusCircle className="h-3 w-3" />
                      + Archive ({archiveCount}/{unlockedArchiveSlots})
                    </span>
                    <span className="text-[8.5px] opacity-85">
                      Guarda a mais
                    </span>
                  </button>
                </div>

                {/* Quick GM Archive Unlock Controls */}
                {onUnlockArchiveSlots && unlockedArchiveSlots < ARCHIVE_TOTAL_SLOTS && (
                  <div className="mt-2 flex items-center justify-between gap-1.5 rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/30 px-2.5 py-1.5">
                    <span className="text-[10px] font-bold text-fuchsia-200">
                      Archive: {unlockedArchiveSlots}/{ARCHIVE_TOTAL_SLOTS} slots
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUnlockArchiveSlots(
                            Math.min(
                              ARCHIVE_TOTAL_SLOTS,
                              unlockedArchiveSlots + 10
                            )
                          )
                        }
                        className="flex min-h-[28px] items-center gap-1 rounded-md border border-fuchsia-300/60 bg-fuchsia-600/35 px-2 text-[10px] font-black text-white hover:bg-fuchsia-600/55 active:scale-95"
                      >
                        <Unlock className="h-3 w-3" />
                        +10 Slots
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnlockArchiveSlots(ARCHIVE_TOTAL_SLOTS)}
                        className="flex min-h-[28px] items-center gap-1 rounded-md border border-amber-300/70 bg-amber-500/25 px-2 text-[10px] font-black text-amber-100 hover:bg-amber-500/40 active:scale-95"
                      >
                        Liberar 50
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2.5 space-y-2.5">
                  {STARTER_LINE_CARDS.map((line) => (
                    <div
                      key={line.id}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '124px' }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 px-0.5">
                        <span className={`h-2 w-2 rounded-full ${line.dotClass}`} />
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-200">
                          {line.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {line.forms.map((form) => {
                          const isActive = form.id === digimon.id;
                          const evoCost = getFormEvoluterCost(line.id, form.id);
                          return (
                            <button
                              key={form.id}
                              type="button"
                              onClick={() => handleSelectDigimonForm(form.id)}
                              style={
                                isActive
                                  ? {
                                      borderColor: form.theme.accentHex,
                                      boxShadow: `0 0 10px ${form.theme.glowRgba}`,
                                    }
                                  : undefined
                              }
                              className={`relative flex min-h-[84px] flex-col items-center justify-between rounded-xl border p-1.5 text-center transition-colors active:scale-95 ${
                                isActive
                                  ? 'bg-[#0a2f7d]/80 text-white'
                                  : 'border-cyan-400/20 bg-[#061844]/90 text-slate-200 hover:border-cyan-300/60 hover:bg-[#09245e]'
                              }`}
                            >
                              {evoCost > 0 && (
                                <span
                                  title={`Custo DMO Wiki: ${evoCost} Evoluters`}
                                  className="absolute left-1 top-1 flex items-center gap-0.5 rounded border border-fuchsia-300/65 bg-[#29094e]/95 px-1 py-[1px] text-[8px] font-black tabular-nums text-fuchsia-100"
                                >
                                  <img
                                    src={EVOLUTER_ICON_URL}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="h-2.5 w-2.5 rounded-[2px] object-cover"
                                  />
                                  {evoCost}
                                </span>
                              )}
                              {isActive && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-slate-950">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </span>
                              )}
                              <img
                                src={`/assets/digimon/thumbs/${form.id}.png?v=tdk1`}
                                alt={form.name}
                                width={40}
                                height={40}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  if (!el.dataset.fb) {
                                    el.dataset.fb = '1';
                                    el.src = form.portraitUrl;
                                  }
                                }}
                                className="h-10 w-10 object-contain"
                              />
                              <div className="w-full">
                                <p className="truncate text-[10px] font-black text-white">
                                  {form.name}
                                </p>
                                <p className="text-[9px] font-bold text-amber-300/90">
                                  {form.stage} · Nv.{form.unlockLevel}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level & Vitals Controls */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <ArrowUpCircle className="h-4 w-4 text-amber-300" />
                    Nível, EXP e Vitais
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLevel('1');
                      onSetDigimonLevel(1);
                    }}
                    className="flex min-h-[30px] items-center gap-1 rounded-lg border border-rose-400/50 bg-rose-950/70 px-2 text-[10px] font-extrabold text-rose-200 hover:bg-rose-900"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Nv.1</span>
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[
                    { label: '+1 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 1)) },
                    { label: '+5 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 5)) },
                    { label: '+10 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 10)) },
                    { label: '+600 EXP', fn: () => onAddDigimonExp(600), emerald: true },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={btn.fn}
                      className={`min-h-[40px] rounded-lg border font-black active:scale-95 ${
                        btn.emerald
                          ? 'border-emerald-400/55 bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                          : 'border-cyan-300/50 bg-[#082c74] text-white hover:bg-sky-700'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[1, 15, 30, 50].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => {
                        setCustomLevel(String(lv));
                        onSetDigimonLevel(lv);
                      }}
                      className={`min-h-[38px] rounded-lg border text-[11px] font-black transition active:scale-95 ${
                        digimonStats.level === lv
                          ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                          : 'border-cyan-400/40 bg-[#061d52] text-cyan-100 hover:bg-[#0b3185]'
                      }`}
                    >
                      Nv. {lv}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleApplyCustomLevel}
                  className="mt-2 flex items-center gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    aria-label="Nível exato"
                    className="h-10 w-20 rounded-lg border border-cyan-400/50 bg-[#020b22] px-2 text-center text-base font-black tabular-nums text-white outline-none focus:border-amber-300 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-lg border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[11px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                  >
                    Definir Nível
                  </button>
                </form>

                <button
                  type="button"
                  onClick={onRestoreVitals}
                  className="mt-2 flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-950/75 px-3 font-extrabold text-emerald-200 hover:bg-emerald-900 active:scale-95"
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>Restaurar 100% HP / DS & Recargas</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'datas' && (
            <>
              <div className="flex flex-col gap-2 rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-white">
                      Todas as 9 DATAs Oficiais
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Puxe quantas DATAs quiser para testar a Incubadora do DATS.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onGrantAllDatas(50)}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                >
                  <Database className="h-4 w-4" />
                  <span>Puxar Todas as 9 DATAs (+50 cada)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allDatas.map((dataItem) => {
                  const owned = getOwnedQty(dataItem.itemKey);
                  return (
                    <div
                      key={dataItem.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={dataItem.iconUrl}
                          alt={dataItem.name}
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-white/15 bg-[#02091c] object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p
                            style={{ color: dataItem.accentColor }}
                            className="truncate text-xs font-black"
                          >
                            {dataItem.name}
                          </p>
                          <p className="text-[10px] font-bold tabular-nums text-slate-300">
                            Na mochila: {owned}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {[1, 10, 50].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => onGrantItem(dataItem.itemKey, qty)}
                            className="min-h-[38px] min-w-[36px] rounded-lg border border-cyan-300/50 bg-[#082c74] px-1.5 text-[10.5px] font-black text-white hover:bg-sky-700 active:scale-95"
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'eggs' && (
            <>
              {/* Target Egg Stage Selector */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    Estágio ao Puxar DigiEgg
                  </span>
                  <span className="text-[10.5px] font-bold text-amber-300">
                    {selectedEggLevel === 0
                      ? '0/5 Base (Para injetar DATA)'
                      : `${selectedEggLevel}/5 Pronto para Chocar`}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {([0, 3, 4, 5] as const).map((lv) => {
                    const active = selectedEggLevel === lv;
                    const label = lv === 0 ? '0/5 Base' : `${lv}/5`;
                    const sub =
                      lv === 0
                        ? 'Injetar'
                        : lv === 3
                          ? 'Normal'
                          : lv === 4
                            ? 'Forte'
                            : 'Muito Forte';
                    return (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setSelectedEggLevel(lv)}
                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-1 text-center transition active:scale-95 ${
                          active
                            ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                            : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                        }`}
                      >
                        <span className="text-[11px] font-black">{label}</span>
                        <span className="text-[9px] font-bold opacity-85">{sub}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onGrantAllEggs(selectedEggLevel)}
                  className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/75 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-3 text-xs font-black uppercase text-white shadow hover:brightness-110 active:scale-95"
                >
                  <Egg className="h-4 w-4" />
                  <span>
                    Puxar Todos os {allEggs.length} DigiEggs ({selectedEggLevel}/5)
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allEggs.map((eggItem) => {
                  const ownedAtGrade = getOwnedQty(eggItem.itemKey, selectedEggLevel);
                  const reqQty = eggItem.eggData?.requiredDataQuantity ?? 5;
                  return (
                    <div
                      key={eggItem.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={eggItem.iconUrl}
                          alt={eggItem.name}
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-white/15 bg-[#02091c] object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p
                            style={{ color: eggItem.accentColor }}
                            className="truncate text-xs font-black"
                          >
                            {eggItem.name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-300">
                            Usa DATA {eggItem.dataType?.toUpperCase()} (×{reqQty}) · Possui:{' '}
                            <strong className="text-white">{ownedAtGrade}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onGrantItem(eggItem.itemKey, 1, selectedEggLevel)
                        }
                        className="min-h-[40px] shrink-0 rounded-lg border border-amber-300/75 bg-amber-500/20 px-2.5 text-[11px] font-black text-amber-200 hover:bg-amber-500/35 active:scale-95"
                      >
                        +1 ({selectedEggLevel}/5)
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'drops' && (
            <>
              {/* Quick Alert & Live World Drop Simulator */}
              <div className="rounded-xl border border-amber-300/50 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
                    <BellRing className="h-4 w-4 text-amber-300" />
                    <span>Testar Aviso & Animação de Drop de DigiEgg</span>
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
                  Clique abaixo para fechar o painel e assistir ao vivo o
                  DigiEgg brilhando no mapa, voando para o Inventário, tocando o
                  efeito sonoro especial e disparando o{' '}
                  <strong className="text-amber-200">Aviso de Drop</strong> no
                  topo da tela + chat.
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSimulateEggDrop?.(
                        'digiegg_agumon_classic',
                        'Greymon',
                        false
                      )
                    }
                    className="flex min-h-[42px] flex-col items-center justify-center rounded-xl border border-amber-300/65 bg-amber-500/20 px-2 py-1 text-center text-amber-100 hover:bg-amber-500/30 active:scale-95"
                  >
                    <span className="text-[10.5px] font-black">
                      Testar Drop · Agumon
                    </span>
                    <span className="text-[9px] text-amber-200/85">
                      Agumon Clássico (Greymon)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSimulateEggDrop?.('digiegg_guilmon', 'Guilmon', false)
                    }
                    className="flex min-h-[42px] flex-col items-center justify-center rounded-xl border border-rose-300/65 bg-rose-500/20 px-2 py-1 text-center text-rose-100 hover:bg-rose-500/30 active:scale-95"
                  >
                    <span className="text-[10.5px] font-black">
                      Testar Drop · Guilmon
                    </span>
                    <span className="text-[9px] text-rose-200/85">
                      Guilmon (Floresta)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSimulateEggDrop?.('digiegg_veemon', 'Veedramon', false)
                    }
                    className="flex min-h-[42px] flex-col items-center justify-center rounded-xl border border-sky-300/75 bg-sky-500/20 px-2 py-1 text-center text-sky-100 hover:bg-sky-500/35 active:scale-95"
                  >
                    <span className="text-[10.5px] font-black">
                      Testar Drop · Veemon
                    </span>
                    <span className="text-[9px] text-sky-200/85">
                      Veemon (Veedramon)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSimulateEggDrop?.(
                        'digiegg_tentomon',
                        'Kuwagamon (Boss Raid)',
                        true
                      )
                    }
                    className="flex min-h-[42px] flex-col items-center justify-center rounded-xl border border-fuchsia-300/75 bg-fuchsia-500/20 px-2 py-1 text-center text-fuchsia-100 hover:bg-fuchsia-500/35 active:scale-95"
                  >
                    <span className="flex items-center gap-1 text-[10.5px] font-black">
                      <Crown className="h-3 w-3 text-amber-300" />
                      Aviso Boss Raid
                    </span>
                    <span className="text-[9px] text-fuchsia-200/85">
                      Tentomon (Kuwagamon)
                    </span>
                  </button>
                </div>
              </div>

              {/* Complete Monster -> DigiEgg Drop Table */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <Egg className="h-4 w-4 text-amber-300" />
                    <span>
                      Tabela Oficial de Drops ({DIGIEGG_DROP_PREVIEW_ROWS.length}{' '}
                      fontes)
                    </span>
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-300">
                    Taxas Reais
                  </span>
                </div>

                <div className="space-y-1.5">
                  {DIGIEGG_DROP_PREVIEW_ROWS.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/25 bg-[#061844] px-2.5 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-[#02091c] p-0.5"
                          style={{ borderColor: row.eggAccent }}
                        >
                          <img
                            src={row.eggIconUrl}
                            alt={row.eggName}
                            loading="lazy"
                            decoding="async"
                            className="h-9 w-9 object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              style={{ color: row.eggAccent }}
                              className="truncate text-[11px] font-black"
                            >
                              {row.eggName}
                            </p>
                          </div>
                          <p className="truncate text-[10px] font-bold text-white">
                            Dropa de:{' '}
                            <span className="text-cyan-200">
                              {row.monsterName}
                            </span>
                          </p>
                            <p className="text-[9.5px] font-semibold tabular-nums text-amber-200/90">
                              Egg: {formatDropChancePct(row.eggChancePct)}
                              {row.dataName && row.dataChancePct !== null && (
                                <span className="text-sky-200/85">
                                  {' '}
                                  · {row.dataName}:{' '}
                                  {formatDropChancePct(row.dataChancePct)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onSimulateEggDrop?.(
                              row.eggItemKey,
                              row.monsterName,
                              row.isBoss
                            )
                          }
                          className="min-h-[36px] shrink-0 rounded-lg border border-amber-300/75 bg-amber-500/20 px-2.5 text-[10px] font-black text-amber-100 hover:bg-amber-500/35 active:scale-95"
                        >
                          Simular Drop
                        </button>
                      </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'itens' && (
            <>
              {/* Beginner Tutorial Preview & Reset Card (Richard Sampson — DATS) */}
              {onOpenBeginnerTutorial && (
                <div className="rounded-xl border border-amber-300/60 bg-gradient-to-r from-[#09286e]/95 via-[#071c52]/95 to-[#041232] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-10 shrink-0 items-end justify-center overflow-hidden rounded-lg border border-cyan-300/55 bg-[#030e2c]">
                      <img
                        src={RICHARD_SAMPSON_NPC.spriteUrl}
                        alt={RICHARD_SAMPSON_NPC.name}
                        referrerPolicy="no-referrer"
                        className="h-[94%] w-auto object-contain object-bottom"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-amber-200">
                        Tutorial de Iniciante · Richard Sampson (DATS)
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-cyan-100/85">
                        Visualize o passo a passo completo de 7 etapas exibido aos novos jogadores no DATS.
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBeginnerTutorial();
                      }}
                      className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[11px] font-black text-slate-950 whitespace-nowrap hover:brightness-110 active:scale-95"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Abrir Tutorial Agora</span>
                    </button>
                    {onResetBeginnerTutorial && (
                      <button
                        type="button"
                        onClick={onResetBeginnerTutorial}
                        className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-cyan-300/55 bg-[#072462] px-3 text-[11px] font-extrabold text-cyan-100 whitespace-nowrap hover:bg-sky-800 active:scale-95"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Resetar Status Iniciante</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Official Evoluter Spawner */}
              <div className="rounded-xl border border-fuchsia-300/65 bg-gradient-to-r from-[#17093b]/95 via-[#071a4c]/95 to-[#041232] p-3 shadow-[0_0_18px_rgba(232,121,249,0.22)]">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <img
                      src={EVOLUTER_ICON_URL}
                      alt="Evoluter"
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 shrink-0 rounded-lg border border-fuchsia-300/80 object-cover shadow-[0_0_14px_rgba(232,121,249,0.55)]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-fuchsia-200">
                        Evoluter · Desbloqueio de Evoluções
                      </p>
                      <p className="text-[10px] font-bold text-cyan-200/85">
                        Na mochila:{' '}
                        <strong className="tabular-nums text-white">
                          {getOwnedQty(EVOLUTER_ITEM_KEY)}
                        </strong>{' '}
                        · Ultimate (3×) · Mega (6× ou 8×)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                  {[1, 3, 8, 25].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => onGrantItem(EVOLUTER_ITEM_KEY, qty)}
                      className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-fuchsia-300/75 bg-fuchsia-600/25 px-2 text-[11px] font-black text-fuchsia-100 hover:bg-fuchsia-500/40 active:scale-95"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Hatch Backup Spawner */}
              <div className="rounded-xl border border-cyan-300/65 bg-gradient-to-r from-[#071f4c]/95 via-[#061844]/95 to-[#041232] p-3 shadow-[0_0_18px_rgba(56,232,255,0.2)]">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <img
                      src={HATCH_BACKUP_ICON_URL}
                      alt="Hatch Backup"
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 shrink-0 rounded-lg border border-cyan-300/80 object-cover shadow-[0_0_14px_rgba(56,232,255,0.5)]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-cyan-200">
                        Hatch Backup · Proteção de Incubadora
                      </p>
                      <p className="text-[10px] font-bold text-cyan-100/80">
                        Na mochila:{' '}
                        <strong className="tabular-nums text-white">
                          {getOwnedQty(HATCH_BACKUP_ITEM_KEY)}
                        </strong>{' '}
                        · Impede quebra do DigiEgg ao falhar
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                  {[1, 5, 10, 25].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => onGrantItem(HATCH_BACKUP_ITEM_KEY, qty)}
                      className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-cyan-300/75 bg-cyan-500/20 px-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-500/35 active:scale-95"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server EXP Rate Control (GM) */}
              {onSetServerExpRate && (
                <div className="rounded-xl border border-amber-300/45 bg-gradient-to-b from-[#09245e] to-[#041232] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>Taxa de EXP do Servidor</span>
                    </span>
                    <span className="text-xs font-black tabular-nums text-cyan-200">
                      Ativo: {serverExpRatePct ?? 100}% EXP
                    </span>
                  </div>
                  <p className="mb-2 text-[10.5px] text-slate-300">
                    100% é a taxa normal. Alterar aqui sincroniza o bônus para todo o servidor em tempo real.
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ALLOWED_SERVER_EXP_RATES.map((rate) => {
                      const active = (serverExpRatePct ?? 100) === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => onSetServerExpRate(rate)}
                          className={`flex min-h-[42px] flex-col items-center justify-center rounded-xl border px-1.5 text-[11px] font-black transition active:scale-95 ${
                            active
                              ? 'border-amber-300 bg-amber-400/25 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                              : 'border-cyan-400/35 bg-[#051a48] text-cyan-100 hover:border-cyan-200'
                          }`}
                        >
                          <span>{rate}%</span>
                          <span className="text-[8.5px] font-bold opacity-80">
                            {rate === 100 ? 'Normal' : `+${rate - 100}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Currency Spawner */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                  <Coins className="h-4 w-4 text-amber-300" />
                  <span>Moedas & Economia (Bits / DL Din)</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(1_000, 0)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-sky-300/60 bg-sky-500/20 px-2 text-[11px] font-black text-sky-100 hover:bg-sky-500/30 active:scale-95"
                  >
                    <Coins className="h-3.5 w-3.5 shrink-0" />
                    <span>+1M</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(100_000, 0)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-amber-300/65 bg-amber-500/20 px-2 text-[11px] font-black text-amber-200 hover:bg-amber-500/30 active:scale-95"
                  >
                    <Coins className="h-3.5 w-3.5 shrink-0" />
                    <span>+100M</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(1_000_000, 0)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-yellow-300/80 bg-yellow-500/25 px-2 text-[11px] font-black text-yellow-100 hover:bg-yellow-500/35 active:scale-95"
                  >
                    <Coins className="h-3.5 w-3.5 shrink-0" />
                    <span>+1T</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(0, 500)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-cyan-300/75 bg-cyan-500/20 px-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-500/30 active:scale-95"
                  >
                    <Gem className="h-3.5 w-3.5 shrink-0" />
                    <span>+500 DL Din</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(0, 5_000)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-amber-300/80 bg-amber-500/25 px-2 text-[11px] font-black text-amber-100 hover:bg-amber-500/35 active:scale-95"
                  >
                    <Gem className="h-3.5 w-3.5 shrink-0" />
                    <span>+5.000 DL Din</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onToggleInfiniteDCoin
                        ? onToggleInfiniteDCoin(!gmInfiniteDCoin)
                        : onGrantCurrency(0, 999_999_999)
                    }
                    className={`col-span-2 flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-black transition active:scale-95 sm:col-span-5 ${
                      gmInfiniteDCoin
                        ? 'border-emerald-300 bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                        : 'border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110'
                    }`}
                  >
                    <Gem className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {gmInfiniteDCoin
                        ? '∞ Modo DL Din Infinito ATIVO (999.999.999) · Clique para Desligar'
                        : '∞ Ativar DL Din Infinito na Conta GM (999.999.999)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Official MudFrigimon HP Foods & DS Vitamins */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <HeartPulse className="h-4 w-4 text-rose-300" />
                    <span>Comidas HP & Vitaminas DS (MudFrigimon)</span>
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-slate-300">
                    {MUDFRIGIMON_CONSUMABLES.length} itens
                  </span>
                </div>

                <div className="grid max-h-[210px] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
                  {MUDFRIGIMON_CONSUMABLES.map((item) => (
                    <div
                      key={item.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-[#061844] px-2 py-1.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <img
                          src={item.iconUrl}
                          alt={item.name}
                          className="h-8 w-8 shrink-0 rounded-md border border-white/15 bg-[#02091c] object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-extrabold text-white">
                            {item.name}
                          </p>
                          <p className="truncate text-[9.5px] font-semibold text-cyan-200/80">
                            {item.hpRestore
                              ? `+${item.hpRestore.toLocaleString('pt-BR')} HP`
                              : `+${(item.dsRestore ?? 0).toLocaleString('pt-BR')} DS`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onGrantItem(item.itemKey, 10)}
                          className="min-h-[34px] rounded-lg border border-emerald-400/55 bg-emerald-900/60 px-2 text-[10px] font-black text-emerald-200 hover:bg-emerald-800 active:scale-95"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backpack Management */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>Mochila do Personagem</span>
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-slate-300">
                    {inventory.length}/{safeUnlockedSlots} slots
                  </span>
                </div>

                {inventory.length > 0 && (
                  <div className="mt-2.5">
                    {!confirmClear ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-950/60 px-3 text-[11px] font-extrabold text-rose-200 hover:bg-rose-900/75"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Esvaziar Mochila ({inventory.length} itens)</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="min-h-[40px] rounded-xl border border-cyan-400/40 bg-[#072158] font-bold text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClearInventory();
                            setConfirmClear(false);
                          }}
                          className="min-h-[40px] rounded-xl border border-rose-300 bg-rose-600 font-black text-white"
                        >
                          Confirmar Limpeza
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tamer Switcher & Selection Screens Preview */}
              {(onSwitchTamer || onOpenSelectionFlow) && (
                <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                  {onSwitchTamer && (
                    <>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                        <UserCheck className="h-4 w-4 text-sky-300" />
                        <span>Trocar Tamer</span>
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TAMER_CHARACTERS.map((t) => {
                          const active = t.id === currentTamerId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onSwitchTamer(t.id)}
                              className={`min-h-[40px] rounded-lg border px-1 text-[11px] font-black transition active:scale-95 ${
                                active
                                  ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                                  : 'border-cyan-400/30 bg-[#061844] text-sky-100 hover:bg-[#0b2a6b]'
                              }`}
                            >
                              {t.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {onOpenSelectionFlow && (
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSelectionFlow('character-select');
                        }}
                        className="min-h-[40px] rounded-lg border border-cyan-400/40 bg-[#061844] px-2 text-[10.5px] font-extrabold text-cyan-100 hover:bg-[#0b2a6b]"
                      >
                        Tela Escolha de Tamer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSelectionFlow('digimon-select');
                        }}
                        className="min-h-[40px] rounded-lg border border-cyan-400/40 bg-[#061844] px-2 text-[10.5px] font-extrabold text-cyan-100 hover:bg-[#0b2a6b]"
                      >
                        Tela Escolha de Inicial
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Map Teleporter */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  <span>Teleporte Rápido GM</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    { id: DATS_MAP_ID as PlayableMapId, label: 'DATS Center', sub: 'Safe' },
                    { id: HUNTING_MAP_ID as PlayableMapId, label: 'Planície', sub: 'Lv. 1–10' },
                    { id: DATA_FOREST_MAP_ID as PlayableMapId, label: 'Floresta', sub: 'Lv. 10–20' },
                    { id: DIGI_MOUNTAIN_MAP_ID as PlayableMapId, label: 'Montanha', sub: 'Lv. 20–30' },
                    { id: DIGITAL_DESERT_MAP_ID as PlayableMapId, label: 'Deserto', sub: 'Lv. 30–40' },
                    { id: DATA_SEA_MAP_ID as PlayableMapId, label: 'Mar Dados', sub: 'Lv. 40–50' },
                    { id: DIGIMON_ISLAND_MAP_ID as PlayableMapId, label: 'Ilha Digi', sub: 'Lv. 50–60' },
                    { id: DARK_AREA_MAP_ID as PlayableMapId, label: 'Sombria', sub: 'Lv. 60–70' },
                    { id: VIRTUAL_WORLD_MAP_ID as PlayableMapId, label: 'Virtual', sub: 'Lv. 70–80' },
                  ].map((dest) => {
                    const isHere = currentMapId === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        disabled={isHere}
                        onClick={() => {
                          onTravelToMap(dest.id);
                          onClose();
                        }}
                        className={`flex min-h-[46px] flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center transition active:scale-95 ${
                          isHere
                            ? 'border-amber-300/80 bg-amber-500/20 text-amber-200'
                            : 'border-cyan-400/45 bg-[#082c74] text-white hover:bg-sky-700'
                        }`}
                      >
                        <span className="flex items-center gap-1 text-[10.5px] font-black leading-tight">
                          {dest.id !== DATS_MAP_ID && <Swords className="h-3 w-3 text-amber-300" />}
                          {dest.label}
                        </span>
                        <span className="mt-0.5 text-[9px] font-bold text-cyan-200/85">
                          {isHere ? 'Atual' : dest.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const AdminTestModal = memo(
  AdminTestModalInner,
  (prev, next) =>
    prev.digimon.id === next.digimon.id &&
    prev.digimonStats.level === next.digimonStats.level &&
    prev.digimonStats.hatchGrade === next.digimonStats.hatchGrade &&
    prev.digimonStats.hatchSizePct === next.digimonStats.hatchSizePct &&
    prev.currentMapId === next.currentMapId &&
    prev.currentTamerId === next.currentTamerId &&
    prev.actorUid === next.actorUid &&
    prev.gmTamerName === next.gmTamerName &&
    prev.serverExpRatePct === next.serverExpRatePct &&
    prev.bits === next.bits &&
    prev.dCoin === next.dCoin &&
    prev.gmInfiniteDCoin === next.gmInfiniteDCoin &&
    prev.inventory === next.inventory &&
    prev.unlockedSlots === next.unlockedSlots &&
    prev.partyCount === next.partyCount &&
    prev.archiveCount === next.archiveCount &&
    prev.unlockedArchiveSlots === next.unlockedArchiveSlots
);

