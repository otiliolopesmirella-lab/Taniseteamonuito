import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Crown,
  Database,
  DoorOpen,
  Egg,
  Info,
  Megaphone,
  Monitor,
  Mountain,
  ScrollText,
  Shield,
  Sparkles,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  createInitialPartnerRuntime,
  triggerPartnerManualSkill,
  updatePartnerAI,
  type ActiveCombatEffect,
  type FloatingDamageText,
  type PartnerRuntimeState,
} from '../ai/partnerAI';
import {
  buildDatsCenterStaticLayer,
  buildDatsDepthProps,
  DATS_ARCHIVE_STATION,
  DATS_COLLIDERS,
  DATS_INCUBATOR_STATION,
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
  DATS_WORLD_H,
  DATS_WORLD_W,
  drawDatsGroundAnimations,
  getSpawnSlotForAccount,
  type DatsCollider,
  type DatsInteractionPoint,
} from '../maps/datsCenterMap';
import {
  drawDimensionalPortalGate,
  drawDimensionalPortalGround,
} from '../maps/portalRenderer';
import {
  buildDTerminalDepthProps,
  buildDTerminalStaticLayer,
  D_TERMINAL_COLLIDERS,
  D_TERMINAL_CONDUCTOR_NPC,
  D_TERMINAL_INTERACTION_POINTS,
  D_TERMINAL_MAP_ID,
  D_TERMINAL_RETURN_PORTAL,
  D_TERMINAL_SPAWN_POINT,
  D_TERMINAL_WORLD_H,
  D_TERMINAL_WORLD_W,
  drawDTerminalGroundAnimations,
  PAWNCHESSMON_BLACK_SPRITE_URL,
} from '../maps/dTerminalMap';
import {
  getPortalsForMap,
  type MapPortalLink,
} from '../maps/mapPortals';
import {
  buildHuntingDepthProps,
  buildHuntingFieldStaticLayer,
  createInitialWildMonsters,
  drawEnemyMonster,
  drawHuntingGroundAnimations,
  fieldNpcToDialogueModel,
  FRIENDLY_FIELD_NPCS,
  getHuntingPerspectiveScale,
  getHuntingZoneAtPoint,
  HUNTING_COLLIDERS,
  HUNTING_INTERACTION_POINTS,
  HUNTING_MAP_ID,
  HUNTING_SPAWN_POINT,
  HUNTING_WORLD_H,
  HUNTING_WORLD_W,
  isPointInHuntingSafeZone,
  type EnemyMonsterInstance,
} from '../maps/huntingFieldMap';
import {
  buildDataForestDepthProps,
  buildDataForestStaticLayer,
  createInitialDataForestMonsters,
  DATA_FOREST_BOSS_ARENA,
  DATA_FOREST_COLLIDERS,
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_INTERACTION_POINTS,
  DATA_FOREST_MAP_ID,
  DATA_FOREST_SPAWN_POINT,
  DATA_FOREST_WORLD_H,
  DATA_FOREST_WORLD_W,
  drawDataForestGroundAnimations,
  getDataForestPerspectiveScale,
  getDataForestZoneAtPoint,
  isPointInDataForestSafeZone,
} from '../maps/dataForestMap';
import {
  buildDigiMountainDepthProps,
  buildDigiMountainStaticLayer,
  createInitialDigiMountainMonsters,
  DIGI_MOUNTAIN_COLLIDERS,
  DIGI_MOUNTAIN_FRIENDLY_NPCS,
  DIGI_MOUNTAIN_INTERACTION_POINTS,
  DIGI_MOUNTAIN_MAP_ID,
  DIGI_MOUNTAIN_SPAWN_POINT,
  DIGI_MOUNTAIN_WORLD_H,
  DIGI_MOUNTAIN_WORLD_W,
  drawDigiMountainGroundAnimations,
  getDigiMountainPerspectiveScale,
  getDigiMountainZoneAtPoint,
  isPointInDigiMountainSafeZone,
} from '../maps/digiMountainMap';
import {
  buildDigitalDesertDepthProps,
  buildDigitalDesertStaticLayer,
  createInitialDigitalDesertMonsters,
  DIGITAL_DESERT_COLLIDERS,
  DIGITAL_DESERT_FRIENDLY_NPCS,
  DIGITAL_DESERT_INTERACTION_POINTS,
  DIGITAL_DESERT_MAP_ID,
  DIGITAL_DESERT_SPAWN_POINT,
  DIGITAL_DESERT_WORLD_H,
  DIGITAL_DESERT_WORLD_W,
  drawDigitalDesertGroundAnimations,
  getDigitalDesertPerspectiveScale,
  getDigitalDesertZoneAtPoint,
  isPointInDigitalDesertSafeZone,
} from '../maps/digitalDesertMap';
import {
  buildDataSeaDepthProps,
  buildDataSeaStaticLayer,
  createInitialDataSeaMonsters,
  DATA_SEA_COLLIDERS,
  DATA_SEA_FRIENDLY_NPCS,
  DATA_SEA_INTERACTION_POINTS,
  DATA_SEA_MAP_ID,
  DATA_SEA_SPAWN_POINT,
  DATA_SEA_WORLD_H,
  DATA_SEA_WORLD_W,
  drawDataSeaGroundAnimations,
  getDataSeaPerspectiveScale,
  getDataSeaZoneAtPoint,
  isPointInDataSeaSafeZone,
} from '../maps/dataSeaMap';
import {
  buildDigimonIslandDepthProps,
  buildDigimonIslandStaticLayer,
  createInitialDigimonIslandMonsters,
  DIGIMON_ISLAND_COLLIDERS,
  DIGIMON_ISLAND_FRIENDLY_NPCS,
  DIGIMON_ISLAND_INTERACTION_POINTS,
  DIGIMON_ISLAND_MAP_ID,
  DIGIMON_ISLAND_SPAWN_POINT,
  DIGIMON_ISLAND_WORLD_H,
  DIGIMON_ISLAND_WORLD_W,
  drawDigimonIslandGroundAnimations,
  getDigimonIslandPerspectiveScale,
  getDigimonIslandZoneAtPoint,
  isPointInDigimonIslandSafeZone,
} from '../maps/digimonIslandMap';
import {
  buildDarkAreaDepthProps,
  buildDarkAreaStaticLayer,
  createInitialDarkAreaMonsters,
  DARK_AREA_COLLIDERS,
  DARK_AREA_FRIENDLY_NPCS,
  DARK_AREA_INTERACTION_POINTS,
  DARK_AREA_MAP_ID,
  DARK_AREA_SPAWN_POINT,
  DARK_AREA_WORLD_H,
  DARK_AREA_WORLD_W,
  drawDarkAreaGroundAnimations,
  getDarkAreaPerspectiveScale,
  getDarkAreaZoneAtPoint,
  isPointInDarkAreaSafeZone,
} from '../maps/darkAreaMap';
import {
  buildVirtualWorldDepthProps,
  buildVirtualWorldStaticLayer,
  createInitialVirtualWorldMonsters,
  VIRTUAL_WORLD_COLLIDERS,
  VIRTUAL_WORLD_FRIENDLY_NPCS,
  VIRTUAL_WORLD_INTERACTION_POINTS,
  VIRTUAL_WORLD_MAP_ID,
  VIRTUAL_WORLD_SPAWN_POINT,
  VIRTUAL_WORLD_WORLD_H,
  VIRTUAL_WORLD_WORLD_W,
  drawVirtualWorldGroundAnimations,
  getVirtualWorldPerspectiveScale,
  getVirtualWorldZoneAtPoint,
  isPointInVirtualWorldSafeZone,
} from '../maps/virtualWorldMap';
import {
  BOSS_AGGRO_DETECT_RADIUS_PX,
  BOSS_AOE_SKILL_COOLDOWN_SEC,
  BOSS_AOE_SKILL_RADIUS_PX,
  enqueueWorldBossDamage,
  KUWAGAMON_BOSS_ID,
  selectRaidBossPrimaryTarget,
  subscribeWorldBoss,
  tryRespawnWorldBoss,
  type RaidBossAttackerCandidate,
  type WorldBossLiveState,
} from '../services/worldBossService';
import {
  getAdventureProgressForAccount,
  saveAdventureProgressForAccount,
} from '../services/authService';
import {
  clampHatchSizePct,
  computeHatchVisualScale,
  createInventoryPayloadFromCatalog,
  EVOLUTER_ICON_URL,
  EVOLUTER_ITEM_KEY,
  formatXpBoostRemainingLabel,
  getActiveXpBoostBonusPct,
  getCatalogItemByKey,
  getHatchQualityProfile,
  getXpBoostSpecByKey,
  rollHatchSizePct,
  listAllDataDefinitions,
  listAllDigiEggDefinitions,
} from '../data/itemsCatalog';
import type { DwCoinShopOffer } from '../data/dwCoinShopCatalog';
import {
  computeDmoMatchupMultiplier,
  getDmoSkillSpec,
} from '../data/dmoSkillCatalog';
import {
  addInventoryItem,
  applyExpToDigimon,
  applyExpToTamer,
  BASIC_BITS_SHOP_ITEMS,
  calcDigimonExpToNext,
  calcDigimonMaxDs,
  calcDigimonMaxHp,
  calcDmoKillExp,
  calcTamerExpToNext,
  computeDerivedDigimonAttributes,
  computeTamerAttributes,
  EQUIPMENT_SLOT_LABELS,
  equipInventoryItem,
  evolveDigimonAccountState,
  flushPendingLocalHudSave,
  getFormEvoluterCost,
  getNextEvolutionInfo,
  getOwnedEvoluterCount,
  getUnlockedInventorySlots,
  INVENTORY_TOTAL_SLOTS,
  isEvolutionSlotUnlockedByEvoluter,
  loadAccountHudState,
  MAX_GAME_LEVEL,
  sanitizeUnlockedFormIdsForDigimon,
  saveAccountHudState,
  setDigimonLevelForTesting,
  switchActiveDigimonForAdmin,
  unequipSlotItem,
  unlockDigimonEvolutionWithEvoluters,
} from '../services/hudGameService';
import {
  flushPendingCloudSaves,
  recordObservedCloudHudProgress,
} from '../services/cloudSaveService';
import {
  rollAndApplyDigimonDrops,
  type RolledDropReward,
} from '../services/dropService';
import {
  executeDataInjection,
  executeDigiEggHatch,
  executeEggReinforce,
} from '../services/incubatorService';
import { reconcilePendingMercadoPagoOrders } from '../services/mercadoPagoService';
import {
  addDigimonToArchiveForAdmin,
  addDigimonToPartyReserve,
  ARCHIVE_TOTAL_SLOTS,
  getUnlockedArchiveSlots,
  moveArchiveSlotToPartyReserve,
  movePartyReserveToArchive,
  releaseArchivedDigimon,
  renameArchivedDigimon,
  sanitizePartyDigimons,
  swapActiveDigimonWithArchiveSlot,
  swapActiveDigimonWithPartyReserve,
  unlockArchiveSlotsForAdmin,
} from '../services/archiveService';
import {
  applyServerExpMultiplier,
  setServerExpRate,
  subscribeServerAnnouncement,
  subscribeServerExpRate,
  type ServerAnnouncementState,
  type ServerExpRatePct,
} from '../services/serverConfigService';
import { subscribeMyBanStatus } from '../services/banService';
import { recordDwCoinSpendTransaction } from '../services/dwCoinLedgerService';
import { logGmAction } from '../services/gmControlService';
import { isCurrentAuthUserBootstrappedGm } from '../services/gmRoleService';
import {
  acceptGuildInvite,
  canMemberInviteToGuild,
  computeDailyGuildEventStandings,
  contributeGuildExp,
  declineGuildInvite,
  fetchRecruitingGuilds,
  getCurrentActorUid,
  getGuildMaxMembersForLevel,
  getServerDayKey,
  sendGuildChatMessage,
  sendGuildInvite,
  subscribeIncomingGuildInvites,
  subscribePlayerGuild,
  updateGuildLeaderPhoto,
  type GuildInviteRecord,
  type GuildRecord,
} from '../services/guildService';
import {
  sendGlobalChatMessage,
  subscribeGlobalChat,
} from '../services/globalChatService';
import {
  AUTO_FARM_VIP_COST_DWCOIN,
  AUTO_FARM_VIP_DURATION_DAYS,
  AUTO_FARM_VIP_DURATION_MS,
  AUTO_FARM_VIP_XP_BONUS_PCT,
  formatAutoFarmVipExpiryDate,
  isAutoFarmVipActive,
  loadAutoHuntConfig,
  pickBestRecoveryItem,
  saveAutoHuntConfig,
  type AutoHuntConfig,
} from '../services/autoHuntService';
import {
  fetchOwnPlayerRankingBackup,
  syncGuildRankingSnapshot,
  syncPlayerRankingSnapshot,
} from '../services/rankingsService';
import {
  applyPendingReferralCodeIfAny,
  ensureOwnReferralProfile,
  formatReferralCodeDisplay,
} from '../services/referralService';
import {
  acceptPartyInvite,
  calcPartyShareFactor,
  declinePartyInvite,
  getPartySharePercent,
  leaveOrKickParty,
  MAX_PARTY_MEMBERS,
  publishPartyXpEvent,
  sendPartyChatMessage,
  sendPartyInvite,
  subscribeIncomingPartyInvites,
  subscribeMyParty,
  subscribePartyChat,
  subscribePartyXpEvents,
  syncLocalMemberInParty,
  type PartyActorProfile,
  type PartyInviteRecord,
  type PartyRecord,
} from '../services/partyService';
import {
  DIGIMON_FRAME_COUNT,
  drawDigimonAttackPoseFrame,
  drawDigimonPartnerFrame,
  drawDigimonSpecialVfx,
  getPartnerAerialProfile,
  getPartnerLiveHoverAltitude,
  preloadDigimonPartnerAssets,
} from '../sprites/digimonPartnerSprites';
import {
  drawTamerMovementFrame,
  preloadTamerSheets,
  TAMER_FRAME_WRAP,
  type CardinalDirection,
  type TamerMovementState,
} from '../sprites/tamerRealSheets';
import {
  DATS_FIXED_NPCS,
  drawFixedWorldNpc,
  isPointInsideNpcHitbox,
  MIKI_MARKET_NPC,
  MUDFRIGIMON_NPC,
  preloadFixedNpcSprite,
  type FixedWorldNpc,
} from '../sprites/npcSprites';
import {
  getWildDigimonPortraitUrl,
  preloadWildDigimonSpritesForMap,
} from '../sprites/wildDigimonSprites';
import { TAMER_CHARACTERS } from '../sprites/tamerSprites';
import {
  broadcastWorldChatBubble,
  broadcastWorldCombatAction,
  bumpPresenceSessionEpoch,
  CHANNEL_HARD_CAPACITY,
  markLocalWorldPresenceOffline,
  publishLocalWorldPresence,
  safeChannelId,
  subscribeOnlineWorldPlayers,
  type LocalPresenceState,
  type RemoteWorldPlayer,
  type WorldChannelId,
} from '../services/worldPresenceService';
import type { AppPreferences } from '../types/auth';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import { getWildDigimonClassification } from '../types/classification';
import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  resolveActiveFormProfile,
  resolveStarterIdForForm,
  type DigimonFormId,
  type DigimonFormProfile,
  type PartnerAttackKind,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import type {
  AccountHudPersistence,
  ChatChannel,
  ChatMessage,
  EquipmentSlotId,
  HatchQualityGrade,
  HudNotificationItem,
  HudWindowId,
  InventoryItem,
  LiveWorldHudSnapshot,
} from '../types/hud';
import {
  isValidAvatarPhotoDataUrl,
  isValidCoverPhotoDataUrl,
} from '../utils/avatarPhoto';
import { formatDigitalCurrency } from '../utils/currency';
import {
  drawDigiEggDropFx,
  preloadDigiEggDropIcon,
  type DigiEggDropFx,
} from '../utils/digiEggDropFx';
import {
  drawInWorldEvoBackLayer,
  drawInWorldEvoFrontLayer,
  getInWorldEvoSpriteTransform,
  type InWorldEvoAnimationState,
} from '../utils/inWorldEvolutionFx';
import {
  drawInWorldSwapBackLayer,
  drawInWorldSwapFrontLayer,
  getInWorldSwapSpriteTransform,
  type InWorldSwapAnimationState,
} from '../utils/inWorldSwapFx';
import {
  playDigiEggCollectPing,
  playDigiEggDropSound,
  playDigitalTone,
  playIncubatorBrokenAlarmSound,
  playIncubatorFailCrackSound,
  playIncubatorSuccessSound,
  playInWorldDigivolutionSound,
  playPartnerSwapSound,
  worldBgmPlayer,
} from '../utils/soundFx';
import { ActiveDigimonHudPanel } from './hud/ActiveDigimonHudPanel';
import {
  DigimonHatchShowcaseModal,
  type HatchShowcaseData,
} from './hud/DigimonHatchShowcaseModal';
import { BottomHudDock } from './hud/BottomHudDock';
import { ChatHudPanel } from './hud/ChatHudPanel';
import { DigimonBottomActionDock } from './hud/DigimonBottomActionDock';
import { DigimonClassificationBadges } from './hud/DigimonClassificationBadges';
import { DigimonSwitcherList } from './hud/DigimonSwitcherList';
import {
  DigiEggDropAlertBanner,
  DropRewardToastStack,
  type DigiEggDropAlertItem,
  type DropToastItem,
} from './hud/DropRewardToast';
import { getMudfrigimonConsumableByKey } from '../data/mudfrigimonShopCatalog';
import { EvoluterUnlockModal } from './hud/EvoluterUnlockModal';
import { HudWindowsOverlay } from './hud/HudWindowsOverlay';
import { InventoryHudWindow } from './hud/InventoryHudWindow';
import { MinimapHudPanel } from './hud/MinimapHudPanel';
import {
  MudfrigimonShopModal,
  type MudfrigimonPurchaseResult,
} from './hud/MudfrigimonShopModal';
import {
  PlayerMarketModal,
  type MarketActionResult,
} from './hud/PlayerMarketModal';
import {
  buildInventoryPayloadFromMarketListing,
  cancelPlayerMarketListing,
  claimMarketListingPayout,
  createPlayerMarketListing,
  purchasePlayerMarketListing,
  subscribeGlobalPlayerMarket,
  subscribeSellerMarketListings,
  type PlayerMarketListingRecord,
} from '../services/playerMarketService';
import { isItemNonSellable } from '../data/itemsCatalog';
import { NpcDialogueModal } from './hud/NpcDialogueModal';
import { RemotePlayerInspectorCard } from './hud/OnlinePlayersPanel';
import { PartyHudPanel } from './hud/PartyHudPanel';
import { RichardSampsonTutorialModal } from './hud/RichardSampsonTutorialModal';
import { TamerHudPanel } from './hud/TamerHudPanel';
import {
  WorldBossGlobalBanner,
  WorldBossHudCard,
  type WorldBossAnnouncement,
} from './hud/WorldBossHudPanel';

type ActiveWorldMapId =
  | typeof DATS_MAP_ID
  | typeof D_TERMINAL_MAP_ID
  | typeof HUNTING_MAP_ID
  | typeof DATA_FOREST_MAP_ID
  | typeof DIGI_MOUNTAIN_MAP_ID
  | typeof DIGITAL_DESERT_MAP_ID
  | typeof DATA_SEA_MAP_ID
  | typeof DIGIMON_ISLAND_MAP_ID
  | typeof DARK_AREA_MAP_ID
  | typeof VIRTUAL_WORLD_MAP_ID;

interface TamerWorldCanvasProps {
  selection: SavedCharacterSelection;
  starterDigimon: SavedStarterDigimon;
  preferences: AppPreferences;
  isGM: boolean;
  cloudIsGm?: boolean;
  onUpdatePreferences: (next: AppPreferences) => void;
  onAdminSwitchStarter?: (starterId: StarterDigimonId) => void;
  onAdminSwitchTamer?: (tamerId: TamerId) => void;
  onOpenSelectionFlow?: (screen: 'character-select' | 'digimon-select') => void;
  onExitToLogin: () => void;
}

const PLAYER_RADIUS = 18;

const DATS_SOUTH_PORTAL_LINK: MapPortalLink = {
  id: 'digital-world-portal',
  role: 'next',
  x: 800,
  y: 1316,
  radius: 86,
  targetMapId: D_TERMINAL_MAP_ID,
  minLevel: 1,
  title: 'D-Terminal',
  subtitle: 'Estação Trailmon · Acesso ao Mundo Digital',
  theme: 'digital',
};

function isCombatWorldMap(mapId: ActiveWorldMapId): boolean {
  return (
    mapId === HUNTING_MAP_ID ||
    mapId === DATA_FOREST_MAP_ID ||
    mapId === DIGI_MOUNTAIN_MAP_ID ||
    mapId === DIGITAL_DESERT_MAP_ID ||
    mapId === DATA_SEA_MAP_ID ||
    mapId === DIGIMON_ISLAND_MAP_ID ||
    mapId === DARK_AREA_MAP_ID ||
    mapId === VIRTUAL_WORLD_MAP_ID
  );
}

function getMapDimensions(mapId: ActiveWorldMapId): {
  worldW: number;
  worldH: number;
  minY: number;
} {
  if (mapId === VIRTUAL_WORLD_MAP_ID) {
    return {
      worldW: VIRTUAL_WORLD_WORLD_W,
      worldH: VIRTUAL_WORLD_WORLD_H,
      minY: 430,
    };
  }
  if (mapId === DARK_AREA_MAP_ID) {
    return {
      worldW: DARK_AREA_WORLD_W,
      worldH: DARK_AREA_WORLD_H,
      minY: 360,
    };
  }
  if (mapId === DIGIMON_ISLAND_MAP_ID) {
    return {
      worldW: DIGIMON_ISLAND_WORLD_W,
      worldH: DIGIMON_ISLAND_WORLD_H,
      minY: 360,
    };
  }
  if (mapId === DATA_SEA_MAP_ID) {
    return {
      worldW: DATA_SEA_WORLD_W,
      worldH: DATA_SEA_WORLD_H,
      minY: 360,
    };
  }
  if (mapId === DIGITAL_DESERT_MAP_ID) {
    return {
      worldW: DIGITAL_DESERT_WORLD_W,
      worldH: DIGITAL_DESERT_WORLD_H,
      minY: 360,
    };
  }
  if (mapId === DIGI_MOUNTAIN_MAP_ID) {
    return {
      worldW: DIGI_MOUNTAIN_WORLD_W,
      worldH: DIGI_MOUNTAIN_WORLD_H,
      minY: 300,
    };
  }
  if (mapId === DATA_FOREST_MAP_ID) {
    return {
      worldW: DATA_FOREST_WORLD_W,
      worldH: DATA_FOREST_WORLD_H,
      minY: 374,
    };
  }
  if (mapId === HUNTING_MAP_ID) {
    return {
      worldW: HUNTING_WORLD_W,
      worldH: HUNTING_WORLD_H,
      minY: 348,
    };
  }
  if (mapId === D_TERMINAL_MAP_ID) {
    return {
      worldW: D_TERMINAL_WORLD_W,
      worldH: D_TERMINAL_WORLD_H,
      minY: 220,
    };
  }
  return {
    worldW: DATS_WORLD_W,
    worldH: DATS_WORLD_H,
    minY: 334,
  };
}

function getMapPerspectiveScale(mapId: ActiveWorldMapId, worldY: number): number {
  if (mapId === VIRTUAL_WORLD_MAP_ID) return getVirtualWorldPerspectiveScale(worldY);
  if (mapId === DARK_AREA_MAP_ID) return getDarkAreaPerspectiveScale(worldY);
  if (mapId === DIGIMON_ISLAND_MAP_ID) return getDigimonIslandPerspectiveScale(worldY);
  if (mapId === DATA_SEA_MAP_ID) return getDataSeaPerspectiveScale(worldY);
  if (mapId === DIGITAL_DESERT_MAP_ID) return getDigitalDesertPerspectiveScale(worldY);
  if (mapId === DIGI_MOUNTAIN_MAP_ID) return getDigiMountainPerspectiveScale(worldY);
  if (mapId === DATA_FOREST_MAP_ID) return getDataForestPerspectiveScale(worldY);
  if (mapId === HUNTING_MAP_ID) return getHuntingPerspectiveScale(worldY);
  return 1;
}

function isPointInMapSafeZone(
  mapId: ActiveWorldMapId,
  x: number,
  y: number
): boolean {
  if (mapId === VIRTUAL_WORLD_MAP_ID) return isPointInVirtualWorldSafeZone(x, y);
  if (mapId === DARK_AREA_MAP_ID) return isPointInDarkAreaSafeZone(x, y);
  if (mapId === DIGIMON_ISLAND_MAP_ID) return isPointInDigimonIslandSafeZone(x, y);
  if (mapId === DATA_SEA_MAP_ID) return isPointInDataSeaSafeZone(x, y);
  if (mapId === DIGITAL_DESERT_MAP_ID) return isPointInDigitalDesertSafeZone(x, y);
  if (mapId === DIGI_MOUNTAIN_MAP_ID) return isPointInDigiMountainSafeZone(x, y);
  if (mapId === DATA_FOREST_MAP_ID) return isPointInDataForestSafeZone(x, y);
  if (mapId === HUNTING_MAP_ID) return isPointInHuntingSafeZone(x, y);
  return true;
}

function getMapDisplayLabel(mapId: ActiveWorldMapId, short = false): string {
  if (mapId === VIRTUAL_WORLD_MAP_ID) {
    return short ? 'Virtual' : 'Mundo Virtual';
  }
  if (mapId === DARK_AREA_MAP_ID) {
    return short ? 'Sombria' : 'Área Sombria';
  }
  if (mapId === DIGIMON_ISLAND_MAP_ID) {
    return short ? 'Ilha Digi' : 'Ilha dos Digimons';
  }
  if (mapId === DATA_SEA_MAP_ID) {
    return short ? 'Mar Dados' : 'Mar de Dados';
  }
  if (mapId === DIGITAL_DESERT_MAP_ID) {
    return short ? 'Deserto' : 'Deserto Digital';
  }
  if (mapId === DIGI_MOUNTAIN_MAP_ID) {
    return short ? 'Montanha' : 'Montanha Digi';
  }
  if (mapId === DATA_FOREST_MAP_ID) {
    return short ? 'Floresta' : 'Floresta de Dados';
  }
  if (mapId === HUNTING_MAP_ID) {
    return short ? 'Planície' : 'Planície Digital';
  }
  if (mapId === D_TERMINAL_MAP_ID) {
    return short ? 'D-Terminal' : 'D-Terminal';
  }
  return short ? 'DATS' : 'DATS Center';
}

/**
 * Responsive MMORPG camera framing across all maps (DATS Center, Planície Digital & Floresta de Dados):
 * pulls the camera back comfortably so the Tamer, large Mega partners, wild mobs and Raid Bosses
 * have generous breathing room while preventing out-of-bounds void edges.
 */
function getWorldCameraZoom(
  viewWidth: number,
  viewHeight: number,
  worldW: number,
  worldH: number,
  isCombatMap: boolean
): number {
  let desiredZoom: number;
  if (viewHeight < 460) {
    // Compact landscape phones (short viewport height)
    desiredZoom = isCombatMap ? 0.68 : 0.74;
  } else if (viewWidth < 520) {
    // Portrait phones
    desiredZoom = isCombatMap ? 0.72 : 0.76;
  } else if (viewWidth < 768) {
    desiredZoom = isCombatMap ? 0.76 : 0.8;
  } else if (viewWidth < 1024) {
    desiredZoom = isCombatMap ? 0.79 : 0.83;
  } else {
    desiredZoom = isCombatMap ? 0.82 : 0.85;
  }

  // Never zoom out further than the map boundaries allow (capped at 1.0 so wide screens never zoom in)
  const minNoVoidZoom = Math.min(
    1,
    Math.max(viewWidth / Math.max(1, worldW), viewHeight / Math.max(1, worldH))
  );
  return Math.max(desiredZoom, minNoVoidZoom);
}

function nowTimeStamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function snapToCardinalVector(dx: number, dy: number): {
  vx: number;
  vy: number;
  dir: CardinalDirection;
} {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { vx: 1, vy: 0, dir: 'E' }
      : { vx: -1, vy: 0, dir: 'W' };
  }
  return dy >= 0
    ? { vx: 0, vy: 1, dir: 'S' }
    : { vx: 0, vy: -1, dir: 'N' };
}

/**
 * Picks a 4-way cardinal facing direction with hysteresis around the 45° diagonal
 * so moving diagonally never flickers rapidly between two perpendicular directions.
 */
function resolveStableCardinalDir(
  dx: number,
  dy: number,
  currentDir: CardinalDirection
): CardinalDirection {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 0.001 && absY < 0.001) return currentDir;
  if (currentDir === 'E' || currentDir === 'W') {
    if (absY > absX * 1.25) {
      return dy >= 0 ? 'S' : 'N';
    }
    return dx >= 0 ? 'E' : 'W';
  }
  if (absX > absY * 1.25) {
    return dx >= 0 ? 'E' : 'W';
  }
  return dy >= 0 ? 'S' : 'N';
}

function resolveCircleRect(
  cx: number,
  cy: number,
  radius: number,
  rect: DatsCollider
): [number, number] {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) return [cx, cy];

  const dist = Math.sqrt(distSq);
  if (dist > 0.0001) {
    const overlap = radius - dist;
    return [cx + (dx / dist) * overlap, cy + (dy / dist) * overlap];
  }

  const leftPen = cx - rect.x;
  const rightPen = rect.x + rect.w - cx;
  const topPen = cy - rect.y;
  const bottomPen = rect.y + rect.h - cy;
  const m = Math.min(leftPen, rightPen, topPen, bottomPen);
  if (m === leftPen) return [rect.x - radius, cy];
  if (m === rightPen) return [rect.x + rect.w + radius, cy];
  if (m === topPen) return [cx, rect.y - radius];
  return [cx, rect.y + rect.h + radius];
}

function resolveCircleCircle(
  cx: number,
  cy: number,
  cRadius: number,
  ox: number,
  oy: number,
  oRadius: number
): [number, number] {
  const dx = cx - ox;
  const dy = cy - oy;
  const minDist = cRadius + oRadius;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minDist * minDist) return [cx, cy];
  const dist = Math.sqrt(distSq);
  if (dist < 0.0001) return [ox, oy + minDist];
  return [ox + (dx / dist) * minDist, oy + (dy / dist) * minDist];
}

function renderInteractionIcon(kind: DatsInteractionPoint['kind']) {
  if (kind === 'main-entrance') return <DoorOpen className="h-4 w-4 text-cyan-300" />;
  if (kind === 'mission-npc') return <ScrollText className="h-4 w-4 text-sky-300" />;
  if (kind === 'info-npc') return <Info className="h-4 w-4 text-emerald-300" />;
  if (kind === 'tamer-terminal') return <Monitor className="h-4 w-4 text-cyan-300" />;
  if (kind === 'digimon-incubator') return <Egg className="h-4 w-4 text-cyan-300" />;
  if (kind === 'digimon-archive') return <Database className="h-4 w-4 text-fuchsia-300" />;
  return <Sparkles className="h-4 w-4 text-amber-300" />;
}

interface SmoothedRemotePlayer {
  player: RemoteWorldPlayer;
  renderX: number;
  renderY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  visualDir: CardinalDirection;
  partnerRenderX: number;
  partnerRenderY: number;
  partnerTargetX: number;
  partnerTargetY: number;
  partnerVx: number;
  partnerVy: number;
  partnerVisualDir: CardinalDirection;
  lastPacketAtMs: number;
  frameTime: number;
  frameIndex: number;
  partnerFrameTime: number;
  partnerFrameIndex: number;
  bubbleText: string;
  bubbleExpiresAt: number;
  activeAttack: {
    kind: PartnerAttackKind;
    facingRight: boolean;
    elapsed: number;
    duration: number;
  } | null;
}

interface BossAoeWaveEffect {
  id: number;
  x: number;
  y: number;
  radius: number;
  elapsed: number;
  duration: number;
  hits: Array<{ x: number; y: number }>;
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  text: string,
  accentHex: string
) {
  const display = text.length > 48 ? `${text.slice(0, 45)}...` : text;
  ctx.save();
  ctx.font = '700 11px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  const metrics = ctx.measureText(display);
  const bw = Math.min(220, Math.max(44, metrics.width + 18));
  const bh = 22;
  const bx = x - bw / 2;
  const by = topY - bh - 6;

  ctx.fillStyle = 'rgba(248, 252, 255, 0.96)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Speech pointer triangle
  ctx.beginPath();
  ctx.moveTo(x - 5, by + bh);
  ctx.lineTo(x + 5, by + bh);
  ctx.lineTo(x, by + bh + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#07142b';
  ctx.fillText(display, x, by + 14.5, bw - 12);
  ctx.restore();
}

export function TamerWorldCanvas({
  selection,
  starterDigimon,
  preferences,
  isGM: isGmProp,
  cloudIsGm = false,
  onUpdatePreferences,
  onAdminSwitchStarter,
  onAdminSwitchTamer,
  onOpenSelectionFlow,
  onExitToLogin,
}: TamerWorldCanvasProps) {
  const soundEnabled = preferences.soundEnabled;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const isServerGm = Boolean(
    isGmProp && cloudIsGm && isCurrentAuthUserBootstrappedGm()
  );
  const isGM = isServerGm;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickKnobElRef = useRef<HTMLDivElement | null>(null);
  const joystickActiveRef = useRef(false);
  const isChatFocusedRef = useRef(false);

  const character = useMemo(
    () =>
      TAMER_CHARACTERS.find((c) => c.id === selection.characterId) ??
      TAMER_CHARACTERS[0],
    [selection.characterId]
  );

  const initialSpawn = useMemo(() => {
    const saved = getAdventureProgressForAccount(selection.accountUsername);
    const slot = getSpawnSlotForAccount(selection.accountUsername);

    // Todos os jogadores nascem diretamente na Praça Central da DATS ao logar
    return {
      mapId: DATS_MAP_ID as ActiveWorldMapId,
      x: slot.x,
      y: slot.y,
      dir: slot.facingDir,
      stepsCount: saved?.stepsCount ?? 0,
      discoveredZones: saved?.discoveredZones ?? [],
    };
  }, [selection.accountUsername]);

  const [loadedAssetsKey, setLoadedAssetsKey] = useState<string | null>(null);
  const targetAssetsKey = `${selection.characterId}:${starterDigimon.digimonId}`;
  const assetsReady = loadedAssetsKey === targetAssetsKey;

  // Real Account HUD Persistence (Tamer Lv/HP/DS/EXP, Digimon Lv/HP/DS/EXP, Bits, D-Coin, Inventory, Active Evolution Form)
  // Players always spawn in DATS Center (Safe Sanctuary) upon entering the server, so restore full HP & DS cleanly on entry.
  const initialHudAccount = useMemo(
    () =>
      loadAccountHudState(selection.accountUsername, starterDigimon.digimonId, {
        restoreFullVitalsOnSpawn: true,
      }),
    [selection.accountUsername, starterDigimon.digimonId]
  );
  const [hudAccount, setHudAccount] = useState<AccountHudPersistence>(initialHudAccount);
  const hudAccountRef = useRef<AccountHudPersistence>(initialHudAccount);

  // Heal zero/drained vitals locally on login/spawn without ever triggering an unconditional cloud overwrite
  // (prevents any stale/quota-failed local state from clobbering progressed Firestore saves).
  useEffect(() => {
    const cur = hudAccountRef.current;
    const needsVitalHeal =
      cur.digimon.hp <= 0 ||
      cur.digimon.ds <= 0 ||
      cur.tamer.hp <= 0 ||
      cur.tamer.ds <= 0;
    if (!needsVitalHeal) return;
    const healed: AccountHudPersistence = {
      ...cur,
      tamer: {
        ...cur.tamer,
        hp: Math.max(1, cur.tamer.maxHp),
        ds: Math.max(1, cur.tamer.maxDs),
      },
      digimon: {
        ...cur.digimon,
        hp: Math.max(1, cur.digimon.maxHp),
        ds: Math.max(1, cur.digimon.maxDs),
      },
      updatedAt: new Date().toISOString(),
    };
    hudAccountRef.current = healed;
    setHudAccount(healed);
    saveAccountHudState(healed, true, { skipCloudSync: true });
  }, [selection.accountUsername]);

  const activeFormProfile = useMemo(
    () =>
      resolveActiveFormProfile(
        starterDigimon.digimonId,
        hudAccount.digimon.activeFormId
      ),
    [starterDigimon.digimonId, hudAccount.digimon.activeFormId]
  );
  const activeStarterId: StarterDigimonId = resolveStarterIdForForm(
    starterDigimon.digimonId,
    activeFormProfile.id
  );
  const activeFormRef = useRef<DigimonFormProfile>(activeFormProfile);
  activeFormRef.current = activeFormProfile;
  const activeStarterIdRef = useRef<StarterDigimonId>(activeStarterId);
  activeStarterIdRef.current = activeStarterId;

  const runtimeMetaRef = useRef({
    characterId: selection.characterId,
    tamerName: selection.tamerName,
    starterDigimonId: activeStarterId,
    accentHex: character.theme.accentHex,
    graphicsQuality: preferences.graphicsQuality,
    animationsEnabled: preferences.animationsEnabled,
    showFloatingDamage: preferences.showFloatingDamage,
    showPlayerNames: preferences.showPlayerNames,
    showChatBubbles: preferences.showChatBubbles,
    showOffscreenPointers: preferences.showOffscreenPointers,
  });
  runtimeMetaRef.current = {
    characterId: selection.characterId,
    tamerName: selection.tamerName,
    starterDigimonId: activeStarterId,
    accentHex: character.theme.accentHex,
    graphicsQuality: preferences.graphicsQuality,
    animationsEnabled: preferences.animationsEnabled,
    showFloatingDamage: preferences.showFloatingDamage,
    showPlayerNames: preferences.showPlayerNames,
    showChatBubbles: preferences.showChatBubbles,
    showOffscreenPointers: preferences.showOffscreenPointers,
  };

  const evoStatus = useMemo(
    () => getNextEvolutionInfo(activeStarterId, hudAccount.digimon),
    [activeStarterId, hudAccount.digimon]
  );

  // HUD Overlay & Drawer States
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [activeHudWindow, setActiveHudWindow] = useState<HudWindowId>(null);
  const [activeStationModal, setActiveStationModal] =
    useState<DatsInteractionPoint | null>(null);
  const [activeNpcDialogue, setActiveNpcDialogue] =
    useState<FixedWorldNpc | null>(null);
  const [mudfrigimonShopOpen, setMudfrigimonShopOpen] = useState(false);
  const [playerMarketOpen, setPlayerMarketOpen] = useState(false);
  const [marketGlobalListings, setMarketGlobalListings] = useState<
    PlayerMarketListingRecord[]
  >([]);
  const [marketSellerListings, setMarketSellerListings] = useState<
    PlayerMarketListingRecord[]
  >([]);
  const marketPayoutNoticeShownRef = useRef(false);
  const marketActorUid =
    auth.currentUser?.uid ??
    `local_${(selection.accountUsername || 'guest').trim().toLowerCase()}`;
  const [hatchShowcase, setHatchShowcase] = useState<HatchShowcaseData | null>(
    null
  );
  const isEvolvingRef = useRef(false);
  const [evolutionUnlockAlert, setEvolutionUnlockAlert] =
    useState<DigimonFormProfile | null>(null);
  const [evoluterUnlockFormId, setEvoluterUnlockFormId] =
    useState<DigimonFormId | null>(null);
  const [beginnerTutorialOpen, setBeginnerTutorialOpen] = useState(false);
  const [beginnerTutorialGmPreview, setBeginnerTutorialGmPreview] =
    useState(false);
  const tutorialAutoTriggeredRef = useRef(false);
  const tutorialStorageKey = `dmo_richard_tutorial_done_v1:${(
    selection.accountUsername || 'guest'
  )
    .trim()
    .toLowerCase()}`;
  const tutorialRewardsStorageKey = `dmo_richard_tutorial_rewards_v2:${(
    selection.accountUsername || 'guest'
  )
    .trim()
    .toLowerCase()}`;
  const [tutorialRewardsClaimed, setTutorialRewardsClaimed] = useState<{
    supplies: boolean;
    eggPack: boolean;
  }>(() => {
    const fromHud = initialHudAccount.tutorialRewardsClaimed;
    let fromStorage = { supplies: false, eggPack: false };
    try {
      const raw = window.localStorage.getItem(tutorialRewardsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          supplies: boolean;
          eggPack: boolean;
        }>;
        fromStorage = {
          supplies: parsed.supplies === true,
          eggPack: parsed.eggPack === true,
        };
      }
    } catch {
      // Ignore storage access errors
    }
    return {
      supplies: fromHud?.supplies === true || fromStorage.supplies,
      eggPack: fromHud?.eggPack === true || fromStorage.eggPack,
    };
  });
  const tutorialRewardsClaimedRef = useRef(tutorialRewardsClaimed);
  tutorialRewardsClaimedRef.current = tutorialRewardsClaimed;

  useEffect(() => {
    return () => {
      flushPendingLocalHudSave();
      void flushPendingCloudSaves();
    };
  }, []);
  const [hoveredNpcId, setHoveredNpcId] = useState<string | null>(null);
  const hoveredNpcIdRef = useRef<string | null>(null);
  const pendingIncubatorWalkRef = useRef(false);
  const pendingArchiveWalkRef = useRef(false);
  const pendingPortalWalkRef = useRef(false);
  const pendingConductorWalkRef = useRef(false);
  const pendingTargetPortalRef = useRef<MapPortalLink | null>(null);
  const nearbyPortalRef = useRef<MapPortalLink | null>(null);
  const [pendingPortalConfirm, setPendingPortalConfirm] =
    useState<MapPortalLink | null>(null);
  const pendingPortalConfirmRef = useRef<MapPortalLink | null>(null);
  pendingPortalConfirmRef.current = pendingPortalConfirm;
  const pendingDatsPointIdRef = useRef<string | null>(null);
  const activeHudWindowRef = useRef<HudWindowId>(null);
  activeHudWindowRef.current = activeHudWindow;
  const overlayLayerRef = useRef({
    mudShop: false,
    npc: false,
    station: false,
    portalConfirm: false,
    hud: false,
    inventory: false,
  });
  overlayLayerRef.current = {
    mudShop: mudfrigimonShopOpen || playerMarketOpen,
    npc: activeNpcDialogue !== null,
    station: activeStationModal !== null,
    portalConfirm: pendingPortalConfirm !== null,
    hud:
      activeHudWindow !== null ||
      hatchShowcase !== null ||
      evoluterUnlockFormId !== null ||
      beginnerTutorialOpen,
    inventory: inventoryOpen,
  };

  // Real-time Player Market subscription when Miki's Market modal is open
  useEffect(() => {
    if (!playerMarketOpen) return;
    return subscribeGlobalPlayerMarket((rows) => {
      setMarketGlobalListings(rows);
    });
  }, [playerMarketOpen]);

  // Always track seller's own listings so unclaimed Bits from offline/live sales notify the player
  useEffect(() => {
    return subscribeSellerMarketListings(marketActorUid, (rows) => {
      setMarketSellerListings(rows);
      const unclaimed = rows.filter(
        (l) => l.status === 'sold' && !l.payoutClaimed
      );
      if (unclaimed.length > 0 && !marketPayoutNoticeShownRef.current) {
        marketPayoutNoticeShownRef.current = true;
        const totalBits = unclaimed.reduce((sum, l) => sum + l.priceBits, 0);
        pushChatMessage(
          'system',
          `[Mercado] Você vendeu ${unclaimed.length} ${
            unclaimed.length === 1 ? 'item' : 'itens'
          }! Fale com a Miki no DATS Center para resgatar ${formatDigitalCurrency(
            totalBits
          )}.`,
          { tone: 'loot' }
        );
      }
    });
  }, [marketActorUid]);

  // Auto-open Richard Sampson's Beginner Tutorial once for brand-new Lv.1 players arriving in DATS
  useEffect(() => {
    if (!assetsReady || tutorialAutoTriggeredRef.current) return;
    if (initialSpawn.mapId !== DATS_MAP_ID) return;
    const acc = hudAccountRef.current;
    const isBrandNewBeginner =
      acc.defeatedEnemiesTotal === 0 &&
      acc.tamer.level <= 1 &&
      acc.digimon.level <= 1;
    if (!isBrandNewBeginner) {
      tutorialAutoTriggeredRef.current = true;
      return;
    }
    try {
      if (window.localStorage.getItem(tutorialStorageKey) === '1') {
        tutorialAutoTriggeredRef.current = true;
        return;
      }
    } catch {
      // Ignore storage access errors
    }
    tutorialAutoTriggeredRef.current = true;
    const timer = window.setTimeout(() => {
      setBeginnerTutorialGmPreview(false);
      setBeginnerTutorialOpen(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [assetsReady, initialSpawn.mapId, tutorialStorageKey]);
  const [levelUpPulse, setLevelUpPulse] = useState(false);
  const [digimonLevelUpPulse, setDigimonLevelUpPulse] = useState(false);

  // Chat & Notifications State (No fake players!)
  const [chatChannel, setChatChannel] = useState<ChatChannel>('global');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<HudNotificationItem[]>([]);

  // Server-wide EXP Rate (100% normal -> 150% / 200% / 250% GM boost) & DMO Guild System
  const actorUid = getCurrentActorUid(selection.accountUsername);
  const [serverExpRatePct, setServerExpRatePct] = useState<ServerExpRatePct>(100);
  const serverExpRateRef = useRef<ServerExpRatePct>(100);
  const lastObservedExpRateRef = useRef<ServerExpRatePct | null>(null);
  const [serverAnnouncement, setServerAnnouncement] =
    useState<ServerAnnouncementState | null>(null);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<
    string | null
  >(null);
  const lastSeenAnnouncementIdRef = useRef<string | null>(null);
  const [activeBanNotice, setActiveBanNotice] = useState<string | null>(null);
  const banLogoutTriggeredRef = useRef<boolean>(false);
  const lastCloudMoneyRef = useRef<{ bits: number; dCoin: number } | null>(null);
  const lastCloudLevelsRef = useRef<{ tamerLevel: number; digimonLevel: number } | null>(null);
  const rankingBackupCheckedRef = useRef<boolean>(false);
  const lastLocalMoneyMutationAtRef = useRef<number>(0);
  const [playerGuild, setPlayerGuild] = useState<GuildRecord | null>(null);
  const playerGuildRef = useRef<GuildRecord | null>(null);
  const [guildDailyEventXpPct, setGuildDailyEventXpPct] = useState<number>(0);
  const guildDailyEventXpRef = useRef<number>(0);
  const seenGuildChatIdsRef = useRef<Set<string>>(new Set());
  const guildChatInitializedRef = useRef<boolean>(false);

  // DMO 4-Player Multiplayer Party State (Leader + up to 3 teammates)
  const [playerParty, setPlayerParty] = useState<PartyRecord | null>(null);
  const playerPartyRef = useRef<PartyRecord | null>(null);
  const partyJoinedAtMsRef = useRef<number>(Date.now());
  const [incomingPartyInvites, setIncomingPartyInvites] = useState<
    PartyInviteRecord[]
  >([]);
  const knownPartyInviteIdsRef = useRef<Set<string>>(new Set());
  const [incomingGuildInvites, setIncomingGuildInvites] = useState<
    GuildInviteRecord[]
  >([]);
  const knownGuildInviteIdsRef = useRef<Set<string>>(new Set());

  // Auto-Hunt & Auto HP/DS Recovery Configuration (persisted per account in localStorage)
  const autoHuntStorageKey =
    selection.accountUsername || actorUid || 'tamer_default';
  const [autoHuntConfig, setAutoHuntConfig] = useState<AutoHuntConfig>(() =>
    loadAutoHuntConfig(autoHuntStorageKey)
  );
  const autoHuntConfigRef = useRef<AutoHuntConfig>(autoHuntConfig);
  const autoPotionCooldownRef = useRef<{ hp: number; ds: number }>({
    hp: 0,
    ds: 0,
  });
  const lastRankingSyncRef = useRef<{ sig: string; atMs: number }>({
    sig: '',
    atMs: 0,
  });

  useEffect(() => {
    const loaded = loadAutoHuntConfig(autoHuntStorageKey);
    const hasVip = isAutoFarmVipActive(hudAccountRef.current, isGM);
    const safeLoaded = !hasVip && loaded.enabled ? { ...loaded, enabled: false } : loaded;
    autoHuntConfigRef.current = safeLoaded;
    setAutoHuntConfig(safeLoaded);
    if (safeLoaded !== loaded) {
      saveAutoHuntConfig(autoHuntStorageKey, safeLoaded);
    }
  }, [autoHuntStorageKey, isGM]);

  // Legacy migration: accounts that unlocked VIP before 30-day expiration receive a fresh 30-day window
  useEffect(() => {
    if (isGM) return;
    if (
      hudAccount.autoFarmVipUnlocked === true &&
      (hudAccount.autoFarmVipUntilMs == null || hudAccount.autoFarmVipUntilMs <= 0)
    ) {
      const migratedUntilMs = Date.now() + AUTO_FARM_VIP_DURATION_MS;
      const migrated: AccountHudPersistence = {
        ...hudAccountRef.current,
        autoFarmVipUntilMs: migratedUntilMs,
        updatedAt: new Date().toISOString(),
      };
      hudAccountRef.current = migrated;
      setHudAccount(migrated);
      saveAccountHudState(migrated, true);
    }
  }, [hudAccount.autoFarmVipUnlocked, hudAccount.autoFarmVipUntilMs, isGM]);

  useEffect(() => {
    const hasVip = isAutoFarmVipActive(hudAccount, isGM);
    if (!hasVip && autoHuntConfigRef.current.enabled) {
      const disabledCfg: AutoHuntConfig = { ...autoHuntConfigRef.current, enabled: false };
      autoHuntConfigRef.current = disabledCfg;
      setAutoHuntConfig(disabledCfg);
      saveAutoHuntConfig(autoHuntStorageKey, disabledCfg);
    }
  }, [hudAccount.autoFarmVipUnlocked, hudAccount.autoFarmVipUntilMs, isGM, autoHuntStorageKey]);

  // Live 30-day expiry watcher: pauses Auto Farm automatically when 30 days end mid-session
  useEffect(() => {
    if (isGM) return;
    const untilMs = hudAccount.autoFarmVipUntilMs;
    if (typeof untilMs !== 'number' || untilMs <= 0) return;

    const checkExpiry = () => {
      if (Date.now() < untilMs) return;
      if (autoHuntConfigRef.current.enabled) {
        const disabledCfg: AutoHuntConfig = {
          ...autoHuntConfigRef.current,
          enabled: false,
        };
        autoHuntConfigRef.current = disabledCfg;
        setAutoHuntConfig(disabledCfg);
        saveAutoHuntConfig(autoHuntStorageKey, disabledCfg);
        pushNotification(
          'VIP Auto Farm Expirado',
          `Seu acesso de ${AUTO_FARM_VIP_DURATION_DAYS} dias chegou ao fim. Renove por ${AUTO_FARM_VIP_COST_DWCOIN} DL Din na aba Auto para continuar usando.`
        );
        pushChatMessage(
          'system',
          `[VIP AUTO FARM] Seu plano de ${AUTO_FARM_VIP_DURATION_DAYS} dias expirou. Renove por ${AUTO_FARM_VIP_COST_DWCOIN} DL Din para reativar.`,
          { tone: 'warning' }
        );
      }
      setHudAccount((prev) => ({ ...prev }));
    };

    if (Date.now() >= untilMs) {
      checkExpiry();
      return;
    }

    const timer = window.setInterval(checkExpiry, 30000);
    return () => window.clearInterval(timer);
  }, [hudAccount.autoFarmVipUntilMs, isGM, autoHuntStorageKey]);

  const handleUpdateAutoHuntConfig = useCallback(
    (next: AutoHuntConfig) => {
      const hasVip = isAutoFarmVipActive(hudAccountRef.current, isGM);
      const gatedNext = !hasVip && next.enabled ? { ...next, enabled: false } : next;
      autoHuntConfigRef.current = gatedNext;
      setAutoHuntConfig(gatedNext);
      saveAutoHuntConfig(autoHuntStorageKey, gatedNext);
    },
    [autoHuntStorageKey, isGM]
  );

  const [activeChannelId, setActiveChannelId] = useState<WorldChannelId>(() => {
    try {
      const saved = localStorage.getItem('dw_active_channel_v1');
      if (saved) return safeChannelId(Number(saved));
    } catch {
      // Ignore storage error
    }
    return 1;
  });
  const currentChannelRef = useRef<WorldChannelId>(activeChannelId);
  useEffect(() => {
    currentChannelRef.current = activeChannelId;
  }, [activeChannelId]);
  const [channelSwitching, setChannelSwitching] = useState(false);
  const lastChannelSwitchMsRef = useRef<number>(0);

  const quickSlotsStorageKey = `dw_manual_quickslots_v1_${autoHuntStorageKey}`;
  const [quickSlots, setQuickSlots] = useState<{
    foodItemKey: string | null;
    vitaminItemKey: string | null;
  }>(() => {
    try {
      const raw = localStorage.getItem(quickSlotsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          foodItemKey?: unknown;
          vitaminItemKey?: unknown;
        };
        return {
          foodItemKey:
            typeof parsed.foodItemKey === 'string' && parsed.foodItemKey.trim()
              ? parsed.foodItemKey.trim()
              : null,
          vitaminItemKey:
            typeof parsed.vitaminItemKey === 'string' &&
            parsed.vitaminItemKey.trim()
              ? parsed.vitaminItemKey.trim()
              : null,
        };
      }
    } catch {
      // Ignore malformed storage
    }
    return { foodItemKey: null, vitaminItemKey: null };
  });
  const quickSlotsRef = useRef(quickSlots);
  quickSlotsRef.current = quickSlots;
  const lastQuickSlotUseMsRef = useRef<number>(0);
  const handleUseQuickSlotRef = useRef<(slot: 'food' | 'vitamin') => void>(
    () => {}
  );

  const [remotePlayers, setRemotePlayers] = useState<RemoteWorldPlayer[]>([]);
  const [selectedRemotePlayer, setSelectedRemotePlayer] =
    useState<RemoteWorldPlayer | null>(null);
  const [worldBossState, setWorldBossState] = useState<WorldBossLiveState | null>(
    null
  );
  const [bossNowMs, setBossNowMs] = useState<number>(() => Date.now());
  const [bossAnnouncement, setBossAnnouncement] =
    useState<WorldBossAnnouncement | null>(null);
  const [bossRankingDismissed, setBossRankingDismissed] = useState(false);
  const worldBossRef = useRef<WorldBossLiveState | null>(null);
  const bossParticipatedRef = useRef<boolean>(false);
  const lastBossDefeatCountRef = useRef<number>(-1);
  const bossBannerTimerRef = useRef<number | null>(null);
  const remoteSmoothRef = useRef<Map<string, SmoothedRemotePlayer>>(new Map());
  const preloadedRemoteAssetsRef = useRef<Set<string>>(new Set());
  const lastRemoteRosterSigRef = useRef<string>('');
  const localBubbleRef = useRef<{ text: string; expiresAt: number } | null>(null);
  const seenRemoteChatSeqRef = useRef<Map<string, number>>(new Map());
  const seenRemoteCombatSeqRef = useRef<Map<string, number>>(new Map());
  const knownOnlineUidsRef = useRef<Set<string>>(new Set());
  const initialPresenceLoadedRef = useRef(false);
  const lastPresenceSyncRef = useRef<{
    x: number;
    y: number;
    partnerX: number;
    partnerY: number;
    partnerMoving: boolean;
    dir: CardinalDirection;
    state: TamerMovementState;
    mapId: ActiveWorldMapId;
    channelId: WorldChannelId;
    formId: DigimonFormId;
    tamerLevel: number;
    digimonLevel: number;
    sentAtMs: number;
    inFlight: boolean;
  }>({
    x: -9999,
    y: -9999,
    partnerX: -9999,
    partnerY: -9999,
    partnerMoving: false,
    dir: 'S',
    state: 'idle',
    mapId: initialSpawn.mapId,
    channelId: activeChannelId,
    formId: activeFormProfile.id,
    tamerLevel: initialHudAccount.tamer.level,
    digimonLevel: initialHudAccount.digimon.level,
    sentAtMs: 0,
    inFlight: false,
  });

  const pushChatMessage = useCallback(
    (
      channel: ChatChannel,
      text: string,
      opts?: {
        sender?: string;
        isGmSender?: boolean;
        mapTag?: string;
        tone?: ChatMessage['tone'];
      }
    ) => {
      setChatMessages((prev) => {
        const next = [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            channel,
            sender: opts?.sender,
            isGmSender: opts?.isGmSender,
            mapTag: opts?.mapTag,
            text,
            timestamp: nowTimeStamp(),
            tone: opts?.tone,
          },
        ];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    },
    []
  );

  const [dropToasts, setDropToasts] = useState<DropToastItem[]>([]);
  const [eggCollectedPulse, setEggCollectedPulse] = useState(false);
  const eggPulseTimerRef = useRef<number | null>(null);
  const [eggDropAlert, setEggDropAlert] = useState<DigiEggDropAlertItem | null>(
    null
  );
  const eggDropAlertTimerRef = useRef<number | null>(null);

  const triggerDigiEggDropAlert = useCallback(
    (payload: Omit<DigiEggDropAlertItem, 'id'>) => {
      setEggDropAlert({
        ...payload,
        id: `egg-alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
      if (eggDropAlertTimerRef.current !== null) {
        window.clearTimeout(eggDropAlertTimerRef.current);
      }
      eggDropAlertTimerRef.current = window.setTimeout(() => {
        setEggDropAlert(null);
        eggDropAlertTimerRef.current = null;
      }, 4800);
    },
    []
  );

  const triggerEggCollectedDockPulse = useCallback(() => {
    setEggCollectedPulse(true);
    playDigiEggCollectPing(soundEnabledRef.current);
    if (eggPulseTimerRef.current !== null) {
      window.clearTimeout(eggPulseTimerRef.current);
    }
    eggPulseTimerRef.current = window.setTimeout(() => {
      setEggCollectedPulse(false);
      eggPulseTimerRef.current = null;
    }, 850);
  }, []);

  const spawnDigiEggDropAnimations = useCallback(
    (
      rewards: readonly RolledDropReward[],
      worldX: number,
      worldY: number,
      options?: {
        sourceName?: string;
        isBoss?: boolean;
        inventoryWasFull?: boolean;
      }
    ) => {
      const eggDrops = rewards.filter((r) => r.category === 'digiegg');
      if (eggDrops.length === 0) return;

      const sim = simRef.current;
      eggDrops.forEach((reward, idx) => {
        const catalogDef = getCatalogItemByKey(reward.itemKey);
        const iconUrl =
          reward.iconUrl ??
          reward.payload.iconUrl ??
          catalogDef?.iconUrl ??
          '/assets/items/digieggs/egg_agumon_classic.png';
        const accentColor =
          reward.payload.eggData?.accentColor ??
          catalogDef?.accentColor ??
          '#facc15';
        preloadDigiEggDropIcon(iconUrl);

        const spreadOffset = (idx - (eggDrops.length - 1) / 2) * 44;
        sim.eggDropFx.push({
          id: sim.nextFxId++,
          worldX: worldX + spreadOffset,
          worldY,
          iconUrl,
          name: reward.name,
          accentColor,
          rarity: reward.rarity,
          elapsed: 0,
          duration: 2.65,
          collectedNotified: false,
        });

        if (idx === 0) {
          triggerDigiEggDropAlert({
            itemKey: reward.itemKey,
            name: reward.name,
            iconUrl,
            rarity: reward.rarity,
            accentColor,
            sourceName: options?.sourceName ?? 'Digimon Selvagem',
            isBoss: options?.isBoss,
            inventoryWasFull: options?.inventoryWasFull,
          });
        }
      });

      playDigiEggDropSound(soundEnabledRef.current);
    },
    [triggerDigiEggDropAlert]
  );

  const pushDropRewardToasts = useCallback(
    (rewards: readonly RolledDropReward[], sourceName?: string) => {
      if (rewards.length === 0) return;
      const created: DropToastItem[] = rewards.map((r, idx) => ({
        id: `drop-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        itemKey: r.itemKey,
        name: r.name,
        quantity: r.quantity,
        iconUrl: r.iconUrl,
        rarity: r.rarity,
        sourceName,
      }));
      setDropToasts((prev) => [...created, ...prev].slice(0, 4));
      const ids = new Set(created.map((c) => c.id));
      window.setTimeout(() => {
        setDropToasts((prev) => prev.filter((item) => !ids.has(item.id)));
      }, 4200);
    },
    []
  );

  const pushNotification = useCallback((title: string, detail: string) => {
    setNotifications((prev) => {
      const next: HudNotificationItem[] = [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          detail,
          timestamp: nowTimeStamp(),
          read: false,
        },
        ...prev,
      ];
      return next.slice(0, 20);
    });
  }, []);

  const handleUnlockAutoFarmVip = useCallback((): { ok: boolean; message: string } => {
    const cur = hudAccountRef.current;
    const nowMs = Date.now();
    if (isAutoFarmVipActive(cur, isGM, nowMs)) {
      const enabledCfg: AutoHuntConfig = { ...autoHuntConfigRef.current, enabled: true };
      autoHuntConfigRef.current = enabledCfg;
      setAutoHuntConfig(enabledCfg);
      saveAutoHuntConfig(autoHuntStorageKey, enabledCfg);
      return {
        ok: true,
        message: `VIP Auto Farm ativado! Bônus de +${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP ativo enquanto o Auto Farm estiver ligado.`,
      };
    }

    if (cur.dCoin < AUTO_FARM_VIP_COST_DWCOIN) {
      return {
        ok: false,
        message: `Saldo insuficiente! Você precisa de ${AUTO_FARM_VIP_COST_DWCOIN} DL Din para ativar o VIP Auto Farm por ${AUTO_FARM_VIP_DURATION_DAYS} dias.`,
      };
    }

    const nextDCoin = cur.dCoin - AUTO_FARM_VIP_COST_DWCOIN;
    const nextVipUntilMs =
      Math.max(nowMs, cur.autoFarmVipUntilMs ?? 0) + AUTO_FARM_VIP_DURATION_MS;
    const expiryDateStr = formatAutoFarmVipExpiryDate(nextVipUntilMs);
    const nextAcc: AccountHudPersistence = {
      ...cur,
      dCoin: nextDCoin,
      autoFarmVipUnlocked: true,
      autoFarmVipUntilMs: nextVipUntilMs,
      updatedAt: new Date().toISOString(),
    };
    commitHudAccount(nextAcc, true);

    void recordDwCoinSpendTransaction({
      username: selection.accountUsername || actorUid,
      tamerName: selection.tamerName,
      itemKey: 'vip_auto_farm_30d',
      itemName: `VIP Auto Farm ${AUTO_FARM_VIP_DURATION_DAYS}D (+${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP)`,
      category: 'vip',
      dwCoinAmount: AUTO_FARM_VIP_COST_DWCOIN,
      balanceAfter: nextDCoin,
    });

    const enabledCfg: AutoHuntConfig = { ...autoHuntConfigRef.current, enabled: true };
    autoHuntConfigRef.current = enabledCfg;
    setAutoHuntConfig(enabledCfg);
    saveAutoHuntConfig(autoHuntStorageKey, enabledCfg);

    pushNotification(
      `VIP Auto Farm Ativado (${AUTO_FARM_VIP_DURATION_DAYS}D)!`,
      `Auto Farm liberado por ${AUTO_FARM_VIP_DURATION_DAYS} dias${expiryDateStr ? ` (até ${expiryDateStr})` : ''} por ${AUTO_FARM_VIP_COST_DWCOIN} DL Din! +${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP ativo enquanto ligado.`
    );
    pushChatMessage(
      'system',
      `[VIP AUTO FARM] Ativado por ${AUTO_FARM_VIP_DURATION_DAYS} dias (${AUTO_FARM_VIP_COST_DWCOIN} DL Din${expiryDateStr ? ` · até ${expiryDateStr}` : ''})! +${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP ativo enquanto ligado.`,
      { tone: 'loot' }
    );

    return {
      ok: true,
      message: `VIP Auto Farm ativado por ${AUTO_FARM_VIP_DURATION_DAYS} dias${expiryDateStr ? ` (válido até ${expiryDateStr})` : ''}! +${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP ativo enquanto ligado.`,
    };
  }, [
    actorUid,
    autoHuntStorageKey,
    isGM,
    pushChatMessage,
    pushNotification,
    selection.accountUsername,
    selection.tamerName,
  ]);

  // Subscribe to Server-wide EXP Rate (100% / 150% / 200% / 250%)
  useEffect(() => {
    const unsub = subscribeServerExpRate((state) => {
      serverExpRateRef.current = state.expRatePct;
      setServerExpRatePct(state.expRatePct);

      if (
        lastObservedExpRateRef.current !== null &&
        lastObservedExpRateRef.current !== state.expRatePct
      ) {
        pushNotification(
          state.expRatePct > 100
            ? `Evento ${state.expRatePct}% EXP Ativo!`
            : 'EXP do Servidor Normalizado',
          state.expRatePct > 100
            ? `${state.updatedBy} ativou ${state.expRatePct}% EXP em todo o servidor!`
            : `A taxa de EXP do servidor voltou para 100% (normal).`
        );
      }
      lastObservedExpRateRef.current = state.expRatePct;
    });
    return unsub;
  }, [pushNotification]);

  // Subscribe to Global Server Announcements & Maintenance Banner (/serverConfig/announcement)
  useEffect(() => {
    const unsub = subscribeServerAnnouncement((next) => {
      setServerAnnouncement(next);
      const nextId = next?.active ? next.announcementId : null;
      if (nextId && nextId !== lastSeenAnnouncementIdRef.current) {
        setDismissedAnnouncementId(null);
        if (lastSeenAnnouncementIdRef.current !== null && next) {
          pushNotification(next.title, next.message);
          pushChatMessage(
            'system',
            `[AVISO · ${next.updatedBy}] ${next.title}: ${next.message}`,
            { tone: 'level' }
          );
        }
      }
      lastSeenAnnouncementIdRef.current = nextId;
    });
    return unsub;
  }, [pushChatMessage, pushNotification]);

  // Real-time Ban Enforcement for active player sessions (non-GM)
  useEffect(() => {
    if (isServerGm || !actorUid) return;
    banLogoutTriggeredRef.current = false;
    let logoutTimer: number | null = null;
    const unsub = subscribeMyBanStatus(actorUid, (_record, message) => {
      if (banLogoutTriggeredRef.current) return;
      banLogoutTriggeredRef.current = true;
      setActiveBanNotice(message);
      saveAccountHudState(hudAccountRef.current, true);
      void markLocalWorldPresenceOffline();
      logoutTimer = window.setTimeout(() => {
        onExitToLogin();
      }, 3200);
    });
    return () => {
      unsub();
      if (logoutTimer !== null) {
        window.clearTimeout(logoutTimer);
      }
    };
  }, [actorUid, isServerGm, onExitToLogin]);

  // Live Sync for external DL-DIN / GM Balance / GM Level Restoration & Cloud Progression Recovery on /players/{actorUid}
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified || user.uid !== actorUid) return;
    lastCloudMoneyRef.current = null;
    lastCloudLevelsRef.current = null;
    const ref = doc(db, 'players', actorUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists() || snap.metadata.hasPendingWrites) return;
        const data = snap.data() as Record<string, unknown>;
        const cloudHud = (data?.hudState ?? null) as Record<string, unknown> | null;
        if (!cloudHud) return;

        // Always update high-water cloud progression cache so no subsequent local save can downgrade this account
        recordObservedCloudHudProgress(actorUid, cloudHud, selection.accountUsername);

        const cloudBits =
          typeof cloudHud.bits === 'number' && Number.isFinite(cloudHud.bits)
            ? Math.max(0, Math.round(cloudHud.bits))
            : null;
        const cloudDCoin =
          typeof cloudHud.dCoin === 'number' && Number.isFinite(cloudHud.dCoin)
            ? Math.max(0, Math.round(cloudHud.dCoin))
            : null;
        if (cloudBits === null || cloudDCoin === null) return;

        const cloudAutoFarmVip = cloudHud.autoFarmVipUnlocked === true;
        const cloudAutoFarmVipUntilMs =
          typeof cloudHud.autoFarmVipUntilMs === 'number' &&
          Number.isFinite(cloudHud.autoFarmVipUntilMs) &&
          cloudHud.autoFarmVipUntilMs > 0
            ? Math.round(cloudHud.autoFarmVipUntilMs)
            : null;

        // Live progression recovery & GM level update sync (Tamer Lv, Digimon Lv, active form, defeated enemies)
        const rawCloudTamer =
          cloudHud.tamer && typeof cloudHud.tamer === 'object'
            ? (cloudHud.tamer as Record<string, unknown>)
            : null;
        const rawCloudDigi =
          cloudHud.digimon && typeof cloudHud.digimon === 'object'
            ? (cloudHud.digimon as Record<string, unknown>)
            : null;
        const cloudTamerLevel = Math.max(
          1,
          Math.min(MAX_GAME_LEVEL, Math.floor(Number(rawCloudTamer?.level) || 1))
        );
        const cloudTamerExp = Math.max(0, Math.floor(Number(rawCloudTamer?.exp) || 0));
        const cloudDigiLevel = Math.max(
          1,
          Math.min(MAX_GAME_LEVEL, Math.floor(Number(rawCloudDigi?.level) || 1))
        );
        const cloudDigiExp = Math.max(0, Math.floor(Number(rawCloudDigi?.exp) || 0));
        const cloudDefeatedTotal = Math.max(
          0,
          Math.floor(Number(cloudHud.defeatedEnemiesTotal) || 0)
        );
        const prevLevels = lastCloudLevelsRef.current;
        lastCloudLevelsRef.current = {
          tamerLevel: cloudTamerLevel,
          digimonLevel: cloudDigiLevel,
        };

        const curBeforeLevels = hudAccountRef.current;
        const cloudHasHigherLevels =
          cloudTamerLevel > curBeforeLevels.tamer.level ||
          cloudDigiLevel > curBeforeLevels.digimon.level ||
          (curBeforeLevels.tamer.level <= 1 &&
            curBeforeLevels.digimon.level <= 1 &&
            curBeforeLevels.defeatedEnemiesTotal === 0 &&
            cloudDefeatedTotal > 0);
        const externalGmLevelAdjustment =
          prevLevels !== null &&
          (cloudTamerLevel !== prevLevels.tamerLevel ||
            cloudDigiLevel !== prevLevels.digimonLevel) &&
          (cloudTamerLevel !== curBeforeLevels.tamer.level ||
            cloudDigiLevel !== curBeforeLevels.digimon.level);

        if (cloudHasHigherLevels || externalGmLevelAdjustment) {
          const nextTamerLevel = externalGmLevelAdjustment
            ? cloudTamerLevel
            : Math.max(curBeforeLevels.tamer.level, cloudTamerLevel);
          const nextDigiLevel = externalGmLevelAdjustment
            ? cloudDigiLevel
            : Math.max(curBeforeLevels.digimon.level, cloudDigiLevel);

          const nextTamerExpToNext = calcTamerExpToNext(nextTamerLevel);
          const nextTamerBase = {
            ...curBeforeLevels.tamer,
            level: nextTamerLevel,
            expToNext: nextTamerExpToNext,
            exp: Math.min(nextTamerExpToNext - 1, cloudTamerExp),
          };
          const computedTamer = computeTamerAttributes(
            nextTamerBase,
            curBeforeLevels.equippedItems
          );
          const nextTamer = {
            ...nextTamerBase,
            maxHp: computedTamer.maxHp,
            hp: computedTamer.maxHp,
            maxDs: computedTamer.maxDs,
            ds: computedTamer.maxDs,
          };

          const qualityProfile = getHatchQualityProfile(
            typeof rawCloudDigi?.hatchGrade === 'number'
              ? rawCloudDigi.hatchGrade
              : curBeforeLevels.digimon.hatchGrade
          );
          const hatchSizePct = clampHatchSizePct(
            qualityProfile.grade,
            typeof rawCloudDigi?.hatchSizePct === 'number'
              ? rawCloudDigi.hatchSizePct
              : curBeforeLevels.digimon.hatchSizePct
          );
          const resolvedForm = resolveActiveFormProfile(
            starterDigimon.digimonId,
            typeof rawCloudDigi?.activeFormId === 'string'
              ? (rawCloudDigi.activeFormId as DigimonFormId)
              : curBeforeLevels.digimon.activeFormId
          );
          const resolvedStarterId = resolveStarterIdForForm(
            starterDigimon.digimonId,
            resolvedForm.id
          );
          const safeForm =
            nextDigiLevel >= resolvedForm.unlockLevel
              ? resolvedForm
              : getEvolutionChainForStarter(resolvedStarterId)[0];
          const nextUnlockedFormIds = sanitizeUnlockedFormIdsForDigimon(
            resolvedStarterId,
            nextDigiLevel,
            Array.isArray(rawCloudDigi?.unlockedFormIds)
              ? (rawCloudDigi.unlockedFormIds as string[])
              : curBeforeLevels.digimon.unlockedFormIds,
            safeForm.id
          );
          const nextDigiMaxHp = calcDigimonMaxHp(
            nextDigiLevel,
            safeForm.id,
            qualityProfile.grade,
            hatchSizePct
          );
          const nextDigiMaxDs = calcDigimonMaxDs(
            nextDigiLevel,
            safeForm.id,
            qualityProfile.grade,
            hatchSizePct
          );
          const nextDigiExpToNext = calcDigimonExpToNext(nextDigiLevel);
          const cloudNick =
            typeof rawCloudDigi?.nickname === 'string' && rawCloudDigi.nickname.trim()
              ? rawCloudDigi.nickname.trim().slice(0, 24)
              : curBeforeLevels.digimon.nickname;
          const nextDigimon = {
            ...curBeforeLevels.digimon,
            level: nextDigiLevel,
            expToNext: nextDigiExpToNext,
            exp: Math.min(nextDigiExpToNext - 1, cloudDigiExp),
            maxHp: nextDigiMaxHp,
            hp: nextDigiMaxHp,
            maxDs: nextDigiMaxDs,
            ds: nextDigiMaxDs,
            activeFormId: safeForm.id,
            unlockedFormIds: nextUnlockedFormIds,
            hatchGrade: qualityProfile.grade,
            hatchSizePct,
            ...(cloudNick ? { nickname: cloudNick } : {}),
          };

          const rawCloudTutorial =
            cloudHud.tutorialRewardsClaimed &&
            typeof cloudHud.tutorialRewardsClaimed === 'object'
              ? (cloudHud.tutorialRewardsClaimed as Record<string, unknown>)
              : null;
          const mergedTutorial = rawCloudTutorial
            ? {
                supplies:
                  tutorialRewardsClaimedRef.current.supplies ||
                  rawCloudTutorial.supplies === true,
                eggPack:
                  tutorialRewardsClaimedRef.current.eggPack ||
                  rawCloudTutorial.eggPack === true,
              }
            : tutorialRewardsClaimedRef.current;
          if (
            mergedTutorial.supplies !== tutorialRewardsClaimedRef.current.supplies ||
            mergedTutorial.eggPack !== tutorialRewardsClaimedRef.current.eggPack
          ) {
            persistTutorialRewardsState(mergedTutorial);
          }

          const syncedProgressState: AccountHudPersistence = {
            ...curBeforeLevels,
            tamer: nextTamer,
            digimon: nextDigimon,
            bits: Math.max(curBeforeLevels.bits, cloudBits),
            dCoin: Math.max(curBeforeLevels.dCoin, cloudDCoin),
            defeatedEnemiesTotal: Math.max(
              curBeforeLevels.defeatedEnemiesTotal,
              cloudDefeatedTotal
            ),
            autoFarmVipUnlocked:
              curBeforeLevels.autoFarmVipUnlocked === true || cloudAutoFarmVip,
            autoFarmVipUntilMs:
              Math.max(
                curBeforeLevels.autoFarmVipUntilMs ?? 0,
                cloudAutoFarmVipUntilMs ?? 0
              ) || null,
            tutorialRewardsClaimed: mergedTutorial,
            updatedAt: new Date().toISOString(),
          };
          hudAccountRef.current = syncedProgressState;
          setHudAccount(syncedProgressState);
          saveAccountHudState(syncedProgressState, true, { skipCloudSync: true });
          pushNotification(
            'Progresso Sincronizado',
            `Tamer Lv.${nextTamerLevel} · Digimon Lv.${nextDigiLevel} restaurados da nuvem!`
          );
          pushChatMessage(
            'system',
            `[Sistema] Progresso sincronizado com o servidor: Tamer Lv.${nextTamerLevel} · Digimon Lv.${nextDigiLevel} (HP e DS restaurados).`,
            { tone: 'loot' }
          );
        }

        const rawCloudTutorialSnap =
          cloudHud.tutorialRewardsClaimed &&
          typeof cloudHud.tutorialRewardsClaimed === 'object'
            ? (cloudHud.tutorialRewardsClaimed as Record<string, unknown>)
            : null;
        if (rawCloudTutorialSnap) {
          const nextTutorial = {
            supplies:
              tutorialRewardsClaimedRef.current.supplies ||
              rawCloudTutorialSnap.supplies === true,
            eggPack:
              tutorialRewardsClaimedRef.current.eggPack ||
              rawCloudTutorialSnap.eggPack === true,
          };
          if (
            nextTutorial.supplies !== tutorialRewardsClaimedRef.current.supplies ||
            nextTutorial.eggPack !== tutorialRewardsClaimedRef.current.eggPack
          ) {
            persistTutorialRewardsState(nextTutorial);
            const updatedHudTut: AccountHudPersistence = {
              ...hudAccountRef.current,
              tutorialRewardsClaimed: nextTutorial,
            };
            hudAccountRef.current = updatedHudTut;
            setHudAccount(updatedHudTut);
            saveAccountHudState(updatedHudTut, true, { skipCloudSync: true });
          }
        }

        const curVipUntilMs = hudAccountRef.current.autoFarmVipUntilMs ?? 0;
        if (
          (cloudAutoFarmVip && hudAccountRef.current.autoFarmVipUnlocked !== true) ||
          (cloudAutoFarmVipUntilMs != null && cloudAutoFarmVipUntilMs > curVipUntilMs)
        ) {
          const syncedVipState: AccountHudPersistence = {
            ...hudAccountRef.current,
            autoFarmVipUnlocked: hudAccountRef.current.autoFarmVipUnlocked === true || cloudAutoFarmVip,
            autoFarmVipUntilMs:
              Math.max(curVipUntilMs, cloudAutoFarmVipUntilMs ?? 0) || null,
            updatedAt: new Date().toISOString(),
          };
          hudAccountRef.current = syncedVipState;
          setHudAccount(syncedVipState);
          saveAccountHudState(syncedVipState, true, { skipCloudSync: true });
        }

        const prevObserved = lastCloudMoneyRef.current;
        lastCloudMoneyRef.current = { bits: cloudBits, dCoin: cloudDCoin };
        const cur = hudAccountRef.current;

        // First snapshot after load: if cloud already holds MORE DL-DIN (e.g. paid while reloading/offline), adopt immediately!
        if (!prevObserved) {
          if (cloudDCoin > cur.dCoin) {
            const added = cloudDCoin - cur.dCoin;
            const syncedState: AccountHudPersistence = {
              ...cur,
              dCoin: cloudDCoin,
              autoFarmVipUnlocked: cur.autoFarmVipUnlocked === true || cloudAutoFarmVip,
              autoFarmVipUntilMs:
                Math.max(cur.autoFarmVipUntilMs ?? 0, cloudAutoFarmVipUntilMs ?? 0) || null,
              updatedAt: new Date().toISOString(),
            };
            hudAccountRef.current = syncedState;
            setHudAccount(syncedState);
            saveAccountHudState(syncedState, true, { skipCloudSync: true });
            pushNotification(
              'DL Din Recebido!',
              `+${added.toLocaleString('pt-BR')} DL Din creditados na sua conta (saldo: ${cloudDCoin.toLocaleString('pt-BR')} DL Din).`
            );
            pushChatMessage(
              'system',
              `[DL Din] +${added.toLocaleString('pt-BR')} DL Din creditados na sua conta! Novo saldo: ${cloudDCoin.toLocaleString('pt-BR')} DL Din.`,
              { tone: 'loot' }
            );
          }
          return;
        }

        const cloudChanged =
          cloudBits !== prevObserved.bits || cloudDCoin !== prevObserved.dCoin;
        if (!cloudChanged) return;

        const differsFromLocal =
          cloudBits !== cur.bits || cloudDCoin !== cur.dCoin;
        const quietLocalWindow =
          Date.now() - lastLocalMoneyMutationAtRef.current > 3000;
        const externalDCoinIncrease = cloudDCoin > prevObserved.dCoin && cloudDCoin > cur.dCoin;
        const externalDCoinChange = cloudDCoin !== prevObserved.dCoin && cloudDCoin !== cur.dCoin;

        if (
          !differsFromLocal ||
          (!quietLocalWindow && !externalDCoinIncrease && !externalDCoinChange)
        ) {
          return;
        }

        const nextBits = quietLocalWindow ? cloudBits : cur.bits;
        const nextDCoin = externalDCoinIncrease || externalDCoinChange ? cloudDCoin : cur.dCoin;
        if (nextBits === cur.bits && nextDCoin === cur.dCoin) return;

        const dCoinDelta = nextDCoin - cur.dCoin;
        const nextState: AccountHudPersistence = {
          ...cur,
          bits: nextBits,
          dCoin: nextDCoin,
          autoFarmVipUnlocked: cur.autoFarmVipUnlocked === true || cloudAutoFarmVip,
          autoFarmVipUntilMs:
            Math.max(cur.autoFarmVipUntilMs ?? 0, cloudAutoFarmVipUntilMs ?? 0) || null,
          updatedAt: new Date().toISOString(),
        };
        hudAccountRef.current = nextState;
        setHudAccount(nextState);
        saveAccountHudState(nextState, true, { skipCloudSync: true });

        if (dCoinDelta > 0) {
          playDigitalTone('confirm', soundEnabled);
          pushNotification(
            'DL Din Creditado!',
            `+${dCoinDelta.toLocaleString('pt-BR')} DL Din adicionados! Novo saldo: ${nextDCoin.toLocaleString('pt-BR')} DL Din.`
          );
          pushChatMessage(
            'system',
            `[DL Din] +${dCoinDelta.toLocaleString('pt-BR')} DL Din creditados na sua conta! Novo saldo: ${nextDCoin.toLocaleString('pt-BR')} DL Din.`,
            { tone: 'loot' }
          );
        } else {
          pushNotification(
            'Saldo Atualizado',
            `Novo saldo: ${formatDigitalCurrency(nextBits)} · ${nextDCoin.toLocaleString('pt-BR')} DL Din.`
          );
          pushChatMessage(
            'system',
            `[Sistema] Seu saldo foi atualizado (${formatDigitalCurrency(nextBits)} · ${nextDCoin.toLocaleString('pt-BR')} DL Din).`,
            { tone: 'loot' }
          );
        }
      },
      () => {
        // Non-fatal listener guard
      }
    );
    return unsub;
  }, [
    actorUid,
    pushChatMessage,
    pushNotification,
    selection.accountUsername,
    soundEnabled,
    starterDigimon.digimonId,
  ]);

  // Automatic backup recovery: if /players/{actorUid} was previously overwritten to Lv.1 while
  // /playerRankings/{actorUid} still holds the player's progressed levels, automatically restore them!
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified || user.uid !== actorUid) {
      rankingBackupCheckedRef.current = true;
      return;
    }

    let cancelled = false;
    rankingBackupCheckedRef.current = false;

    void (async () => {
      try {
        const cur = hudAccountRef.current;
        if (
          cur.tamer.level > 1 ||
          cur.digimon.level > 1 ||
          cur.defeatedEnemiesTotal > 0
        ) {
          return;
        }
        const backup = await fetchOwnPlayerRankingBackup(actorUid);
        if (cancelled || !backup) return;

        const latest = hudAccountRef.current;
        const needsRestore =
          backup.tamerLevel > latest.tamer.level ||
          backup.digimonLevel > latest.digimon.level ||
          backup.defeatedEnemiesTotal > latest.defeatedEnemiesTotal;
        if (!needsRestore) return;

        const nextTamerLevel = Math.max(latest.tamer.level, backup.tamerLevel);
        const nextDigiLevel = Math.max(latest.digimon.level, backup.digimonLevel);
        const nextTamerExpToNext = calcTamerExpToNext(nextTamerLevel);
        const nextTamerBase = {
          ...latest.tamer,
          level: nextTamerLevel,
          expToNext: nextTamerExpToNext,
          exp: Math.min(nextTamerExpToNext - 1, backup.tamerExp),
        };
        const computedTamer = computeTamerAttributes(
          nextTamerBase,
          latest.equippedItems
        );
        const nextTamer = {
          ...nextTamerBase,
          maxHp: computedTamer.maxHp,
          hp: computedTamer.maxHp,
          maxDs: computedTamer.maxDs,
          ds: computedTamer.maxDs,
        };

        const qualityProfile = getHatchQualityProfile(latest.digimon.hatchGrade);
        const hatchSizePct = clampHatchSizePct(
          qualityProfile.grade,
          latest.digimon.hatchSizePct
        );
        const resolvedForm = resolveActiveFormProfile(
          starterDigimon.digimonId,
          backup.digimonFormId ?? latest.digimon.activeFormId
        );
        const resolvedStarterId = resolveStarterIdForForm(
          starterDigimon.digimonId,
          resolvedForm.id
        );
        const safeForm =
          nextDigiLevel >= resolvedForm.unlockLevel
            ? resolvedForm
            : getEvolutionChainForStarter(resolvedStarterId)[0];
        const nextUnlockedFormIds = sanitizeUnlockedFormIdsForDigimon(
          resolvedStarterId,
          nextDigiLevel,
          latest.digimon.unlockedFormIds,
          safeForm.id
        );
        const nextDigiMaxHp = calcDigimonMaxHp(
          nextDigiLevel,
          safeForm.id,
          qualityProfile.grade,
          hatchSizePct
        );
        const nextDigiMaxDs = calcDigimonMaxDs(
          nextDigiLevel,
          safeForm.id,
          qualityProfile.grade,
          hatchSizePct
        );
        const nextDigiExpToNext = calcDigimonExpToNext(nextDigiLevel);

        const recovered: AccountHudPersistence = {
          ...latest,
          tamer: nextTamer,
          digimon: {
            ...latest.digimon,
            level: nextDigiLevel,
            expToNext: nextDigiExpToNext,
            exp: Math.min(nextDigiExpToNext - 1, backup.digimonExp),
            maxHp: nextDigiMaxHp,
            hp: nextDigiMaxHp,
            maxDs: nextDigiMaxDs,
            ds: nextDigiMaxDs,
            activeFormId: safeForm.id,
            unlockedFormIds: nextUnlockedFormIds,
            hatchGrade: qualityProfile.grade,
            hatchSizePct,
          },
          defeatedEnemiesTotal: Math.max(
            latest.defeatedEnemiesTotal,
            backup.defeatedEnemiesTotal
          ),
          updatedAt: new Date().toISOString(),
        };

        commitHudAccount(recovered, true);
        pushNotification(
          'Níveis Recuperados!',
          `Seus níveis foram restaurados automaticamente (Tamer Lv.${nextTamerLevel} · Digimon Lv.${nextDigiLevel}).`
        );
        pushChatMessage(
          'system',
          `[Recuperação Automática] Níveis restaurados pelo backup do Ranking: Tamer Lv.${nextTamerLevel} · Digimon Lv.${nextDigiLevel}!`,
          { tone: 'loot' }
        );
      } finally {
        rankingBackupCheckedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorUid, pushChatMessage, pushNotification, starterDigimon.digimonId]);

  // Auto-reconcile pending Mercado Pago orders on login, Checkout Pro redirect (?order_id=...), or returning from mobile bank app
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified || user.uid !== actorUid) return;

    let cancelled = false;
    let lastCheckedAt = 0;

    const runReconcile = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckedAt < 10_000) return;
      lastCheckedAt = now;
      try {
        const summary = await reconcilePendingMercadoPagoOrders();
        if (cancelled) return;
        if (summary.creditedCount > 0 && summary.totalDwCoinCredited > 0) {
          // Ensure immediate local reflection even before Firestore snapshot arrives
          if (
            typeof summary.latestBalance === 'number' &&
            summary.latestBalance > hudAccountRef.current.dCoin
          ) {
            const cur = hudAccountRef.current;
            const nextState: AccountHudPersistence = {
              ...cur,
              dCoin: summary.latestBalance,
              updatedAt: new Date().toISOString(),
            };
            hudAccountRef.current = nextState;
            setHudAccount(nextState);
            saveAccountHudState(nextState, true, { skipCloudSync: true });
            lastCloudMoneyRef.current = {
              bits: nextState.bits,
              dCoin: summary.latestBalance,
            };
            playDigitalTone('confirm', soundEnabled);
            pushNotification(
              'Pagamento Confirmado!',
              `+${summary.totalDwCoinCredited.toLocaleString('pt-BR')} DL Din creditados automaticamente na sua conta!`
            );
            pushChatMessage(
              'system',
              `[Mercado Pago] Pagamento aprovado! +${summary.totalDwCoinCredited.toLocaleString('pt-BR')} DL Din creditados automaticamente na sua conta.`,
              { tone: 'loot' }
            );
          }
        }
      } catch {
        // Silent best-effort reconciliation
      }
    };

    void runReconcile(true);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runReconcile(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [actorUid, pushChatMessage, pushNotification, soundEnabled]);

  // Subscribe to Player's DMO Guild & live Guild Chat
  useEffect(() => {
    guildChatInitializedRef.current = false;
    seenGuildChatIdsRef.current.clear();

    const unsub = subscribePlayerGuild(actorUid, (nextGuild) => {
      playerGuildRef.current = nextGuild;
      setPlayerGuild(nextGuild);

      const expectedLabel = nextGuild ? `[${nextGuild.tag}] ${nextGuild.name}` : null;
      if (hudAccountRef.current.guildName !== expectedLabel) {
        commitHudAccount({
          ...hudAccountRef.current,
          guildName: expectedLabel,
          updatedAt: new Date().toISOString(),
        });
      }

      if (!nextGuild) {
        guildChatInitializedRef.current = false;
        seenGuildChatIdsRef.current.clear();
        guildDailyEventXpRef.current = 0;
        setGuildDailyEventXpPct(0);
        return;
      }

      void syncGuildRankingSnapshot(nextGuild);

      if (!guildChatInitializedRef.current) {
        guildChatInitializedRef.current = true;
        const recent = nextGuild.chatMessages.slice(-8);
        for (const msg of nextGuild.chatMessages) {
          seenGuildChatIdsRef.current.add(msg.id);
        }
        if (recent.length > 0) {
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const additions: ChatMessage[] = [];
            for (const gm of recent) {
              const cid = `guild-${gm.id}`;
              if (existingIds.has(cid)) continue;
              additions.push({
                id: cid,
                channel: 'guild',
                sender: gm.senderName,
                text: gm.text,
                timestamp: gm.timestamp,
              });
            }
            if (additions.length === 0) return prev;
            const merged = [...prev, ...additions];
            return merged.length > 60 ? merged.slice(merged.length - 60) : merged;
          });
        }
        return;
      }

      for (const gm of nextGuild.chatMessages) {
        if (seenGuildChatIdsRef.current.has(gm.id)) continue;
        seenGuildChatIdsRef.current.add(gm.id);
        setChatMessages((prev) => {
          const cid = `guild-${gm.id}`;
          if (prev.some((m) => m.id === cid)) return prev;
          const merged: ChatMessage[] = [
            ...prev,
            {
              id: cid,
              channel: 'guild',
              sender: gm.senderName,
              text: gm.text,
              timestamp: gm.timestamp,
            },
          ];
          return merged.length > 60 ? merged.slice(merged.length - 60) : merged;
        });
      }
    });

    return unsub;
  }, [actorUid]);

  // Compute active Daily Guild Mob Hunt Event XP Bonus (+10% Top 1 .. +6% Top 5, +5% 6º+)
  // Automatically refreshes at 00:00 Brasília time when the new day's winners unlock!
  useEffect(() => {
    if (!playerGuild) {
      guildDailyEventXpRef.current = 0;
      setGuildDailyEventXpPct(0);
      return;
    }

    let cancelled = false;
    let lastDayKey = getServerDayKey();

    const refreshDailyEventXp = async (announceMidnightRollover = false) => {
      const serverGuilds = await fetchRecruitingGuilds();
      if (cancelled) return;
      const summary = computeDailyGuildEventStandings(
        serverGuilds,
        playerGuildRef.current,
        new Date()
      );
      guildDailyEventXpRef.current = summary.myActiveXpBonusPct;
      setGuildDailyEventXpPct(summary.myActiveXpBonusPct);

      if (announceMidnightRollover && playerGuildRef.current) {
        const rankText = summary.myActiveWinnerRank
          ? `Top ${summary.myActiveWinnerRank}`
          : 'Participação';
        pushNotification(
          'Evento Diário da Guilda!',
          `Novo dia iniciado! ${playerGuildRef.current.name} (${rankText}) garantiu +${summary.myActiveXpBonusPct}% XP para todos os membros hoje!`
        );
      }
    };

    void refreshDailyEventXp(false);

    const intervalId = window.setInterval(() => {
      const currentDayKey = getServerDayKey();
      if (currentDayKey !== lastDayKey) {
        lastDayKey = currentDayKey;
        void refreshDailyEventXp(true);
      }
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [playerGuild?.guildId, pushNotification]);

  // Subscribe to Active Multiplayer Party & Incoming Invites
  useEffect(() => {
    const unsubParty = subscribeMyParty(actorUid, (nextParty) => {
      const prevPartyId = playerPartyRef.current?.partyId ?? null;
      const nextPartyId = nextParty?.partyId ?? null;
      if (nextPartyId && nextPartyId !== prevPartyId) {
        partyJoinedAtMsRef.current = Date.now();
      }
      playerPartyRef.current = nextParty;
      setPlayerParty(nextParty);
    });

    const unsubInvites = subscribeIncomingPartyInvites(actorUid, (invites) => {
      for (const inv of invites) {
        if (!knownPartyInviteIdsRef.current.has(inv.inviteId)) {
          knownPartyInviteIdsRef.current.add(inv.inviteId);
          playDigitalTone('confirm', soundEnabledRef.current);
          pushChatMessage(
            'system',
            `[Party] ${inv.fromName} (Nv.${inv.fromTamerLevel}) convidou você para a Party!`,
            { tone: 'info' }
          );
        }
      }
      setIncomingPartyInvites(invites);
    });

    const unsubGuildInvites = subscribeIncomingGuildInvites(
      actorUid,
      (invites) => {
        for (const inv of invites) {
          if (!knownGuildInviteIdsRef.current.has(inv.inviteId)) {
            knownGuildInviteIdsRef.current.add(inv.inviteId);
            playDigitalTone('confirm', soundEnabledRef.current);
            pushChatMessage(
              'system',
              `[Guilda] ${inv.fromName} convidou você para a Guilda [${inv.guildTag}] ${inv.guildName}!`,
              { tone: 'info' }
            );
          }
        }
        setIncomingGuildInvites(invites);
      }
    );

    const unsubGlobalChat = subscribeGlobalChat((msg) => {
      setChatMessages((prev) => {
        const cid = `global-${msg.messageId}`;
        if (prev.some((m) => m.id === cid)) return prev;
        const merged: ChatMessage[] = [
          ...prev,
          {
            id: cid,
            channel: 'global',
            sender: msg.senderName,
            isGmSender: msg.isGmSender,
            mapTag: getMapDisplayLabel(msg.mapId, true),
            text: msg.text,
            timestamp: msg.timestampLabel,
          },
        ];
        return merged.length > 90 ? merged.slice(merged.length - 90) : merged;
      });
    });

    return () => {
      unsubParty();
      unsubInvites();
      unsubGuildInvites();
      unsubGlobalChat();
    };
  }, [actorUid, pushChatMessage]);

  // Subscribe to Party Chat & Shared Map EXP Events while in a Party
  const activePartyId = playerParty?.partyId ?? null;
  useEffect(() => {
    if (!activePartyId) return;

    const unsubChat = subscribePartyChat(activePartyId, (msg) => {
      setChatMessages((prev) => {
        const cid = `party-${msg.messageId}`;
        if (prev.some((m) => m.id === cid)) return prev;
        const merged: ChatMessage[] = [
          ...prev,
          {
            id: cid,
            channel: 'party',
            sender: msg.senderName,
            isGmSender: msg.isGmSender,
            text: msg.text,
            timestamp: msg.timestampLabel,
          },
        ];
        return merged.length > 60 ? merged.slice(merged.length - 60) : merged;
      });
    });

    const unsubXp = subscribePartyXpEvents(
      activePartyId,
      actorUid,
      partyJoinedAtMsRef.current,
      (evt) => {
        const sim = simRef.current;
        if (evt.mapId !== sim.mapId) return;

        const activeParty = playerPartyRef.current;
        if (!activeParty || !activeParty.memberUids.includes(evt.killerUid)) {
          return;
        }
        const myCh = currentChannelRef.current;
        const killerLive = remoteSmoothRef.current.get(evt.killerUid)?.player;
        const eventCh =
          evt.channelId ??
          killerLive?.channelId ??
          activeParty.members[evt.killerUid]?.channelId;
        // Strict same-channel requirement: players on different Channels never share Party XP
        if (!eventCh || eventCh !== myCh) return;

        const sameMapChannelCount = Math.max(
          2,
          activeParty.memberUids.filter((uid) => {
            if (uid === actorUid) return true;
            if (uid === evt.killerUid) return true;
            const live = remoteSmoothRef.current.get(uid)?.player;
            const memberMap = live?.mapId ?? activeParty.members[uid]?.mapId;
            const memberCh =
              live?.channelId ?? activeParty.members[uid]?.channelId;
            return memberMap === sim.mapId && memberCh === myCh;
          }).length
        );
        const shareFactor = calcPartyShareFactor(sameMapChannelCount);
        const sharePct = getPartySharePercent(sameMapChannelCount);

        const prevAcc = hudAccountRef.current;
        const formNow = activeFormRef.current;
        const baseSharedDigimonExp = Math.max(
          1,
          Math.round(
            calcDmoKillExp(evt.baseExp, prevAcc.digimon.level, evt.mobLevel) *
              shareFactor
          )
        );
        const baseSharedTamerExp = Math.max(
          1,
          Math.round(
            calcDmoKillExp(evt.baseExp, prevAcc.tamer.level, evt.mobLevel) *
              0.48 *
              shareFactor
          )
        );

        const totalGuildExpBonusPct = guildDailyEventXpRef.current;
        const playerXpBoostPct = getActiveXpBoostBonusPct(prevAcc.xpBoostUntilMs);
        const autoFarmVipXpBonusPct =
          autoHuntConfigRef.current.enabled &&
          isAutoFarmVipActive(prevAcc, isGM)
            ? AUTO_FARM_VIP_XP_BONUS_PCT
            : 0;
        const gainedDigimonExp = applyServerExpMultiplier(
          baseSharedDigimonExp,
          serverExpRateRef.current,
          totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
        );
        const gainedTamerExp = applyServerExpMultiplier(
          baseSharedTamerExp,
          serverExpRateRef.current,
          totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
        );

        const tamerRes = applyExpToTamer(
          prevAcc.tamer,
          gainedTamerExp,
          prevAcc.equippedItems
        );
        const digiRes = applyExpToDigimon(
          prevAcc.digimon,
          gainedDigimonExp,
          runtimeMetaRef.current.starterDigimonId
        );

        commitHudAccount({
          ...prevAcc,
          tamer: tamerRes.next,
          digimon: digiRes.next,
          updatedAt: new Date().toISOString(),
        });

        sim.floatingTexts.push({
          id: sim.nextFxId++,
          x: sim.partner.x,
          y: sim.partner.y - 54,
          text: `+${gainedDigimonExp} EXP (Party ${sharePct}%)`,
          color: '#38bdf8',
          elapsed: 0,
          duration: 1.05,
        });

        pushChatMessage(
          'party',
          `${evt.killerName} abateu ${evt.mobName} (Nv.${evt.mobLevel}) [CH${myCh} · ${sharePct}%]: +${gainedDigimonExp} EXP (${formNow.name}) · +${gainedTamerExp} EXP (Tamer).`,
          { tone: 'loot' }
        );

        if (tamerRes.leveledUp) {
          setLevelUpPulse(true);
          setTimeout(() => setLevelUpPulse(false), 1800);
          pushChatMessage(
            'system',
            `LEVEL UP! Tamer ${runtimeMetaRef.current.tamerName} alcançou o Nível ${tamerRes.next.level}!`,
            { tone: 'level' }
          );
        }
        if (digiRes.leveledUp) {
          setDigimonLevelUpPulse(true);
          setTimeout(() => setDigimonLevelUpPulse(false), 1800);
          pushChatMessage(
            'system',
            `LEVEL UP! ${formNow.name} alcançou o Nível ${digiRes.next.level}!`,
            { tone: 'level' }
          );
        }
        if (digiRes.newlyUnlockedForms.length > 0) {
          for (const unlocked of digiRes.newlyUnlockedForms) {
            const evoCost = getFormEvoluterCost(
              runtimeMetaRef.current.starterDigimonId,
              unlocked.id
            );
            const needsEvoUnlock =
              evoCost > 0 &&
              !isEvolutionSlotUnlockedByEvoluter(
                runtimeMetaRef.current.starterDigimonId,
                unlocked.id,
                digiRes.next
              );
            playDigitalTone('confirm', soundEnabledRef.current);
            setEvolutionUnlockAlert(unlocked);
            pushChatMessage(
              'system',
              needsEvoUnlock
                ? `EVOLUÇÃO DISPONÍVEL! ${formNow.name} atingiu o Nível ${unlocked.unlockLevel}! Use ${evoCost} Evoluters para desbloquear ${unlocked.name}!`
                : `EVOLUÇÃO DESBLOQUEADA! ${formNow.name} atingiu o Nível ${unlocked.unlockLevel} e está pronto para evoluir para ${unlocked.name}!`,
              { tone: 'level' }
            );
          }
        }
      }
    );

    return () => {
      unsubChat();
      unsubXp();
    };
  }, [activePartyId, actorUid, pushChatMessage]);

  // Periodically sync local member vitals/map/photo/level into the active Party
  useEffect(() => {
    if (!activePartyId) return;
    const syncNow = () => {
      const acc = hudAccountRef.current;
      const form = activeFormRef.current;
      const profile: PartyActorProfile = {
        uid: actorUid,
        tamerName: runtimeMetaRef.current.tamerName,
        characterId: selection.characterId,
        tamerLevel: acc.tamer.level,
        tamerPhotoUrl: acc.tamerPhotoUrl ?? null,
        digimonFormId: form.id,
        digimonName: acc.digimon.nickname?.trim() || form.name,
        digimonLevel: acc.digimon.level,
        hp: acc.digimon.hp,
        maxHp: acc.digimon.maxHp,
        mapId: simRef.current.mapId,
        channelId: currentChannelRef.current,
      };
      void syncLocalMemberInParty(activePartyId, profile);
    };

    syncNow();
    const timer = window.setInterval(syncNow, 5000);
    return () => window.clearInterval(timer);
  }, [
    activePartyId,
    activeChannelId,
    actorUid,
    selection.characterId,
    hudAccount.tamer.level,
    hudAccount.digimon.level,
    hudAccount.tamerPhotoUrl,
    activeFormProfile.id,
  ]);

  // Keep Tamers & Digimons leaderboards synchronized (throttled on EXP/kills, immediate on level/form/guild/photo/cover change)
  useEffect(() => {
    // Wait until the one-time ranking backup recovery check has completed before allowing a Lv.1 snapshot to sync
    if (
      !rankingBackupCheckedRef.current &&
      hudAccount.tamer.level <= 1 &&
      hudAccount.digimon.level <= 1 &&
      hudAccount.defeatedEnemiesTotal === 0
    ) {
      return;
    }
    const cur = hudAccountRef.current;
    const tamerAttrs = computeTamerAttributes(cur.tamer, cur.equippedItems);
    const derivedDigimon = computeDerivedDigimonAttributes(
      tamerAttrs,
      cur.digimon,
      cur.defeatedEnemiesTotal,
      activeFormProfile.id
    );
    const majorSig = `${hudAccount.tamer.level}|${hudAccount.digimon.level}|${activeFormProfile.id}|${hudAccount.guildName ?? ''}|${hudAccount.tamerPhotoUrl ?? ''}|${hudAccount.tamerCoverUrl ?? ''}`;
    const fullSig = `${majorSig}|${hudAccount.defeatedEnemiesTotal}|${derivedDigimon.combatPower}`;
    const prev = lastRankingSyncRef.current;
    if (prev.sig === fullSig) return;
    const nowMs = Date.now();
    const majorChanged = !prev.sig.startsWith(`${majorSig}|`);
    if (!majorChanged && nowMs - prev.atMs < 10_000) return;

    lastRankingSyncRef.current = { sig: fullSig, atMs: nowMs };
    void syncPlayerRankingSnapshot({
      userId: actorUid,
      tamerName: selection.tamerName,
      characterId: selection.characterId,
      tamerLevel: hudAccount.tamer.level,
      tamerExp: hudAccount.tamer.exp,
      digimonFormId: activeFormProfile.id,
      digimonName: hudAccount.digimon.nickname?.trim() || activeFormProfile.name,
      digimonLevel: hudAccount.digimon.level,
      digimonExp: hudAccount.digimon.exp,
      digimonCombatPower: derivedDigimon.combatPower,
      hatchGrade: hudAccount.digimon.hatchGrade ?? 3,
      hatchSizePct: hudAccount.digimon.hatchSizePct ?? 100,
      defeatedEnemiesTotal: hudAccount.defeatedEnemiesTotal,
      guildName: hudAccount.guildName,
      isGm: isServerGm,
      tamerPhotoUrl: hudAccount.tamerPhotoUrl ?? null,
      tamerCoverUrl: hudAccount.tamerCoverUrl ?? null,
    });
  }, [
    actorUid,
    activeFormProfile.id,
    activeFormProfile.name,
    hudAccount.defeatedEnemiesTotal,
    hudAccount.digimon.exp,
    hudAccount.digimon.hatchGrade,
    hudAccount.digimon.hatchSizePct,
    hudAccount.digimon.level,
    hudAccount.digimon.nickname,
    hudAccount.guildName,
    hudAccount.tamer.exp,
    hudAccount.tamer.level,
    hudAccount.tamerPhotoUrl,
    hudAccount.tamerCoverUrl,
    isServerGm,
    selection.characterId,
    selection.tamerName,
  ]);

  // Keep this account's Referral / Invite Code profile synced (avatar, cover, Tamer name)
  // and redeem any pending ?ref= invite code captured during sign-up
  useEffect(() => {
    void ensureOwnReferralProfile({
      tamerName: selection.tamerName,
      characterId: selection.characterId,
      tamerPhotoUrl: hudAccount.tamerPhotoUrl ?? null,
      tamerCoverUrl: hudAccount.tamerCoverUrl ?? null,
      isGm: isServerGm,
    });
  }, [
    actorUid,
    hudAccount.tamerCoverUrl,
    hudAccount.tamerPhotoUrl,
    isServerGm,
    selection.characterId,
    selection.tamerName,
  ]);

  useEffect(() => {
    let cancelled = false;
    void applyPendingReferralCodeIfAny(selection.tamerName).then((res) => {
      if (cancelled || !res?.ok || !res.claim) return;
      pushNotification(
        'Código de Convite Ativado',
        `Você foi vinculado ao código de ${res.claim.referrerName} (${formatReferralCodeDisplay(res.claim.inviteCode)}).`
      );
      pushChatMessage(
        'system',
        `[Convite] Código de ${res.claim.referrerName} aplicado com sucesso!`,
        { tone: 'loot' }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [actorUid, pushChatMessage, pushNotification, selection.tamerName]);

  const [liveSnapshot, setLiveSnapshot] = useState<LiveWorldHudSnapshot>(() => ({
    mapId: initialSpawn.mapId,
    tamerX: initialSpawn.x,
    tamerY: initialSpawn.y,
    tamerDir: initialSpawn.dir,
    tamerMoveState: 'idle',
    partnerX: initialSpawn.x,
    partnerY: initialSpawn.y,
    partnerState: 'IDLE',
    inSafeZone: isPointInMapSafeZone(
      initialSpawn.mapId,
      initialSpawn.x,
      initialSpawn.y
    ),
    nearbyPointId: null,
    nearReturnPortal: false,
    discoveredZoneIds: initialSpawn.discoveredZones,
    special1Cooldown: 0,
    special1MaxCooldown: activeFormProfile.special1CooldownSec,
    special2Cooldown: 0,
    special2MaxCooldown: activeFormProfile.special2CooldownSec,
    activeSkillBanner: null,
    targetEnemy: null,
    minimapEnemies: [],
  }));

  // Play dedicated DMO soundtrack per map in loop; obey musicEnabled & musicVolume settings
  const worldMusicActive = preferences.musicEnabled && preferences.musicVolume > 0;

  useEffect(() => {
    worldBgmPlayer.setVolumeMultiplier(preferences.musicVolume / 100);
  }, [preferences.musicVolume]);

  useEffect(() => {
    worldBgmPlayer.playForMap(liveSnapshot.mapId, worldMusicActive);
  }, [liveSnapshot.mapId, worldMusicActive]);

  useEffect(() => {
    worldBgmPlayer.setMuted(!worldMusicActive);
  }, [worldMusicActive]);

  useEffect(() => {
    return () => {
      worldBgmPlayer.stop();
    };
  }, []);

  const simRef = useRef<{
    mapId: ActiveWorldMapId;
    x: number;
    y: number;
    camX: number;
    camY: number;
    dir: CardinalDirection;
    state: TamerMovementState;
    frameTime: number;
    frameIndex: number;
    partner: PartnerRuntimeState;
    enemies: EnemyMonsterInstance[];
    combatEffects: ActiveCombatEffect[];
    bossAoeEffects: BossAoeWaveEffect[];
    floatingTexts: FloatingDamageText[];
    eggDropFx: DigiEggDropFx[];
    nextFxId: number;
    activeSkillBanner: string | null;
    skillBannerTimer: number;
    evoFlashTimer: number;
    evoAnim: InWorldEvoAnimationState | null;
    swapAnim: InWorldSwapAnimationState | null;
    enemyCounterTimer: number;
    safeRegenTimer: number;
    joyVx: number;
    joyVy: number;
    joyMag: number;
    tapTarget: { x: number; y: number } | null;
    autoNavActive: boolean;
    keyOrder: CardinalDirection[];
    distMovedAccum: number;
    stepsCount: number;
    discoveredZones: Set<string>;
    nearbyPointId: string | null;
    nearReturnPortal: boolean;
    lastSaveTs: number;
  }>({
    mapId: initialSpawn.mapId,
    x: initialSpawn.x,
    y: initialSpawn.y,
    camX: initialSpawn.x,
    camY: initialSpawn.y - 56,
    dir: initialSpawn.dir as CardinalDirection,
    state: 'idle',
    frameTime: 0,
    frameIndex: 0,
    partner: createInitialPartnerRuntime(
      initialSpawn.x,
      initialSpawn.y,
      initialSpawn.dir as CardinalDirection
    ),
    enemies:
      initialSpawn.mapId === VIRTUAL_WORLD_MAP_ID
        ? createInitialVirtualWorldMonsters()
        : initialSpawn.mapId === DARK_AREA_MAP_ID
          ? createInitialDarkAreaMonsters()
          : initialSpawn.mapId === DIGIMON_ISLAND_MAP_ID
          ? createInitialDigimonIslandMonsters()
        : initialSpawn.mapId === DATA_SEA_MAP_ID
          ? createInitialDataSeaMonsters()
          : initialSpawn.mapId === DIGITAL_DESERT_MAP_ID
            ? createInitialDigitalDesertMonsters()
            : initialSpawn.mapId === DIGI_MOUNTAIN_MAP_ID
              ? createInitialDigiMountainMonsters()
              : initialSpawn.mapId === DATA_FOREST_MAP_ID
                ? createInitialDataForestMonsters()
                : createInitialWildMonsters(),
    combatEffects: [],
    bossAoeEffects: [],
    floatingTexts: [],
    eggDropFx: [],
    nextFxId: 1,
    activeSkillBanner: null,
    skillBannerTimer: 0,
    evoFlashTimer: 0,
    evoAnim: null,
    swapAnim: null,
    enemyCounterTimer: 0,
    safeRegenTimer: 0,
    joyVx: 0,
    joyVy: 0,
    joyMag: 0,
    tapTarget: null,
    autoNavActive: false,
    keyOrder: [],
    distMovedAccum: 0,
    stepsCount: initialSpawn.stepsCount,
    discoveredZones: new Set<string>(initialSpawn.discoveredZones),
    nearbyPointId: null,
    nearReturnPortal: false,
    lastSaveTs: 0,
  });

  function buildLocalPresenceSnapshot(): LocalPresenceState {
    const sim = simRef.current;
    const hud = hudAccountRef.current;
    return {
      tamerName: selection.tamerName,
      characterId: selection.characterId,
      tamerLevel: hud.tamer.level,
      digimonFormId: activeFormRef.current.id,
      digimonLevel: hud.digimon.level,
      mapId: sim.mapId,
      channelId: currentChannelRef.current,
      worldX: sim.x,
      worldY: sim.y,
      facingDir: sim.dir,
      moveState: sim.state,
      partnerX: sim.partner.x,
      partnerY: sim.partner.y,
      partnerDir: sim.partner.dir,
      partnerMoving: sim.partner.isMoving,
      isGm: isServerGm,
      guildName: hud.guildName,
    };
  }

  // Live player count per channel on the current map (for DMO-style 5-Channel Selector)
  const channelCounts = useMemo<Record<WorldChannelId, number>>(() => {
    const counts: Record<WorldChannelId, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    const activeMap = liveSnapshot.mapId;
    counts[activeChannelId] = 1;
    for (const p of remotePlayers) {
      if (p.mapId === activeMap) {
        counts[p.channelId] = (counts[p.channelId] ?? 0) + 1;
      }
    }
    return counts;
  }, [remotePlayers, liveSnapshot.mapId, activeChannelId]);

  const partyChannelCounts = useMemo<Partial<Record<WorldChannelId, number>>>(
    () => {
      const map: Partial<Record<WorldChannelId, number>> = {};
      if (!playerParty) return map;
      for (const uid of playerParty.memberUids) {
        if (uid === actorUid) continue;
        const member = playerParty.members[uid];
        if (member && member.mapId === liveSnapshot.mapId) {
          map[member.channelId] = (map[member.channelId] ?? 0) + 1;
        }
      }
      return map;
    },
    [playerParty, actorUid, liveSnapshot.mapId]
  );

  const partyLeaderChannelId = useMemo<WorldChannelId | null>(() => {
    if (!playerParty || playerParty.leaderUid === actorUid) return null;
    const leader = playerParty.members[playerParty.leaderUid];
    if (!leader || leader.mapId !== liveSnapshot.mapId) return null;
    return leader.channelId;
  }, [playerParty, actorUid, liveSnapshot.mapId]);

  const applyRemoteCombatSnapshot = useCallback(
    (
      smooth: SmoothedRemotePlayer,
      p: RemoteWorldPlayer,
      opts?: { initialHydration?: boolean }
    ) => {
      const sim = simRef.current;
      if (
        p.mapId !== sim.mapId ||
        p.channelId !== currentChannelRef.current ||
        p.combatSeq <= 0 ||
        !p.combatTargetId
      ) {
        return;
      }

      const ageMs = Math.max(0, Date.now() - p.updatedAtMs);
      const isInitial = Boolean(opts?.initialHydration);
      const enemy = sim.enemies.find((e) => e.id === p.combatTargetId);

      // 1) Play remote Partner Digimon attack animation & species-authentic skill VFX
      if (!isInitial || ageMs <= 3500) {
        const atkX = smooth.partnerRenderX;
        const atkY = smooth.partnerRenderY;
        const tgtX = enemy && enemy.alive ? enemy.x : p.combatTargetX;
        const tgtY = enemy && enemy.alive ? enemy.y : p.combatTargetY;
        const facingRight = tgtX >= atkX;

        smooth.partnerVisualDir = snapToCardinalVector(
          tgtX - atkX,
          tgtY - atkY
        ).dir;
        smooth.activeAttack = {
          kind: p.combatKind,
          facingRight,
          elapsed: 0,
          duration:
            p.combatKind === 'basic'
              ? 0.36
              : p.combatKind === 'special1'
                ? 0.56
                : 0.68,
        };

        sim.combatEffects.push({
          id: sim.nextFxId++,
          kind: p.combatKind,
          attackerFormId: p.digimonFormId,
          attackerX: atkX,
          attackerY: atkY,
          targetX: tgtX,
          targetY: tgtY,
          elapsed: 0,
          duration:
            p.combatKind === 'basic'
              ? 0.28
              : p.combatKind === 'special1'
                ? 0.72
                : 0.84,
        });

        if (enemy && enemy.alive && p.combatDamage > 0) {
          enemy.hitFlashTimer = 0.16;
          sim.floatingTexts.push({
            id: sim.nextFxId++,
            x: tgtX,
            y: tgtY - (enemy.isBoss ? 86 : 42),
            text: `-${p.combatDamage}`,
            color: '#cbd5e1',
            elapsed: 0,
            duration: 0.72,
          });
        }
      }

      // 2) Synchronize shared wild Digimon HP & death across all players in the same Map & Channel
      // (World Raid Bosses already sync authoritatively through /worldBosses/{bossId})
      if (enemy && !enemy.isBoss) {
        if (p.combatKilled || p.combatTargetHpAfter <= 0) {
          if (!isInitial || ageMs < 6300) {
            enemy.hp = 0;
            enemy.alive = false;
            enemy.aggroed = false;
            enemy.aggroTimer = 0;
            enemy.attackAnimTimer = 0;
            enemy.respawnTimer = isInitial
              ? Math.max(0.5, 6.5 - ageMs / 1000)
              : 6.5;
            if (sim.partner.targetEnemyId === enemy.id) {
              sim.partner.targetEnemyId = null;
            }
          }
        } else if (enemy.alive && (!isInitial || ageMs < 5500)) {
          enemy.hp = Math.max(1, Math.min(enemy.hp, p.combatTargetHpAfter));
          if (
            !enemy.aggroed &&
            Math.hypot(
              p.combatTargetX - enemy.homeX,
              p.combatTargetY - enemy.homeY
            ) <= 480
          ) {
            enemy.x = p.combatTargetX;
            enemy.y = p.combatTargetY;
          }
        }
      }
    },
    []
  );

  const handleSwitchChannel = useCallback(
    (
      rawTargetChannel: WorldChannelId,
      opts?: { silent?: boolean; force?: boolean }
    ) => {
      const targetCh = safeChannelId(rawTargetChannel);
      if (targetCh === currentChannelRef.current) return;

      const nowMs = Date.now();
      if (!opts?.force && nowMs - lastChannelSwitchMsRef.current < 1000) {
        if (!opts?.silent) {
          pushChatMessage(
            'system',
            'Aguarde 1 segundo antes de trocar de canal novamente.',
            { tone: 'info' }
          );
        }
        return;
      }

      const sim = simRef.current;
      let countInTarget = 0;
      for (const s of remoteSmoothRef.current.values()) {
        if (s.player.mapId === sim.mapId && s.player.channelId === targetCh) {
          countInTarget++;
        }
      }

      const party = playerPartyRef.current;
      const partyHasMemberInTarget = Boolean(
        party &&
          party.memberUids.some((uid) => {
            if (uid === actorUid) return false;
            const m = party.members[uid];
            return Boolean(m && m.mapId === sim.mapId && m.channelId === targetCh);
          })
      );

      if (
        countInTarget >= CHANNEL_HARD_CAPACITY &&
        !isGM &&
        !opts?.force &&
        !partyHasMemberInTarget
      ) {
        playDigitalTone('error', soundEnabledRef.current);
        pushChatMessage(
          'system',
          `O Canal CH ${targetCh} está cheio (${countInTarget}/${CHANNEL_HARD_CAPACITY}). Escolha outro canal livre!`,
          { tone: 'warning' }
        );
        return;
      }

      lastChannelSwitchMsRef.current = nowMs;
      setChannelSwitching(true);
      currentChannelRef.current = targetCh;
      setActiveChannelId(targetCh);
      try {
        localStorage.setItem('dw_active_channel_v1', String(targetCh));
      } catch {
        // Ignore storage error
      }

      // Cleanly disengage active mob aggro, reset wild mobs for the destination Channel instance, & clear inspector
      sim.partner.targetEnemyId = null;
      sim.partner.aiState = 'FOLLOW';
      sim.combatEffects = [];
      for (const enemy of sim.enemies) {
        enemy.aggroed = false;
        enemy.aggroTimer = 0;
        enemy.hitFlashTimer = 0;
        enemy.attackAnimTimer = 0;
        if (!enemy.isBoss) {
          enemy.alive = true;
          enemy.hp = enemy.maxHp;
          enemy.x = enemy.homeX;
          enemy.y = enemy.homeY;
          enemy.respawnTimer = 0;
        }
      }
      setSelectedRemotePlayer(null);

      // Snap positions, preload sprites, AND immediately hydrate ongoing combat & slain mobs in the destination channel
      const preloaded = preloadedRemoteAssetsRef.current;
      for (const smooth of remoteSmoothRef.current.values()) {
        if (
          smooth.player.mapId === sim.mapId &&
          smooth.player.channelId === targetCh
        ) {
          const tamerKey = `t:${smooth.player.characterId}`;
          if (!preloaded.has(tamerKey)) {
            preloaded.add(tamerKey);
            void preloadTamerSheets(smooth.player.characterId);
          }
          const digiKey = `d:${smooth.player.digimonFormId}`;
          if (!preloaded.has(digiKey)) {
            preloaded.add(digiKey);
            void preloadDigimonPartnerAssets(smooth.player.digimonFormId);
          }
          smooth.renderX = smooth.player.worldX;
          smooth.renderY = smooth.player.worldY;
          smooth.targetX = smooth.player.worldX;
          smooth.targetY = smooth.player.worldY;
          smooth.vx = 0;
          smooth.vy = 0;
          smooth.partnerRenderX = smooth.player.partnerX;
          smooth.partnerRenderY = smooth.player.partnerY;
          smooth.partnerTargetX = smooth.player.partnerX;
          smooth.partnerTargetY = smooth.player.partnerY;
          smooth.partnerVx = 0;
          smooth.partnerVy = 0;
          smooth.activeAttack = null;

          if (smooth.player.combatSeq > 0) {
            seenRemoteCombatSeqRef.current.set(
              smooth.player.uid,
              smooth.player.combatSeq
            );
            applyRemoteCombatSnapshot(smooth, smooth.player, {
              initialHydration: true,
            });
          }
        }
      }

      const snap = buildLocalPresenceSnapshot();
      lastPresenceSyncRef.current.x = snap.worldX;
      lastPresenceSyncRef.current.y = snap.worldY;
      lastPresenceSyncRef.current.partnerX = snap.partnerX;
      lastPresenceSyncRef.current.partnerY = snap.partnerY;
      lastPresenceSyncRef.current.partnerMoving = snap.partnerMoving;
      lastPresenceSyncRef.current.dir = snap.facingDir;
      lastPresenceSyncRef.current.state = snap.moveState;
      lastPresenceSyncRef.current.mapId = snap.mapId;
      lastPresenceSyncRef.current.channelId = snap.channelId;
      lastPresenceSyncRef.current.formId = snap.digimonFormId;
      lastPresenceSyncRef.current.tamerLevel = snap.tamerLevel;
      lastPresenceSyncRef.current.digimonLevel = snap.digimonLevel;
      lastPresenceSyncRef.current.sentAtMs = nowMs;
      lastPresenceSyncRef.current.inFlight = true;

      void publishLocalWorldPresence(snap)
        .then((res) => {
          if (!res.ok) {
            // Reset synced channelId so the loop retries immediately on transient failure
            lastPresenceSyncRef.current.channelId = 0 as unknown as WorldChannelId;
            if (
              !opts?.silent &&
              res.errorMessage &&
              /permission|denied/i.test(res.errorMessage)
            ) {
              pushChatMessage(
                'system',
                'Aviso: o banco recusou a sincronização do Canal (CH) ou forma atual. Atualize as regras do Firestore do servidor para liberar channelId e os novos Digimons.',
                { tone: 'warning' }
              );
            }
          }
        })
        .finally(() => {
          lastPresenceSyncRef.current.inFlight = false;
          setChannelSwitching(false);
        });

      if (party) {
        const acc = hudAccountRef.current;
        const form = activeFormRef.current;
        void syncLocalMemberInParty(party.partyId, {
          uid: actorUid,
          tamerName: runtimeMetaRef.current.tamerName,
          characterId: selection.characterId,
          tamerLevel: acc.tamer.level,
          tamerPhotoUrl: acc.tamerPhotoUrl ?? null,
          digimonFormId: form.id,
          digimonName: acc.digimon.nickname?.trim() || form.name,
          digimonLevel: acc.digimon.level,
          hp: acc.digimon.hp,
          maxHp: acc.digimon.maxHp,
          mapId: sim.mapId,
          channelId: targetCh,
        });
      }

      if (!opts?.silent) {
        playDigitalTone('confirm', soundEnabledRef.current);
        pushChatMessage(
          'system',
          `Canal alterado para CH ${targetCh} (${getMapDisplayLabel(sim.mapId)}).`,
          { tone: 'info' }
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actorUid, isGM, pushChatMessage, selection.characterId]
  );

  // Subscribe to all live online players in Firestore & publish our own real-time presence
  useEffect(() => {
    const myEpoch = bumpPresenceSessionEpoch();
    let active = true;

    const pushFullPresenceNow = () => {
      if (!active) return;
      const snap = buildLocalPresenceSnapshot();
      lastPresenceSyncRef.current.x = snap.worldX;
      lastPresenceSyncRef.current.y = snap.worldY;
      lastPresenceSyncRef.current.partnerX = snap.partnerX;
      lastPresenceSyncRef.current.partnerY = snap.partnerY;
      lastPresenceSyncRef.current.partnerMoving = snap.partnerMoving;
      lastPresenceSyncRef.current.dir = snap.facingDir;
      lastPresenceSyncRef.current.state = snap.moveState;
      lastPresenceSyncRef.current.mapId = snap.mapId;
      lastPresenceSyncRef.current.channelId = snap.channelId;
      lastPresenceSyncRef.current.formId = snap.digimonFormId;
      lastPresenceSyncRef.current.tamerLevel = snap.tamerLevel;
      lastPresenceSyncRef.current.digimonLevel = snap.digimonLevel;
      lastPresenceSyncRef.current.sentAtMs = Date.now();
      lastPresenceSyncRef.current.inFlight = true;

      void publishLocalWorldPresence(snap, { forceFullWrite: true }).then(() => {
        lastPresenceSyncRef.current.inFlight = false;
      });
    };

    // Immediate join broadcast so other players see us right away
    pushFullPresenceNow();

    const unsubscribe = subscribeOnlineWorldPlayers((players) => {
      if (!active) return;

      const smoothMap = remoteSmoothRef.current;
      const preloaded = preloadedRemoteAssetsRef.current;
      const activeUids = new Set<string>();
      const now = Date.now();
      const myMapId = simRef.current.mapId;
      const myChannelId = currentChannelRef.current;

      for (const p of players) {
        activeUids.add(p.uid);

        const isSameMapAndChannel =
          p.mapId === myMapId && p.channelId === myChannelId;

        // Lazily preload remote Tamer & Digimon assets ONLY once per unique asset and only for players in our map+channel
        if (isSameMapAndChannel) {
          const tamerAssetKey = `t:${p.characterId}`;
          if (!preloaded.has(tamerAssetKey)) {
            preloaded.add(tamerAssetKey);
            void preloadTamerSheets(p.characterId);
          }
          const digiAssetKey = `d:${p.digimonFormId}`;
          if (!preloaded.has(digiAssetKey)) {
            preloaded.add(digiAssetKey);
            void preloadDigimonPartnerAssets(p.digimonFormId);
          }
        }

        // Announce newly arrived players after initial world hydration
        if (initialPresenceLoadedRef.current && !knownOnlineUidsRef.current.has(p.uid)) {
          const mapLabel = getMapDisplayLabel(p.mapId);
          pushChatMessage(
            'system',
            `${p.isGm ? '[GM] ' : ''}${p.tamerName} entrou no Mundo Digital (${mapLabel} · CH ${p.channelId})!`,
            { tone: 'info' }
          );
        }
        knownOnlineUidsRef.current.add(p.uid);

        // Process live local proximity chat broadcasts (strictly same map, same channel & nearby players only!)
        const prevSeq = seenRemoteChatSeqRef.current.get(p.uid);
        let bubbleText = smoothMap.get(p.uid)?.bubbleText ?? '';
        let bubbleExpiresAt = smoothMap.get(p.uid)?.bubbleExpiresAt ?? 0;
        const isSameMapNearby =
          isSameMapAndChannel &&
          Math.hypot(p.worldX - simRef.current.x, p.worldY - simRef.current.y) <=
            680;

        if (prevSeq === undefined) {
          seenRemoteChatSeqRef.current.set(p.uid, p.chatSeq);
          // Only show speech bubble on initial sync if on same map+channel, nearby, and recent
          if (isSameMapNearby && p.chatText && Math.abs(now - p.updatedAtMs) <= 7000) {
            bubbleText = p.chatText;
            bubbleExpiresAt = now + 5500;
          }
        } else if (p.chatSeq > prevSeq && p.chatText) {
          seenRemoteChatSeqRef.current.set(p.uid, p.chatSeq);
          if (isSameMapNearby) {
            bubbleText = p.chatText;
            bubbleExpiresAt = now + 5500;
            pushChatMessage('map', p.chatText, {
              sender: p.tamerName,
              isGmSender: p.isGm,
            });
          }
        }

        const existingSmooth = smoothMap.get(p.uid);
        let activeSmooth: SmoothedRemotePlayer;
        if (
          !existingSmooth ||
          existingSmooth.player.mapId !== p.mapId ||
          existingSmooth.player.channelId !== p.channelId
        ) {
          activeSmooth = {
            player: p,
            renderX: p.worldX,
            renderY: p.worldY,
            targetX: p.worldX,
            targetY: p.worldY,
            vx: 0,
            vy: 0,
            visualDir: p.facingDir,
            partnerRenderX: p.partnerX,
            partnerRenderY: p.partnerY,
            partnerTargetX: p.partnerX,
            partnerTargetY: p.partnerY,
            partnerVx: 0,
            partnerVy: 0,
            partnerVisualDir: p.partnerDir,
            lastPacketAtMs: now,
            frameTime: 0,
            frameIndex: 0,
            partnerFrameTime: 0,
            partnerFrameIndex: 0,
            bubbleText,
            bubbleExpiresAt,
            activeAttack: null,
          };
          smoothMap.set(p.uid, activeSmooth);
        } else {
          const dtPacket = Math.max(
            0.08,
            Math.min(1.0, (now - existingSmooth.lastPacketAtMs) / 1000)
          );
          const dx = p.worldX - existingSmooth.targetX;
          const dy = p.worldY - existingSmooth.targetY;
          const dist = Math.hypot(dx, dy);

          if (dist >= 360) {
            existingSmooth.renderX = p.worldX;
            existingSmooth.renderY = p.worldY;
            existingSmooth.targetX = p.worldX;
            existingSmooth.targetY = p.worldY;
            existingSmooth.vx = 0;
            existingSmooth.vy = 0;
            existingSmooth.lastPacketAtMs = now;
          } else if (dist > 1.5) {
            const rawSpeed = dist / dtPacket;
            const clampedSpeed = Math.min(235, rawSpeed);
            existingSmooth.vx = (dx / dist) * clampedSpeed;
            existingSmooth.vy = (dy / dist) * clampedSpeed;
            existingSmooth.targetX = p.worldX;
            existingSmooth.targetY = p.worldY;
            existingSmooth.lastPacketAtMs = now;
          } else if (p.moveState === 'idle') {
            existingSmooth.vx = 0;
            existingSmooth.vy = 0;
            existingSmooth.targetX = p.worldX;
            existingSmooth.targetY = p.worldY;
            existingSmooth.lastPacketAtMs = now;
          }

          const pdx = p.partnerX - existingSmooth.partnerTargetX;
          const pdy = p.partnerY - existingSmooth.partnerTargetY;
          const pdist = Math.hypot(pdx, pdy);

          if (pdist >= 360) {
            existingSmooth.partnerRenderX = p.partnerX;
            existingSmooth.partnerRenderY = p.partnerY;
            existingSmooth.partnerTargetX = p.partnerX;
            existingSmooth.partnerTargetY = p.partnerY;
            existingSmooth.partnerVx = 0;
            existingSmooth.partnerVy = 0;
          } else if (pdist > 1.5) {
            const pSpeed = Math.min(280, pdist / dtPacket);
            existingSmooth.partnerVx = (pdx / pdist) * pSpeed;
            existingSmooth.partnerVy = (pdy / pdist) * pSpeed;
            existingSmooth.partnerTargetX = p.partnerX;
            existingSmooth.partnerTargetY = p.partnerY;
          } else if (!p.partnerMoving) {
            existingSmooth.partnerVx = 0;
            existingSmooth.partnerVy = 0;
            existingSmooth.partnerTargetX = p.partnerX;
            existingSmooth.partnerTargetY = p.partnerY;
          }

          existingSmooth.player = p;
          existingSmooth.bubbleText = bubbleText;
          existingSmooth.bubbleExpiresAt = bubbleExpiresAt;
          activeSmooth = existingSmooth;
        }

        // Process live remote Partner Digimon combat attacks & shared wild mob HP/deaths
        const prevCombatSeq = seenRemoteCombatSeqRef.current.get(p.uid);
        if (prevCombatSeq === undefined) {
          seenRemoteCombatSeqRef.current.set(p.uid, p.combatSeq);
          if (isSameMapAndChannel && p.combatSeq > 0) {
            applyRemoteCombatSnapshot(activeSmooth, p, {
              initialHydration: true,
            });
          }
        } else if (p.combatSeq > 0 && p.combatSeq !== prevCombatSeq) {
          seenRemoteCombatSeqRef.current.set(p.uid, p.combatSeq);
          if (isSameMapAndChannel) {
            applyRemoteCombatSnapshot(activeSmooth, p);
          }
        }
      }

      // Remove disconnected players from smooth map cleanly
      for (const uid of Array.from(smoothMap.keys())) {
        if (!activeUids.has(uid)) {
          smoothMap.delete(uid);
          knownOnlineUidsRef.current.delete(uid);
          seenRemoteCombatSeqRef.current.delete(uid);
        }
      }

      initialPresenceLoadedRef.current = true;
      // Only trigger React state re-render when the online roster or any player's displayed Digimon/name/map/channel changes
      // (Live 60fps movement interpolation reads remoteSmoothRef directly without re-rendering React!)
      const nextRosterSig = players
        .map(
          (p) =>
            `${p.uid}:${p.digimonFormId}:${p.tamerName}:${p.mapId}:${p.channelId}`
        )
        .sort()
        .join('|');
      if (nextRosterSig !== lastRemoteRosterSigRef.current) {
        lastRemoteRosterSigRef.current = nextRosterSig;
        setRemotePlayers(players);
      }
      // Avoid triggering React re-renders on every walking coordinate update when inspector card is open
      setSelectedRemotePlayer((curr) => {
        if (!curr) return null;
        const found = players.find((p) => p.uid === curr.uid) ?? null;
        if (!found) return null;
        if (
          found.tamerName === curr.tamerName &&
          found.tamerLevel === curr.tamerLevel &&
          found.digimonFormId === curr.digimonFormId &&
          found.digimonLevel === curr.digimonLevel &&
          found.mapId === curr.mapId &&
          found.channelId === curr.channelId &&
          found.guildName === curr.guildName
        ) {
          return curr;
        }
        return found;
      });
    });

    const handleOfflineSignal = () => {
      void markLocalWorldPresenceOffline(myEpoch);
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'hidden') {
        void markLocalWorldPresenceOffline(myEpoch);
      } else if (document.visibilityState === 'visible') {
        pushFullPresenceNow();
      }
    };
    const handleReturnOnline = () => {
      if (document.visibilityState === 'visible') {
        pushFullPresenceNow();
      }
    };
    window.addEventListener('pagehide', handleOfflineSignal);
    window.addEventListener('beforeunload', handleOfflineSignal);
    window.addEventListener('focus', handleReturnOnline);
    window.addEventListener('online', handleReturnOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      active = false;
      window.removeEventListener('pagehide', handleOfflineSignal);
      window.removeEventListener('beforeunload', handleOfflineSignal);
      window.removeEventListener('focus', handleReturnOnline);
      window.removeEventListener('online', handleReturnOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      unsubscribe();
      void markLocalWorldPresenceOffline(myEpoch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.tamerName, selection.characterId, isServerGm]);

  // Global Real-time Shared Multiplayer Raid Boss Subscription (active on all maps so every online player sees Boss Spawn, Defeat & Ranking)
  useEffect(() => {
    const triggerBossBanner = (nextBanner: WorldBossAnnouncement) => {
      setBossAnnouncement(nextBanner);
      if (bossBannerTimerRef.current !== null) {
        window.clearTimeout(bossBannerTimerRef.current);
      }
      bossBannerTimerRef.current = window.setTimeout(() => {
        setBossAnnouncement((curr) =>
          curr?.id === nextBanner.id ? null : curr
        );
        bossBannerTimerRef.current = null;
      }, 8000);
    };

    const unsubscribe = subscribeWorldBoss(KUWAGAMON_BOSS_ID, (state) => {
      const prevBoss = worldBossRef.current;
      worldBossRef.current = state;
      setWorldBossState(state);
      setBossNowMs(Date.now());

      const prevContribCount = prevBoss
        ? Object.keys(prevBoss.contributors).length
        : 0;
      const nextContribCount = Object.keys(state.contributors).length;
      if (prevContribCount === 0 && nextContribCount > 0 && state.alive) {
        setBossRankingDismissed(false);
      }

      const sim = simRef.current;
      const bossEnemy =
        sim.mapId === DATA_FOREST_MAP_ID
          ? sim.enemies.find(
              (e) => e.isBoss && e.bossId === KUWAGAMON_BOSS_ID
            )
          : undefined;
      if (bossEnemy) {
        bossEnemy.hp = state.hp;
        bossEnemy.maxHp = state.maxHp;
        bossEnemy.alive = state.alive;
        if (prevBoss && !prevBoss.alive && state.alive) {
          bossEnemy.x = bossEnemy.homeX;
          bossEnemy.y = bossEnemy.homeY;
          bossEnemy.attackAnimTimer = 0;
        }
      }

      if (prevBoss && !prevBoss.alive && state.alive) {
        bossParticipatedRef.current = false;
        setBossRankingDismissed(false);
        playDigitalTone('confirm', soundEnabled);
        triggerBossBanner({
          id: Date.now(),
          kind: 'spawn',
          bossName: state.name,
          level: state.level,
          mvpName: null,
          mvpDamage: 0,
          raiderCount: 0,
        });
        pushChatMessage(
          'system',
          'ALERTA DE RAID! O Boss Kuwagamon (Nv. 20) nasceu na Grande Árvore Sagrada (Floresta de Dados)!',
          { tone: 'level' }
        );
        pushNotification(
          'Raid Boss Apareceu!',
          'Kuwagamon (Nv. 20) nasceu na Grande Árvore da Floresta de Dados!'
        );
      }

      if (lastBossDefeatCountRef.current === -1) {
        lastBossDefeatCountRef.current = state.defeatedCount;
        return;
      }

      const justDefeated =
        state.defeatedCount > lastBossDefeatCountRef.current ||
        (Boolean(prevBoss?.alive) && !state.alive);

      if (justDefeated) {
        lastBossDefeatCountRef.current = state.defeatedCount;
        const myUid = auth.currentUser?.uid;
        const didContribute =
          bossParticipatedRef.current ||
          (myUid ? Boolean(state.contributors[myUid]) : false);
        bossParticipatedRef.current = false;

        if (bossEnemy && sim.partner.targetEnemyId === bossEnemy.id) {
          sim.partner.targetEnemyId = null;
        }

        const rankedContributors = Object.entries(state.contributors).sort(
          ([, a], [, b]) => b.damage - a.damage
        );
        const contributorList = rankedContributors.map(([, c]) => c);
        const topNames = contributorList
          .slice(0, 5)
          .map((c, idx) => `#${idx + 1} ${c.tamerName}`)
          .join(', ');
        const raiderCount = Math.max(1, contributorList.length);
        const mvp = contributorList[0] ?? null;

        const myRankIndex = rankedContributors.findIndex(([uid, c]) =>
          myUid
            ? uid === myUid
            : uid === 'local' || c.tamerName === selection.tamerName
        );
        const myRaidRank =
          myRankIndex >= 0
            ? myRankIndex + 1
            : didContribute && rankedContributors.length < 5
              ? rankedContributors.length + 1
              : null;

        triggerBossBanner({
          id: Date.now(),
          kind: 'defeat',
          bossName: state.name,
          level: state.level,
          mvpName: mvp?.tamerName ?? null,
          mvpDamage: mvp?.damage ?? 0,
          raiderCount,
        });

        pushChatMessage(
          'system',
          `★ RAID BOSS DERROTADO! Kuwagamon (Nv. 20) foi vencido por ${raiderCount} Tamer${raiderCount > 1 ? 's' : ''}${topNames ? ` · Top 5: ${topNames}` : ''}! Renasce em 1h na Grande Árvore.`,
          { tone: 'level' }
        );

        if (didContribute) {
          const prevAcc = hudAccountRef.current;
          const formNow = activeFormRef.current;
          const baseRaidDigimonExp = Math.max(
            260,
            calcDmoKillExp(1500, prevAcc.digimon.level, 20)
          );
          const baseRaidTamerExp = Math.max(
            110,
            Math.round(calcDmoKillExp(1500, prevAcc.tamer.level, 20) * 0.55)
          );
          const totalGuildExpBonusPct = guildDailyEventXpRef.current;
          const playerXpBoostPct = getActiveXpBoostBonusPct(prevAcc.xpBoostUntilMs);
          const autoFarmVipXpBonusPct =
            autoHuntConfigRef.current.enabled &&
            isAutoFarmVipActive(prevAcc, isGM)
              ? AUTO_FARM_VIP_XP_BONUS_PCT
              : 0;
          const gainedDigimonExp = applyServerExpMultiplier(
            baseRaidDigimonExp,
            serverExpRateRef.current,
            totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
          );
          const gainedTamerExp = applyServerExpMultiplier(
            baseRaidTamerExp,
            serverExpRateRef.current,
            totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
          );
          const bitsDrop = 450;

          if (playerGuildRef.current) {
            const gId = playerGuildRef.current.guildId;
            const gName = playerGuildRef.current.name;
            void contributeGuildExp({
              guildId: gId,
              actorUid,
              tamerName: runtimeMetaRef.current.tamerName,
              tamerLevel: prevAcc.tamer.level,
              characterId: selection.characterId,
              digimonFormId: prevAcc.digimon.activeFormId ?? starterDigimon.digimonId,
              expGain: 180,
              mobsKilled: 1,
            }).then((gRes) => {
              if (gRes.leveledUp && gRes.newLevel) {
                pushNotification(
                  'Guilda Subiu de Nível!',
                  `${gName} alcançou o Nível ${gRes.newLevel}!`
                );
              }
            });
          }

          const activeLineStarterId = activeStarterIdRef.current;
          const tamerRes = applyExpToTamer(
            prevAcc.tamer,
            gainedTamerExp,
            prevAcc.equippedItems
          );
          const digiRes = applyExpToDigimon(
            prevAcc.digimon,
            gainedDigimonExp,
            activeLineStarterId
          );

          const dropRes = rollAndApplyDigimonDrops(
            prevAcc.inventory,
            'kuwagamon',
            Math.random,
            getUnlockedInventorySlots(prevAcc),
            { raidDamageRank: myRaidRank }
          );
          const nextInventory = dropRes.nextInventory;
          const lootSummary =
            dropRes.grantedDrops.length > 0
              ? dropRes.grantedDrops.map((d) => `${d.name} x${d.quantity}`).join(', ')
              : 'nenhum item adicional';
          const rankLabel =
            myRaidRank !== null
              ? `Ranking #${myRaidRank}${myRaidRank <= 5 ? ' (Top 5 · chance de Evoluter 10%)' : ' (fora do Top 5)'}`
              : 'Participação registrada';

          commitHudAccount(
            {
              ...prevAcc,
              tamer: tamerRes.next,
              digimon: digiRes.next,
              bits: prevAcc.bits + bitsDrop,
              inventory: nextInventory,
              defeatedEnemiesTotal: prevAcc.defeatedEnemiesTotal + 1,
              updatedAt: new Date().toISOString(),
            },
            dropRes.grantedDrops.length > 0
          );

          if (dropRes.grantedDrops.length > 0) {
            pushDropRewardToasts(dropRes.grantedDrops, 'Kuwagamon (Boss Raid)');
            spawnDigiEggDropAnimations(
              dropRes.grantedDrops,
              DATA_FOREST_BOSS_ARENA.x,
              DATA_FOREST_BOSS_ARENA.y,
              { sourceName: 'Kuwagamon (Boss Raid)', isBoss: true }
            );
          }

          const bitsDropLabel = formatDigitalCurrency(bitsDrop);
          playDigitalTone('confirm', soundEnabled);
          sim.floatingTexts.push({
            id: sim.nextFxId++,
            x: DATA_FOREST_BOSS_ARENA.x,
            y: DATA_FOREST_BOSS_ARENA.y - 78,
            text: `★ RAID BOSS DERROTADO! +${gainedDigimonExp} EXP · +${bitsDropLabel}`,
            color: '#fde047',
            elapsed: 0,
            duration: 2.1,
          });
          pushChatMessage(
            'system',
            `Recompensa de Raid (${rankLabel}): +${gainedDigimonExp} EXP (${formNow.name}), +${gainedTamerExp} EXP (Tamer), +${bitsDropLabel} e drops: ${lootSummary}.`,
            { tone: 'loot' }
          );
          pushNotification(
            'Vitória na Raid Kuwagamon!',
            `${rankLabel} · +${gainedDigimonExp} EXP, +${bitsDropLabel} (${lootSummary}).`
          );

          if (tamerRes.leveledUp) {
            setLevelUpPulse(true);
            setTimeout(() => setLevelUpPulse(false), 1800);
            pushChatMessage(
              'system',
              `LEVEL UP! Tamer ${selection.tamerName} alcançou o Nível ${tamerRes.next.level}!`,
              { tone: 'level' }
            );
          }
          if (digiRes.leveledUp) {
            setDigimonLevelUpPulse(true);
            setTimeout(() => setDigimonLevelUpPulse(false), 1800);
            pushChatMessage(
              'system',
              `LEVEL UP! ${formNow.name} alcançou o Nível ${digiRes.next.level}!`,
              { tone: 'level' }
            );
          }
          if (digiRes.newlyUnlockedForms.length > 0) {
            for (const unlocked of digiRes.newlyUnlockedForms) {
              const evoCost = getFormEvoluterCost(
                activeLineStarterId,
                unlocked.id
              );
              const needsEvoUnlock =
                evoCost > 0 &&
                !isEvolutionSlotUnlockedByEvoluter(
                  activeLineStarterId,
                  unlocked.id,
                  digiRes.next
                );
              setEvolutionUnlockAlert(unlocked);
              pushChatMessage(
                'system',
                needsEvoUnlock
                  ? `EVOLUÇÃO DISPONÍVEL! ${formNow.name} atingiu o Nível ${unlocked.unlockLevel}! Use ${evoCost} Evoluters para desbloquear ${unlocked.name}!`
                  : `EVOLUÇÃO DESBLOQUEADA! ${formNow.name} atingiu o Nível ${unlocked.unlockLevel} e está pronto para evoluir para ${unlocked.name}!`,
                { tone: 'level' }
              );
              pushNotification(
                needsEvoUnlock
                  ? `Desbloqueie ${unlocked.name}!`
                  : 'Evolução Desbloqueada!',
                needsEvoUnlock
                  ? `${formNow.name} atingiu o Nv. ${unlocked.unlockLevel} e pode liberar ${unlocked.name} usando ${evoCost} Evoluters.`
                  : `${formNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
              );
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (bossBannerTimerRef.current !== null) {
        window.clearTimeout(bossBannerTimerRef.current);
        bossBannerTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, starterDigimon.digimonId, selection.tamerName]);

  // Live 1s countdown ONLY when on Data Forest (where the Boss Card is visible);
  // on other maps, schedule a single respawn timeout to avoid 1Hz full-component React re-renders.
  useEffect(() => {
    if (
      !worldBossState ||
      worldBossState.alive ||
      worldBossState.respawnAtMs <= 0
    ) {
      return;
    }

    if (liveSnapshot.mapId !== worldBossState.mapId) {
      const remainingMs = Math.max(250, worldBossState.respawnAtMs - Date.now());
      const timeoutId = window.setTimeout(() => {
        void tryRespawnWorldBoss(KUWAGAMON_BOSS_ID);
      }, remainingMs);
      return () => window.clearTimeout(timeoutId);
    }

    const tick = () => {
      const now = Date.now();
      setBossNowMs(now);
      if (now >= worldBossState.respawnAtMs) {
        void tryRespawnWorldBoss(KUWAGAMON_BOSS_ID);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [worldBossState, liveSnapshot.mapId]);

  function persistPositionOnly() {
    const sim = simRef.current;
    saveAdventureProgressForAccount({
      accountUsername: selection.accountUsername,
      characterId: selection.characterId,
      tamerName: selection.tamerName,
      mapId: sim.mapId,
      worldX: Math.round(sim.x),
      worldY: Math.round(sim.y),
      facingDir: sim.dir,
      stepsCount: sim.stepsCount,
      discoveredZones: Array.from(sim.discoveredZones),
      updatedAt: new Date().toISOString(),
    });
  }

  function persistProgress() {
    persistPositionOnly();
    saveAccountHudState(hudAccountRef.current, true);
  }

  const GM_INFINITE_DCOIN_CAP = 999_999_999;
  const gmInfiniteStorageKey = `dl_gm_infinite_dcoin_${actorUid}`;
  const [gmInfiniteDCoin, setGmInfiniteDCoin] = useState<boolean>(() => {
    if (!isGM) return false;
    try {
      return window.localStorage.getItem(gmInfiniteStorageKey) === '1';
    } catch {
      return false;
    }
  });
  const gmInfiniteDCoinRef = useRef(gmInfiniteDCoin);
  gmInfiniteDCoinRef.current = gmInfiniteDCoin;

  function commitHudAccount(next: AccountHudPersistence, immediateLocalSave = false) {
    let finalNext = next;
    if (isGM && gmInfiniteDCoinRef.current && finalNext.dCoin < GM_INFINITE_DCOIN_CAP) {
      finalNext = {
        ...finalNext,
        dCoin: GM_INFINITE_DCOIN_CAP,
      };
    }
    const dCoinChangedLocally = finalNext.dCoin !== hudAccountRef.current.dCoin;
    if (
      finalNext.bits !== hudAccountRef.current.bits ||
      dCoinChangedLocally
    ) {
      lastLocalMoneyMutationAtRef.current = Date.now();
    }
    hudAccountRef.current = finalNext;
    setHudAccount(finalNext);
    saveAccountHudState(finalNext, immediateLocalSave || dCoinChangedLocally, {
      syncDCoinToCloud: dCoinChangedLocally,
    });
  }

  function persistTutorialRewardsState(nextState: {
    supplies: boolean;
    eggPack: boolean;
  }) {
    tutorialRewardsClaimedRef.current = nextState;
    setTutorialRewardsClaimed(nextState);
    try {
      window.localStorage.setItem(
        tutorialRewardsStorageKey,
        JSON.stringify(nextState)
      );
    } catch {
      // Ignore storage restrictions
    }
  }

  function handleClaimTutorialSupplies(): boolean {
    if (tutorialRewardsClaimedRef.current.supplies) return false;
    const breadPayload = createInventoryPayloadFromCatalog(
      'food_premium_bread',
      200
    );
    const vitaminPayload = createInventoryPayloadFromCatalog(
      'vitamin_high_b',
      200
    );
    if (!breadPayload || !vitaminPayload) return false;

    const acc = hudAccountRef.current;
    const safeSlotLimit = Math.max(
      getUnlockedInventorySlots(acc),
      acc.inventory.length + 2
    );
    const step1 = addInventoryItem(acc.inventory, breadPayload, safeSlotLimit);
    const step2 = addInventoryItem(step1.next, vitaminPayload, safeSlotLimit);

    const nextRewards = {
      ...tutorialRewardsClaimedRef.current,
      supplies: true,
    };
    persistTutorialRewardsState(nextRewards);
    commitHudAccount(
      {
        ...acc,
        inventory: step2.next,
        tutorialRewardsClaimed: nextRewards,
      },
      true
    );
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage(
      'system',
      '[DATS · Richard Sampson] Kit de Boas-Vindas entregue! Você recebeu 200× Premium Bread (+1.600 HP) e 200× High Vitamin B (+800 DS) na sua Mochila.',
      { tone: 'loot' }
    );
    pushNotification(
      'Suprimentos DATS Recebidos',
      '200× Premium Bread e 200× High Vitamin B adicionados ao seu Inventário.'
    );
    return true;
  }

  function handleClaimTutorialEggPack(): boolean {
    if (tutorialRewardsClaimedRef.current.eggPack) return false;
    const baseEggPayload = createInventoryPayloadFromCatalog(
      'digiegg_demimeramon',
      1
    );
    const fireDataPayload = createInventoryPayloadFromCatalog('data_fire', 21);
    if (!baseEggPayload || !fireDataPayload) return false;

    const tutorialEggPayload = {
      ...baseEggPayload,
      eggData: {
        ...(baseEggPayload.eggData ?? {
          speciesName: 'DemiMeramon',
          rarity: 'Especial',
          dataType: 'fire' as const,
          requiredDataKey: 'data_fire',
          requiredDataQuantity: 7,
          hatchedFormId: 'demimeramon' as const,
        }),
        hatchLevel: 0,
        maxHatchLevel: 5,
        guaranteedUpToLevel: 3,
        isTutorialGift: true,
        preUnlockedFormIds: [
          'demimeramon',
          'meramon',
          'skullmeramon',
          'boltmon',
        ] as DigimonFormId[],
      },
    };

    const acc = hudAccountRef.current;
    const safeSlotLimit = Math.max(
      getUnlockedInventorySlots(acc),
      acc.inventory.length + 2
    );
    const step1 = addInventoryItem(
      acc.inventory,
      tutorialEggPayload,
      safeSlotLimit
    );
    const step2 = addInventoryItem(step1.next, fireDataPayload, safeSlotLimit);

    const nextRewards = {
      ...tutorialRewardsClaimedRef.current,
      eggPack: true,
    };
    persistTutorialRewardsState(nextRewards);
    commitHudAccount(
      {
        ...acc,
        inventory: step2.next,
        tutorialRewardsClaimed: nextRewards,
      },
      true
    );
    playIncubatorSuccessSound(soundEnabled);
    pushChatMessage(
      'system',
      '[DATS · Richard Sampson] Presente de Chocagem entregue! Você recebeu 1× DigiEgg: DemiMeramon (3/5 Garantido · Ultimate e Mega já abertas!) + 21× DATA FIRE.',
      { tone: 'loot' }
    );
    pushNotification(
      'DigiEgg Especial Recebido',
      '1× Ovo DemiMeramon (3/5 Garantido) + 21× DATA FIRE adicionados à Mochila.'
    );
    return true;
  }

  const handleUpdateTamerPhoto = useCallback(
    (photoUrl: string | null) => {
      const safePhoto =
        photoUrl === null
          ? null
          : isValidAvatarPhotoDataUrl(photoUrl)
            ? photoUrl
            : null;
      if (photoUrl !== null && !safePhoto) return;
      const next: AccountHudPersistence = {
        ...hudAccountRef.current,
        tamerPhotoUrl: safePhoto,
        updatedAt: new Date().toISOString(),
      };
      hudAccountRef.current = next;
      setHudAccount(next);
      saveAccountHudState(next, true);
      if (playerGuildRef.current?.masterUid === actorUid) {
        void updateGuildLeaderPhoto({
          guildId: playerGuildRef.current.guildId,
          leaderUid: actorUid,
          characterId: selection.characterId,
          tamerPhotoUrl: safePhoto,
        });
      }
      playDigitalTone('confirm', soundEnabled);
    },
    [actorUid, selection.characterId, soundEnabled]
  );

  const handleUpdateTamerCover = useCallback(
    (coverUrl: string | null) => {
      const safeCover =
        coverUrl === null
          ? null
          : isValidCoverPhotoDataUrl(coverUrl)
            ? coverUrl
            : null;
      if (coverUrl !== null && !safeCover) return;
      const next: AccountHudPersistence = {
        ...hudAccountRef.current,
        tamerCoverUrl: safeCover,
        updatedAt: new Date().toISOString(),
      };
      hudAccountRef.current = next;
      setHudAccount(next);
      saveAccountHudState(next, true);
      playDigitalTone('confirm', soundEnabled);
    },
    [soundEnabled]
  );

  const buildLocalPartyActorProfile = useCallback((): PartyActorProfile => {
    const acc = hudAccountRef.current;
    const form = activeFormRef.current;
    return {
      uid: actorUid,
      tamerName: runtimeMetaRef.current.tamerName,
      characterId: selection.characterId,
      tamerLevel: acc.tamer.level,
      tamerPhotoUrl: acc.tamerPhotoUrl ?? null,
      digimonFormId: form.id,
      digimonName: acc.digimon.nickname?.trim() || form.name,
      digimonLevel: acc.digimon.level,
      hp: acc.digimon.hp,
      maxHp: acc.digimon.maxHp,
      mapId: simRef.current.mapId,
      channelId: currentChannelRef.current,
    };
  }, [actorUid, selection.characterId]);

  const handleInvitePlayerToParty = useCallback(
    async (targetUid: string, targetName: string) => {
      const res = await sendPartyInvite({
        senderProfile: buildLocalPartyActorProfile(),
        currentParty: playerPartyRef.current,
        targetUid,
        targetName,
      });
      playDigitalTone(res.ok ? 'confirm' : 'error', soundEnabled);
      pushChatMessage('system', `[Party] ${res.message}`, {
        tone: res.ok ? 'info' : 'warning',
      });
    },
    [buildLocalPartyActorProfile, pushChatMessage, soundEnabled]
  );

  const handleAcceptPartyInvite = useCallback(
    async (invite: PartyInviteRecord) => {
      const res = await acceptPartyInvite({
        invite,
        joinerProfile: buildLocalPartyActorProfile(),
        currentParty: playerPartyRef.current,
      });
      playDigitalTone(res.ok ? 'confirm' : 'error', soundEnabled);
      pushChatMessage('system', `[Party] ${res.message}`, {
        tone: res.ok ? 'level' : 'warning',
      });
    },
    [buildLocalPartyActorProfile, pushChatMessage, soundEnabled]
  );

  const handleDeclinePartyInvite = useCallback(
    async (inviteId: string) => {
      playDigitalTone('click', soundEnabled);
      await declinePartyInvite(inviteId);
    },
    [soundEnabled]
  );

  const handleLeaveParty = useCallback(async () => {
    const active = playerPartyRef.current;
    if (!active) return;
    const res = await leaveOrKickParty({
      party: active,
      actorUid,
      targetUid: actorUid,
    });
    playDigitalTone(res.ok ? 'click' : 'error', soundEnabled);
    pushChatMessage('system', `[Party] ${res.message}`, { tone: 'info' });
  }, [actorUid, pushChatMessage, soundEnabled]);

  const handleKickPartyMember = useCallback(
    async (targetUid: string) => {
      const active = playerPartyRef.current;
      if (!active) return;
      const res = await leaveOrKickParty({
        party: active,
        actorUid,
        targetUid,
      });
      playDigitalTone(res.ok ? 'click' : 'error', soundEnabled);
      pushChatMessage('system', `[Party] ${res.message}`, { tone: 'info' });
    },
    [actorUid, pushChatMessage, soundEnabled]
  );

  const handleInvitePlayerToGuild = useCallback(
    async (
      targetUid: string,
      targetName: string,
      targetGuildName?: string | null
    ) => {
      const activeGuild = playerGuildRef.current;
      if (!activeGuild) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          '[Guilda] Você precisa ser Líder ou Sub-Líder de uma Guilda para convidar jogadores.',
          { tone: 'warning' }
        );
        return;
      }
      const res = await sendGuildInvite({
        guild: activeGuild,
        actorUid,
        actorName: runtimeMetaRef.current.tamerName,
        targetUid,
        targetName,
        targetGuildName,
      });
      playDigitalTone(res.ok ? 'confirm' : 'error', soundEnabled);
      pushChatMessage('system', `[Guilda] ${res.message}`, {
        tone: res.ok ? 'info' : 'warning',
      });
    },
    [actorUid, pushChatMessage, soundEnabled]
  );

  const handleAcceptGuildInvite = useCallback(
    async (invite: GuildInviteRecord) => {
      const acc = hudAccountRef.current;
      const res = await acceptGuildInvite({
        invite,
        actorUid,
        tamerName: runtimeMetaRef.current.tamerName,
        tamerLevel: acc.tamer.level,
        characterId: selection.characterId,
        tamerPhotoUrl: acc.tamerPhotoUrl ?? null,
        digimonFormId: activeFormRef.current.id,
        currentGuild: playerGuildRef.current,
      });
      playDigitalTone(res.ok ? 'confirm' : 'error', soundEnabled);
      pushChatMessage('system', `[Guilda] ${res.message}`, {
        tone: res.ok ? 'level' : 'warning',
      });
    },
    [actorUid, pushChatMessage, soundEnabled]
  );

  const handleDeclineGuildInvite = useCallback(
    async (inviteId: string) => {
      playDigitalTone('click', soundEnabled);
      await declineGuildInvite(inviteId);
    },
    [soundEnabled]
  );

  const handleOpenCharacterWindow = useCallback(() => {
    handleOpenHudWindow('character');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const sanitizedPartyDigimons = useMemo(
    () => sanitizePartyDigimons(hudAccount.partyDigimons),
    [hudAccount.partyDigimons]
  );

  const onlinePlayerUids = useMemo(
    () => [actorUid, ...remotePlayers.map((p) => p.uid)],
    [actorUid, remotePlayers]
  );

  const onlineDigimonByUid = useMemo(
    () => ({
      ...Object.fromEntries(remotePlayers.map((p) => [p.uid, p.digimonFormId])),
      [actorUid]: activeFormProfile.id,
    }),
    [actorUid, remotePlayers, activeFormProfile.id]
  );

  const onlineCharacterByUid = useMemo(
    () => ({
      ...Object.fromEntries(remotePlayers.map((p) => [p.uid, p.characterId])),
      [actorUid]: character.id,
    }),
    [actorUid, remotePlayers, character.id]
  );

  function travelToMap(targetMap: ActiveWorldMapId) {
    const sim = simRef.current;
    setActiveStationModal(null);
    setPendingPortalConfirm(null);
    pendingPortalWalkRef.current = false;
    pendingConductorWalkRef.current = false;
    pendingTargetPortalRef.current = null;
    nearbyPortalRef.current = null;
    sim.tapTarget = null;
    sim.keyOrder = [];
    sim.combatEffects = [];
    sim.bossAoeEffects = [];
    sim.floatingTexts = [];
    sim.eggDropFx = [];
    sim.activeSkillBanner = null;
    sim.skillBannerTimer = 0;

    if (targetMap === VIRTUAL_WORLD_MAP_ID) {
      void preloadWildDigimonSpritesForMap(VIRTUAL_WORLD_MAP_ID);
      sim.mapId = VIRTUAL_WORLD_MAP_ID;
      sim.x = VIRTUAL_WORLD_SPAWN_POINT.x;
      sim.y = VIRTUAL_WORLD_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = VIRTUAL_WORLD_SPAWN_POINT.facingDir;
      sim.enemies = createInitialVirtualWorldMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        VIRTUAL_WORLD_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou ao Mundo Virtual (Nv. 70–80)! Explore o Bosque Violeta, o Circuito Oeste, a Cascata de Dados, o Portal Cristalino e o Núcleo Central para enfrentar os Megas HiAndromon, SaberLeomon, HerculesKabuterimon, MetalGarurumon e WarGreymon!',
        { tone: 'info' }
      );
    } else if (targetMap === DARK_AREA_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DARK_AREA_MAP_ID);
      sim.mapId = DARK_AREA_MAP_ID;
      sim.x = DARK_AREA_SPAWN_POINT.x;
      sim.y = DARK_AREA_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DARK_AREA_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDarkAreaMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DARK_AREA_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou à Área Sombria (Nv. 60–70)! Explore a Ponte Abissal, a Torre Acorrentada, as Cascatas Violetas e a Cidadela Sombria para enfrentar os Megas MetalEtemon, Boltmon, GranKuwagamon, Beelzemon e Diaboromon!',
        { tone: 'info' }
      );
    } else if (targetMap === DIGIMON_ISLAND_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGIMON_ISLAND_MAP_ID);
      sim.mapId = DIGIMON_ISLAND_MAP_ID;
      sim.x = DIGIMON_ISLAND_SPAWN_POINT.x;
      sim.y = DIGIMON_ISLAND_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DIGIMON_ISLAND_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDigimonIslandMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DIGIMON_ISLAND_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou à Ilha dos Digimons (Nv. 50–60)! Explore o Santuário Angelical, a Cratera Violeta, o Portão Ígneo e a Cidadela Cristalina para enfrentar os Megas MetalGarurumon, Sakuyamon, Gryphonmon, Dukemon e Griffomon!',
        { tone: 'info' }
      );
    } else if (targetMap === DATA_SEA_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DATA_SEA_MAP_ID);
      sim.mapId = DATA_SEA_MAP_ID;
      sim.x = DATA_SEA_SPAWN_POINT.x;
      sim.y = DATA_SEA_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DATA_SEA_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDataSeaMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DATA_SEA_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou ao Mar de Dados (Nv. 40–50)! Explore as praias, o farol oeste, a gruta roxa e o Castelo Cristalino para enfrentar os Ultimates MetalGreymon, Giromon, Garudamon, SkullSatamon e Okuwamon!',
        { tone: 'info' }
      );
    } else if (targetMap === DIGITAL_DESERT_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGITAL_DESERT_MAP_ID);
      sim.mapId = DIGITAL_DESERT_MAP_ID;
      sim.x = DIGITAL_DESERT_SPAWN_POINT.x;
      sim.y = DIGITAL_DESERT_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DIGITAL_DESERT_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDigitalDesertMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DIGITAL_DESERT_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou ao Deserto Digital (Nv. 30–40)! Atravesse as pontes até a Grande Pirâmide, Caverna Violeta e Fóssil Ancestral para enfrentar os Ultimates IceLeomon, Insekimon, SkullMeramon, Cyberdramon e WarGrowlmon!',
        { tone: 'info' }
      );
    } else if (targetMap === DIGI_MOUNTAIN_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGI_MOUNTAIN_MAP_ID);
      sim.mapId = DIGI_MOUNTAIN_MAP_ID;
      sim.x = DIGI_MOUNTAIN_SPAWN_POINT.x;
      sim.y = DIGI_MOUNTAIN_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y;
      sim.dir = DIGI_MOUNTAIN_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDigiMountainMonsters();
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DIGI_MOUNTAIN_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou à Montanha Digi 3D (Nv. 20–30)! Arraste a tela para girar a câmera 3D, atravesse pontes até a Fortaleza Tecnológica e a Caverna de Cristais Roxos, e enfrente Meramon, Digmon, Kabuterimon, Chrysalimon e Veedramon!',
        { tone: 'info' }
      );
    } else if (targetMap === DATA_FOREST_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DATA_FOREST_MAP_ID);
      sim.mapId = DATA_FOREST_MAP_ID;
      sim.x = DATA_FOREST_SPAWN_POINT.x;
      sim.y = DATA_FOREST_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DATA_FOREST_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDataForestMonsters();
      if (worldBossRef.current) {
        const bossEnemy = sim.enemies.find(
          (e) => e.isBoss && e.bossId === KUWAGAMON_BOSS_ID
        );
        if (bossEnemy) {
          bossEnemy.hp = worldBossRef.current.hp;
          bossEnemy.maxHp = worldBossRef.current.maxHp;
          bossEnemy.alive = worldBossRef.current.alive;
        }
      }
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DATA_FOREST_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou à Floresta de Dados (Nv. 10–20)! Atravesse as pontes para caçar Impmon, Renamon, Guilmon, Garurumon, Greymon (com drop de DigiEggs) e o Raid Boss Kuwagamon na Grande Árvore!',
        { tone: 'info' }
      );
    } else if (targetMap === HUNTING_MAP_ID) {
      void preloadWildDigimonSpritesForMap(HUNTING_MAP_ID);
      sim.mapId = HUNTING_MAP_ID;
      sim.x = HUNTING_SPAWN_POINT.x;
      sim.y = HUNTING_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = 'S';
      sim.enemies = createInitialWildMonsters();
      sim.partner = createInitialPartnerRuntime(sim.x, sim.y, 'S');
      pushChatMessage(
        'system',
        'Você chegou à Planície Digital (Nv. 1–10)! Caçe Drimogemon, Gotsumon, Kiwimon, Hawkmon e Monodramon para dropar DATA e DigiEggs Mercenários.',
        { tone: 'info' }
      );
    } else if (targetMap === D_TERMINAL_MAP_ID) {
      sim.mapId = D_TERMINAL_MAP_ID;
      sim.x = D_TERMINAL_SPAWN_POINT.x;
      sim.y = D_TERMINAL_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = D_TERMINAL_SPAWN_POINT.facingDir;
      sim.enemies = [];
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        D_TERMINAL_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou ao D-Terminal (Estação Trailmon)! Fale com o Condutor PawnChessmon (Black) em frente ao trem para escolher seu destino no Mundo Digital.',
        { tone: 'info' }
      );
    } else {
      sim.mapId = DATS_MAP_ID;
      sim.x = 800;
      sim.y = 1230;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = 'N';
      sim.enemies = [];
      sim.partner = createInitialPartnerRuntime(sim.x, sim.y, 'N');
      pushChatMessage(
        'system',
        'Retornou ao DATS Center (Zona Segura). Recuperação de HP/DS ativa.',
        { tone: 'info' }
      );
    }

    // Preload sprites & snap positions for players already waiting in the destination map + channel
    const preloaded = preloadedRemoteAssetsRef.current;
    const myCh = currentChannelRef.current;
    for (const smooth of remoteSmoothRef.current.values()) {
      if (smooth.player.mapId === sim.mapId && smooth.player.channelId === myCh) {
        const tamerKey = `t:${smooth.player.characterId}`;
        if (!preloaded.has(tamerKey)) {
          preloaded.add(tamerKey);
          void preloadTamerSheets(smooth.player.characterId);
        }
        const digiKey = `d:${smooth.player.digimonFormId}`;
        if (!preloaded.has(digiKey)) {
          preloaded.add(digiKey);
          void preloadDigimonPartnerAssets(smooth.player.digimonFormId);
        }
        smooth.renderX = smooth.player.worldX;
        smooth.renderY = smooth.player.worldY;
        smooth.targetX = smooth.player.worldX;
        smooth.targetY = smooth.player.worldY;
        smooth.partnerRenderX = smooth.player.partnerX;
        smooth.partnerRenderY = smooth.player.partnerY;
        smooth.partnerTargetX = smooth.player.partnerX;
        smooth.partnerTargetY = smooth.player.partnerY;
        smooth.activeAttack = null;
        if (smooth.player.combatSeq > 0) {
          seenRemoteCombatSeqRef.current.set(
            smooth.player.uid,
            smooth.player.combatSeq
          );
          applyRemoteCombatSnapshot(smooth, smooth.player, {
            initialHydration: true,
          });
        }
      }
    }

    setLiveSnapshot((prev) => ({
      ...prev,
      mapId: sim.mapId,
      tamerX: sim.x,
      tamerY: sim.y,
      tamerDir: sim.dir,
      partnerX: sim.partner.x,
      partnerY: sim.partner.y,
      inSafeZone: isPointInMapSafeZone(sim.mapId, sim.x, sim.y),
      targetEnemy: null,
      nearbyPointId: null,
      nearReturnPortal: false,
    }));

    // Immediately sync the new map & channel to active Party so shared EXP activates with zero delay
    const activePartyNow = playerPartyRef.current;
    if (activePartyNow) {
      const accNow = hudAccountRef.current;
      const formNow = activeFormRef.current;
      void syncLocalMemberInParty(activePartyNow.partyId, {
        uid: actorUid,
        tamerName: runtimeMetaRef.current.tamerName,
        characterId: selection.characterId,
        tamerLevel: accNow.tamer.level,
        tamerPhotoUrl: accNow.tamerPhotoUrl ?? null,
        digimonFormId: formNow.id,
        digimonName: accNow.digimon.nickname?.trim() || formNow.name,
        digimonLevel: accNow.digimon.level,
        hp: accNow.digimon.hp,
        maxHp: accNow.digimon.maxHp,
        mapId: sim.mapId,
        channelId: currentChannelRef.current,
      });
    }

    persistProgress();
    playDigitalTone('confirm', soundEnabled);
  }

  function attemptPortalTravel(portal: MapPortalLink) {
    const account = hudAccountRef.current;
    const unlocked =
      isGM ||
      portal.minLevel <= 1 ||
      account.tamer.level >= portal.minLevel ||
      account.digimon.level >= portal.minLevel;
    if (!unlocked) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage(
        'system',
        `O portal para ${portal.title} exige Tamer ou Digimon nível ${portal.minLevel}+.`,
        { tone: 'warning' }
      );
      return;
    }
    const sim = simRef.current;
    pendingPortalWalkRef.current = false;
    pendingTargetPortalRef.current = null;
    sim.tapTarget = null;
    sim.keyOrder = [];
    sim.joyVx = 0;
    sim.joyVy = 0;
    sim.joyMag = 0;
    playDigitalTone('click', soundEnabled);
    setPendingPortalConfirm(portal);
  }

  function handleMeetPlayer(target: RemoteWorldPlayer) {
    const sim = simRef.current;
    const { worldW, worldH, minY } = getMapDimensions(target.mapId);

    if (sim.mapId !== target.mapId) {
      travelToMap(target.mapId);
    }

    if (currentChannelRef.current !== target.channelId) {
      currentChannelRef.current = target.channelId;
      setActiveChannelId(target.channelId);
      try {
        localStorage.setItem('dw_active_channel_v1', String(target.channelId));
      } catch {
        // Ignore storage error
      }
    }

    // Place smoothly right next to the target player (offset by 52px horizontally so sprites never overlap)
    const desiredX = Math.max(64, Math.min(worldW - 64, target.worldX + 52));
    const desiredY = Math.max(minY, Math.min(worldH - 64, target.worldY));
    sim.x = desiredX;
    sim.y = desiredY;
    sim.camX = desiredX;
    sim.camY = desiredY - 56;
    sim.tapTarget = null;
    sim.dir = 'W';
    sim.partner = createInitialPartnerRuntime(desiredX, desiredY, 'W');

    // Preload sprites for players in the target map & channel so they render immediately
    const preloaded = preloadedRemoteAssetsRef.current;
    for (const smooth of remoteSmoothRef.current.values()) {
      if (
        smooth.player.mapId === target.mapId &&
        smooth.player.channelId === target.channelId
      ) {
        const tamerKey = `t:${smooth.player.characterId}`;
        if (!preloaded.has(tamerKey)) {
          preloaded.add(tamerKey);
          void preloadTamerSheets(smooth.player.characterId);
        }
        const digiKey = `d:${smooth.player.digimonFormId}`;
        if (!preloaded.has(digiKey)) {
          preloaded.add(digiKey);
          void preloadDigimonPartnerAssets(smooth.player.digimonFormId);
        }
        smooth.renderX = smooth.player.worldX;
        smooth.renderY = smooth.player.worldY;
        smooth.targetX = smooth.player.worldX;
        smooth.targetY = smooth.player.worldY;
        smooth.partnerRenderX = smooth.player.partnerX;
        smooth.partnerRenderY = smooth.player.partnerY;
        smooth.partnerTargetX = smooth.player.partnerX;
        smooth.partnerTargetY = smooth.player.partnerY;
      }
    }

    pushChatMessage(
      'system',
      `Você se encontrou com ${target.isGm ? '[GM] ' : ''}${target.tamerName} (CH ${target.channelId})!`,
      { tone: 'info' }
    );
    persistProgress();
    void publishLocalWorldPresence(buildLocalPresenceSnapshot());
    playDigitalTone('confirm', soundEnabled);
  }

  function openNearbyStation() {
    const sim = simRef.current;
    if (nearbyPortalRef.current) {
      attemptPortalTravel(nearbyPortalRef.current);
      return;
    }

    const ptId = sim.nearbyPointId;
    if (!ptId) return;
    const activePoints =
      sim.mapId === VIRTUAL_WORLD_MAP_ID
        ? VIRTUAL_WORLD_INTERACTION_POINTS
        : sim.mapId === DARK_AREA_MAP_ID
          ? DARK_AREA_INTERACTION_POINTS
          : sim.mapId === DIGIMON_ISLAND_MAP_ID
            ? DIGIMON_ISLAND_INTERACTION_POINTS
            : sim.mapId === DATA_SEA_MAP_ID
              ? DATA_SEA_INTERACTION_POINTS
              : sim.mapId === DIGITAL_DESERT_MAP_ID
                ? DIGITAL_DESERT_INTERACTION_POINTS
                : sim.mapId === DIGI_MOUNTAIN_MAP_ID
                  ? DIGI_MOUNTAIN_INTERACTION_POINTS
                  : sim.mapId === DATA_FOREST_MAP_ID
                    ? DATA_FOREST_INTERACTION_POINTS
                    : sim.mapId === HUNTING_MAP_ID
                      ? HUNTING_INTERACTION_POINTS
                      : sim.mapId === D_TERMINAL_MAP_ID
                        ? D_TERMINAL_INTERACTION_POINTS
                        : DATS_INTERACTION_POINTS;
    const found = activePoints.find((p) => p.id === ptId);
    if (!found) return;
    if (!sim.discoveredZones.has(found.id)) {
      sim.discoveredZones.add(found.id);
    }
    persistProgress();
    if (found.id === 'digital-world-portal') {
      attemptPortalTravel(DATS_SOUTH_PORTAL_LINK);
      return;
    }
    playDigitalTone('confirm', soundEnabled);
    if (found.id === DATS_INCUBATOR_STATION.id) {
      pendingIncubatorWalkRef.current = false;
      pendingArchiveWalkRef.current = false;
      pendingPortalWalkRef.current = false;
      pendingConductorWalkRef.current = false;
      pendingTargetPortalRef.current = null;
      pendingDatsPointIdRef.current = null;
      sim.tapTarget = null;
      sim.keyOrder = [];
      setActiveStationModal(null);
      setActiveHudWindow('incubator');
      return;
    }
    if (found.id === DATS_ARCHIVE_STATION.id) {
      pendingIncubatorWalkRef.current = false;
      pendingArchiveWalkRef.current = false;
      pendingPortalWalkRef.current = false;
      pendingConductorWalkRef.current = false;
      pendingTargetPortalRef.current = null;
      pendingDatsPointIdRef.current = null;
      sim.tapTarget = null;
      sim.keyOrder = [];
      setActiveStationModal(null);
      setActiveHudWindow('archive');
      return;
    }
    if (found.id === 'dats-mudfrigimon-npc') {
      sim.tapTarget = null;
      sim.keyOrder = [];
      setActiveStationModal(null);
      setActiveNpcDialogue(null);
      setPlayerMarketOpen(false);
      setMudfrigimonShopOpen(true);
      return;
    }
    if (found.id === 'dats-player-market-npc') {
      sim.tapTarget = null;
      sim.keyOrder = [];
      setActiveStationModal(null);
      setActiveNpcDialogue(null);
      setMudfrigimonShopOpen(false);
      setPlayerMarketOpen(true);
      return;
    }
    setActiveStationModal(found);
  }

  const handleTriggerManualSkill = useCallback(
    (kind: 'special1' | 'special2') => {
      const sim = simRef.current;
      const isCombat = isCombatWorldMap(sim.mapId);
      const inSafeZone = isPointInMapSafeZone(sim.mapId, sim.x, sim.y);
      const currentForm = activeFormRef.current;
      const skillSpec = getDmoSkillSpec(
        currentForm.id,
        kind === 'special1' ? 'f1' : 'f2'
      );
      const dsCost = skillSpec.dsCost;
      const skillName = skillSpec.name;
      const cooldownSec = skillSpec.cooldownSec;
      const currentStats = hudAccountRef.current;

      const result = triggerPartnerManualSkill(sim.partner, {
        kind,
        tamerX: sim.x,
        tamerY: sim.y,
        isCombatMap: isCombat,
        isInSafeZone: inSafeZone,
        enemies: isCombat ? sim.enemies : [],
        hasEnoughDs: currentStats.digimon.ds >= dsCost,
        cooldownSec,
        snapDir: (dx, dy) => snapToCardinalVector(dx, dy).dir,
        onConsumeDs: () => {
          const nextAccount: AccountHudPersistence = {
            ...hudAccountRef.current,
            digimon: {
              ...hudAccountRef.current.digimon,
              ds: Math.max(0, hudAccountRef.current.digimon.ds - dsCost),
            },
          };
          hudAccountRef.current = nextAccount;
          setHudAccount(nextAccount);
        },
      });

      if (result.ok) {
        playDigitalTone('confirm', soundEnabled);
        sim.activeSkillBanner = `${skillName}!`;
        sim.skillBannerTimer = 1.0;
        return;
      }

      playDigitalTone('error', soundEnabled);
      const reasonMap: Record<
        'safe-zone' | 'cooldown' | 'low-ds' | 'no-target' | 'out-of-range' | 'busy',
        string
      > = {
        'safe-zone': 'Habilidades de ataque não podem ser usadas na Zona Segura.',
        cooldown: `${skillName} ainda está em recarga.`,
        'low-ds': `DS insuficiente para ${skillName} (${dsCost} DS necessários).`,
        'no-target': 'Clique em um Digimon inimigo para atacar antes de usar a habilidade.',
        'out-of-range': `${currentForm.name} está indo até o alvo clicado para usar ${skillName}.`,
        busy: `${currentForm.name} já está executando um ataque.`,
      };
      pushChatMessage('system', reasonMap[result.reason], { tone: 'warning' });
    },
    [pushChatMessage, soundEnabled]
  );

  const handleTriggerEvolution = useCallback(
    (targetFormOrId: DigimonFormId | DigimonFormProfile) => {
      const targetId: DigimonFormId =
        typeof targetFormOrId === 'string' ? targetFormOrId : targetFormOrId.id;
      const currentAcc = hudAccountRef.current;
      const currentStarterId = activeStarterIdRef.current;
      const currentForm = resolveActiveFormProfile(
        currentStarterId,
        currentAcc.digimon.activeFormId
      );
      const res = evolveDigimonAccountState(
        currentAcc,
        currentStarterId,
        targetId
      );
      if (res.needsEvoluter) {
        playDigitalTone('click', soundEnabled);
        setEvolutionUnlockAlert(null);
        setEvoluterUnlockFormId(targetId);
        return;
      }
      if (res.error || !res.evolvedForm) {
        playDigitalTone('error', soundEnabled);
        if (res.error) {
          pushChatMessage('system', res.error, { tone: 'warning' });
        }
        return;
      }

      const targetForm = res.evolvedForm;
      if (targetForm.id === currentForm.id) return;

      void preloadDigimonPartnerAssets(targetForm.id);
      commitHudAccount(res.next);
      setEvolutionUnlockAlert(null);

      const isUpgrade = targetForm.unlockLevel > currentForm.unlockLevel;
      playInWorldDigivolutionSound(soundEnabled, isUpgrade);

      simRef.current.evoAnim = {
        fromFormId: currentForm.id,
        toFormId: targetForm.id,
        accentHex: targetForm.theme.accentHex,
        glowRgba: targetForm.theme.glowRgba,
        elapsed: 0,
        duration: isUpgrade ? 1.9 : 0.9,
        isUpgrade,
        swapPoint: isUpgrade ? 0.56 : 0.45,
      };
      simRef.current.evoFlashTimer = 0;

      if (isUpgrade) {
        if (activeHudWindowRef.current === 'digimon') {
          setActiveHudWindow(null);
        }
        pushChatMessage(
          'system',
          `DIGIEVOLUÇÃO! ${currentForm.name} evoluiu para ${targetForm.name} (${targetForm.stage})!`,
          { tone: 'level' }
        );
      } else {
        pushChatMessage(
          'system',
          `Forma alternada para ${targetForm.name} (${targetForm.stage}).`,
          { tone: 'info' }
        );
      }
    },
    [pushChatMessage, soundEnabled]
  );

  const handleConfirmUnlockEvolution = useCallback(
    (targetFormId: DigimonFormId, evolveImmediately = true) => {
      const currentAcc = hudAccountRef.current;
      const res = unlockDigimonEvolutionWithEvoluters(
        currentAcc,
        activeStarterIdRef.current,
        targetFormId
      );
      if (!res.ok || !res.unlockedForm) {
        playDigitalTone('error', soundEnabled);
        if (res.error) {
          pushChatMessage('system', res.error, { tone: 'warning' });
        }
        return;
      }

      commitHudAccount(res.next);
      setEvoluterUnlockFormId(null);
      setEvolutionUnlockAlert(null);
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `EVOLUTER ATIVADO! ${res.unlockedForm.name} (${res.unlockedForm.stage}) foi desbloqueado permanentemente (-${res.spentEvoluters} Evoluter${res.spentEvoluters > 1 ? 's' : ''})!`,
        { tone: 'level' }
      );
      pushNotification(
        `Evolução Liberada: ${res.unlockedForm.name}!`,
        `Você consumiu ${res.spentEvoluters} Evoluter${res.spentEvoluters > 1 ? 's' : ''} e liberou ${res.unlockedForm.name} permanentemente.`
      );

      if (evolveImmediately) {
        handleTriggerEvolution(targetFormId);
      }
    },
    [
      handleTriggerEvolution,
      pushChatMessage,
      pushNotification,
      soundEnabled,
    ]
  );

  const handleAdminSetDigimonLevel = useCallback(
    (targetLevel: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const currentStarterId = activeStarterIdRef.current;
      const res = setDigimonLevelForTesting(
        prevAcc.digimon,
        currentStarterId,
        targetLevel
      );
      const nextForm = resolveActiveFormProfile(
        currentStarterId,
        res.next.activeFormId
      );
      commitHudAccount({
        ...prevAcc,
        digimon: res.next,
        updatedAt: new Date().toISOString(),
      });
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Nível de ${nextForm.name} ajustado para Nv. ${res.next.level}.`,
        { tone: 'level' }
      );
      if (res.revertedForm) {
        setEvolutionUnlockAlert(null);
        pushChatMessage(
          'system',
          `[GM] Forma ajustada para ${nextForm.name} compatível com o Nv. ${res.next.level}.`,
          { tone: 'info' }
        );
      }
      if (res.newlyUnlockedForms.length > 0) {
        for (const unlocked of res.newlyUnlockedForms) {
          const evoCost = getFormEvoluterCost(
            currentStarterId,
            unlocked.id
          );
          const needsEvoUnlock =
            evoCost > 0 &&
            !isEvolutionSlotUnlockedByEvoluter(
              currentStarterId,
              unlocked.id,
              res.next
            );
          setEvolutionUnlockAlert(unlocked);
          pushChatMessage(
            'system',
            needsEvoUnlock
              ? `EVOLUÇÃO DISPONÍVEL! ${nextForm.name} atingiu o Nível ${unlocked.unlockLevel}! Use ${evoCost} Evoluters para desbloquear ${unlocked.name}!`
              : `EVOLUÇÃO DESBLOQUEADA! ${nextForm.name} atingiu o Nível ${unlocked.unlockLevel} e pode evoluir para ${unlocked.name}!`,
            { tone: 'level' }
          );
          pushNotification(
            needsEvoUnlock
              ? `Desbloqueie ${unlocked.name}!`
              : 'Evolução Desbloqueada!',
            needsEvoUnlock
              ? `${nextForm.name} atingiu o Nv. ${unlocked.unlockLevel} e requer ${evoCost} Evoluters para liberar ${unlocked.name}.`
              : `${nextForm.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
          );
        }
      }
    },
    [isGM, pushChatMessage, pushNotification, soundEnabled]
  );

  const handleAdminAddDigimonExp = useCallback(
    (expAmount: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const currentStarterId = activeStarterIdRef.current;
      const res = applyExpToDigimon(
        prevAcc.digimon,
        expAmount,
        currentStarterId
      );
      const activeFormNow = resolveActiveFormProfile(
        currentStarterId,
        res.next.activeFormId
      );
      commitHudAccount({
        ...prevAcc,
        digimon: res.next,
        updatedAt: new Date().toISOString(),
      });
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] +${expAmount} EXP adicionados para ${activeFormNow.name} (Nv. ${res.next.level}).`,
        { tone: 'loot' }
      );
      if (res.newlyUnlockedForms.length > 0) {
        for (const unlocked of res.newlyUnlockedForms) {
          const evoCost = getFormEvoluterCost(
            currentStarterId,
            unlocked.id
          );
          const needsEvoUnlock =
            evoCost > 0 &&
            !isEvolutionSlotUnlockedByEvoluter(
              currentStarterId,
              unlocked.id,
              res.next
            );
          setEvolutionUnlockAlert(unlocked);
          pushChatMessage(
            'system',
            needsEvoUnlock
              ? `EVOLUÇÃO DISPONÍVEL! ${activeFormNow.name} atingiu o Nível ${unlocked.unlockLevel}! Use ${evoCost} Evoluters para desbloquear ${unlocked.name}!`
              : `EVOLUÇÃO DESBLOQUEADA! ${activeFormNow.name} atingiu o Nível ${unlocked.unlockLevel} e pode evoluir para ${unlocked.name}!`,
            { tone: 'level' }
          );
          pushNotification(
            needsEvoUnlock
              ? `Desbloqueie ${unlocked.name}!`
              : 'Evolução Desbloqueada!',
            needsEvoUnlock
              ? `${activeFormNow.name} atingiu o Nv. ${unlocked.unlockLevel} e requer ${evoCost} Evoluters para liberar ${unlocked.name}.`
              : `${activeFormNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
          );
        }
      }
    },
    [isGM, pushChatMessage, pushNotification, soundEnabled]
  );

  const handleAdminRestoreVitals = useCallback(() => {
    if (!isGM) return;
    const prevAcc = hudAccountRef.current;
    const tamerAttrs = computeTamerAttributes(prevAcc.tamer, prevAcc.equippedItems);
    commitHudAccount({
      ...prevAcc,
      tamer: {
        ...prevAcc.tamer,
        maxHp: tamerAttrs.maxHp,
        maxDs: tamerAttrs.maxDs,
        hp: tamerAttrs.maxHp,
        ds: tamerAttrs.maxDs,
      },
      digimon: {
        ...prevAcc.digimon,
        hp: prevAcc.digimon.maxHp,
        ds: prevAcc.digimon.maxDs,
      },
      updatedAt: new Date().toISOString(),
    });
    simRef.current.partner.special1Cooldown = 0;
    simRef.current.partner.special2Cooldown = 0;
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage(
      'system',
      '[GM] HP, DS e tempos de recarga restaurados para 100%.',
      { tone: 'info' }
    );
  }, [isGM, pushChatMessage, soundEnabled]);

  const handleAdminPullAnyDigimon = useCallback(
    (
      formId: DigimonFormId,
      grade: HatchQualityGrade,
      preferredStarterId?: StarterDigimonId
    ) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const switched = switchActiveDigimonForAdmin(
        prevAcc,
        formId,
        grade,
        undefined,
        undefined,
        preferredStarterId
      );
      const resolvedStarterId = resolveStarterIdForForm(
        preferredStarterId,
        switched.form.id
      );
      void preloadDigimonPartnerAssets(formId);
      if (resolvedStarterId !== starterDigimon.digimonId) {
        onAdminSwitchStarter?.(resolvedStarterId);
      }
      commitHudAccount(switched.next);
      setEvolutionUnlockAlert(null);
      simRef.current.partner.special1Cooldown = 0;
      simRef.current.partner.special2Cooldown = 0;
      simRef.current.evoFlashTimer = 1.05;
      playDigitalTone('confirm', soundEnabled);
      const qProf = getHatchQualityProfile(switched.grade);
      pushChatMessage(
        'system',
        `[GM] Digimon alterado para ${switched.form.name} (${switched.form.stage} · Nv.${switched.next.digimon.level} · ${qProf.label} · Qualidade ${switched.sizePct}%).`,
        { tone: 'level' }
      );
    },
    [isGM, onAdminSwitchStarter, pushChatMessage, soundEnabled, starterDigimon.digimonId]
  );

  const handleAdminAddDigimonToParty = useCallback(
    (
      formId: DigimonFormId,
      grade: HatchQualityGrade,
      preferredStarterId?: StarterDigimonId
    ) => {
      if (!isGM) return;
      const res = addDigimonToPartyReserve(
        hudAccountRef.current,
        formId,
        grade,
        undefined,
        preferredStarterId
      );
      if (!res.ok || !res.entry) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage('system', `[GM] ${res.error ?? 'Não foi possível adicionar à equipe.'}`, {
          tone: 'warning',
        });
        return;
      }
      void preloadDigimonPartnerAssets(formId);
      commitHudAccount(res.next);
      playDigitalTone('confirm', soundEnabled);
      const form = getDigimonFormProfile(formId);
      const qProf = getHatchQualityProfile(res.entry.hatchGrade);
      pushChatMessage(
        'system',
        `[GM] ${form.name} (${form.stage} · Nv.${res.entry.level} · ${qProf.label}) adicionado ao Círculo Reserva ${res.entry.slotIndex + 2} da equipe!`,
        { tone: 'level' }
      );
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminAddDigimonToArchive = useCallback(
    (
      formId: DigimonFormId,
      grade: HatchQualityGrade,
      preferredStarterId?: StarterDigimonId
    ) => {
      if (!isGM) return;
      const res = addDigimonToArchiveForAdmin(
        hudAccountRef.current,
        formId,
        grade,
        undefined,
        preferredStarterId
      );
      if (!res.ok || !res.entry) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `[GM] ${res.error ?? 'Não foi possível guardar no Digimon Archive.'}`,
          { tone: 'warning' }
        );
        return;
      }
      void preloadDigimonPartnerAssets(formId);
      commitHudAccount(res.next);
      playDigitalTone('confirm', soundEnabled);
      const form = getDigimonFormProfile(formId);
      const qProf = getHatchQualityProfile(res.entry.hatchGrade);
      pushChatMessage(
        'system',
        `[GM] ${form.name} (${form.stage} · Nv.${res.entry.level} · ${qProf.label}) puxado para o Slot #${res.entry.slotIndex + 1} do Digimon Archive!`,
        { tone: 'level' }
      );
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminUnlockArchiveSlots = useCallback(
    (targetUnlockedSlots: number) => {
      if (!isGM) return;
      const res = unlockArchiveSlotsForAdmin(
        hudAccountRef.current,
        targetUnlockedSlots
      );
      commitHudAccount(res.next, true);
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Digimon Archive expandido para ${res.unlockedSlots}/50 slots liberados!`,
        { tone: 'level' }
      );
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminSimulateEggDrop = useCallback(
    (eggItemKey: string, sourceName: string, isBoss = false) => {
      if (!isGM) return;
      const payload = createInventoryPayloadFromCatalog(eggItemKey, 1);
      if (!payload) return;

      const prevAcc = hudAccountRef.current;
      const unlockedSlots = getUnlockedInventorySlots(prevAcc);
      const addRes = addInventoryItem(prevAcc.inventory, payload, unlockedSlots);
      if (addRes.added) {
        commitHudAccount(
          {
            ...prevAcc,
            inventory: addRes.next,
            updatedAt: new Date().toISOString(),
          },
          true
        );
      }

      const simulatedReward: RolledDropReward = {
        itemKey: payload.itemKey,
        name: payload.name,
        quantity: 1,
        iconUrl: payload.iconUrl,
        rarity: payload.rarity ?? 'comum',
        category: payload.category,
        payload,
      };

      // Close GM modal so the GM watches the live drop beam, comet, alert banner & toast on the map
      setActiveHudWindow(null);

      const sim = simRef.current;
      const dropX = sim.x + 68;
      const dropY = sim.y - 16;

      spawnDigiEggDropAnimations([simulatedReward], dropX, dropY, {
        sourceName,
        isBoss,
        inventoryWasFull: !addRes.added,
      });
      pushDropRewardToasts([simulatedReward], sourceName);
      pushNotification(
        isBoss ? 'Drop de Boss Raid!' : 'DigiEgg Dropado!',
        `${payload.name} obtido de ${sourceName}${addRes.added ? ' e guardado no Inventário.' : ' (mochila cheia — simulação visual).'}`
      );
      pushChatMessage(
        'system',
        `[DIGIEGG] ★ ${payload.name} dropou de ${sourceName}!${
          addRes.added
            ? ' Enviado ao Inventário.'
            : ' (Mochila cheia — apenas visualização GM).'
        }`,
        { tone: 'loot' }
      );
    },
    [
      isGM,
      pushChatMessage,
      pushDropRewardToasts,
      pushNotification,
      spawnDigiEggDropAnimations,
    ]
  );

  const handleAdminSetHatchGrade = useCallback(
    (grade: HatchQualityGrade) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const currentForm = resolveActiveFormProfile(
        activeStarterIdRef.current,
        prevAcc.digimon.activeFormId
      );
      const qProf = getHatchQualityProfile(grade);
      const rolledSizePct = rollHatchSizePct(qProf.grade);
      const nextMaxHp = calcDigimonMaxHp(
        prevAcc.digimon.level,
        currentForm.id,
        qProf.grade,
        rolledSizePct
      );
      const nextMaxDs = calcDigimonMaxDs(
        prevAcc.digimon.level,
        currentForm.id,
        qProf.grade,
        rolledSizePct
      );
      commitHudAccount({
        ...prevAcc,
        digimon: {
          ...prevAcc.digimon,
          hatchGrade: qProf.grade,
          hatchSizePct: rolledSizePct,
          maxHp: nextMaxHp,
          maxDs: nextMaxDs,
          hp: nextMaxHp,
          ds: nextMaxDs,
        },
        updatedAt: new Date().toISOString(),
      });
      playDigitalTone('confirm', soundEnabled);
      const bonusLabel =
        qProf.powerBonusPct > 0 ? `+${qProf.powerBonusPct}% poder` : 'Normal';
      pushChatMessage(
        'system',
        `[GM] Qualidade de ${currentForm.name} alterada para ${qProf.label} (${bonusLabel} · Qualidade ${rolledSizePct}%).`,
        { tone: 'info' }
      );
    },
    [isGM, pushChatMessage, soundEnabled, starterDigimon.digimonId]
  );

  const handleAdminGrantItem = useCallback(
    (itemKey: string, quantity: number, eggHatchLevel?: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      let payload = createInventoryPayloadFromCatalog(itemKey, quantity);
      if (!payload) {
        const shopTpl = BASIC_BITS_SHOP_ITEMS.find((b) => b.itemKey === itemKey);
        if (!shopTpl) return;
        payload = {
          itemKey: shopTpl.itemKey,
          name: shopTpl.name,
          category: shopTpl.category,
          quantity: Math.max(1, Math.round(quantity)),
          description: shopTpl.description,
          hpRestore: shopTpl.hpRestore,
          dsRestore: shopTpl.dsRestore,
          equipSlot: shopTpl.equipSlot,
          statBonuses: shopTpl.statBonuses,
        };
      } else if (payload.eggData && eggHatchLevel !== undefined) {
        payload = {
          ...payload,
          eggData: {
            ...payload.eggData,
            hatchLevel: Math.max(0, Math.min(5, eggHatchLevel)),
          },
        };
      }

      const unlockedSlots = getUnlockedInventorySlots(prevAcc);
      const addRes = addInventoryItem(prevAcc.inventory, payload, unlockedSlots);
      if (!addRes.added) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `[GM] Mochila cheia (${unlockedSlots}/${unlockedSlots} slots liberados). Esvazie alguns itens para continuar.`,
          { tone: 'warning' }
        );
        return;
      }

      commitHudAccount(
        {
          ...prevAcc,
          inventory: addRes.next,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      pushDropRewardToasts(
        [
          {
            itemKey: payload.itemKey,
            name: payload.eggData
              ? `${payload.name} (${payload.eggData.hatchLevel}/5)`
              : payload.name,
            category: payload.category,
            quantity: payload.quantity,
            iconUrl: payload.iconUrl,
            rarity: payload.rarity ?? 'comum',
            payload,
          },
        ],
        'Painel GM'
      );
      pushChatMessage(
        'system',
        `[GM] Puxou ${payload.quantity}× ${payload.name}${
          payload.eggData ? ` (${payload.eggData.hatchLevel}/5)` : ''
        }.`,
        { tone: 'loot' }
      );
    },
    [isGM, pushChatMessage, pushDropRewardToasts, soundEnabled]
  );

  const handleAdminGrantAllDatas = useCallback(
    (quantityEach: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      let inv = prevAcc.inventory;
      let addedCount = 0;
      const unlockedSlots = getUnlockedInventorySlots(prevAcc);
      for (const def of listAllDataDefinitions()) {
        const payload = createInventoryPayloadFromCatalog(def.itemKey, quantityEach);
        if (!payload) continue;
        const res = addInventoryItem(inv, payload, unlockedSlots);
        if (res.added) {
          inv = res.next;
          addedCount += 1;
        }
      }
      if (addedCount === 0) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `[GM] Mochila cheia (${unlockedSlots}/${unlockedSlots} slots liberados).`,
          { tone: 'warning' }
        );
        return;
      }
      commitHudAccount(
        {
          ...prevAcc,
          inventory: inv,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Adicionou +${quantityEach} de ${addedCount} tipos de DATA à mochila.`,
        { tone: 'loot' }
      );
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminGrantAllEggs = useCallback(
    (eggHatchLevel: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      let inv = prevAcc.inventory;
      let addedCount = 0;
      const unlockedSlots = getUnlockedInventorySlots(prevAcc);
      const clampedLv = Math.max(0, Math.min(5, eggHatchLevel));
      for (const def of listAllDigiEggDefinitions()) {
        const payload = createInventoryPayloadFromCatalog(def.itemKey, 1);
        if (!payload || !payload.eggData) continue;
        const res = addInventoryItem(
          inv,
          {
            ...payload,
            eggData: { ...payload.eggData, hatchLevel: clampedLv },
          },
          unlockedSlots
        );
        if (res.added) {
          inv = res.next;
          addedCount += 1;
        }
      }
      if (addedCount === 0) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `[GM] Mochila cheia (${unlockedSlots}/${unlockedSlots} slots liberados).`,
          { tone: 'warning' }
        );
        return;
      }
      commitHudAccount(
        {
          ...prevAcc,
          inventory: inv,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Adicionou ${addedCount} DigiEggs (${clampedLv}/5) à mochila.`,
        { tone: 'loot' }
      );
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminGrantCurrency = useCallback(
    (bitsDelta: number, dCoinDelta: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const nextBits = Math.max(0, Math.min(1_000_000_000, prevAcc.bits + bitsDelta));
      const nextDCoin = Math.max(
        0,
        Math.min(GM_INFINITE_DCOIN_CAP, prevAcc.dCoin + dCoinDelta)
      );
      commitHudAccount(
        {
          ...prevAcc,
          bits: nextBits,
          dCoin: nextDCoin,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      const parts: string[] = [];
      if (bitsDelta > 0) parts.push(`+${formatDigitalCurrency(bitsDelta)}`);
      if (dCoinDelta > 0) {
        parts.push(
          nextDCoin >= GM_INFINITE_DCOIN_CAP
            ? `DL Din no máximo (${GM_INFINITE_DCOIN_CAP.toLocaleString('pt-BR')})`
            : `+${dCoinDelta.toLocaleString('pt-BR')} DL Din`
        );
      }
      pushChatMessage('system', `[GM] Creditado: ${parts.join(' · ')}.`, {
        tone: 'loot',
      });
    },
    [isGM, pushChatMessage, soundEnabled]
  );

  const handleToggleGmInfiniteDCoin = useCallback(
    (enabled: boolean) => {
      if (!isGM) return;
      setGmInfiniteDCoin(enabled);
      gmInfiniteDCoinRef.current = enabled;
      try {
        window.localStorage.setItem(gmInfiniteStorageKey, enabled ? '1' : '0');
      } catch {
        // Ignore storage quota errors
      }
      if (enabled) {
        const prevAcc = hudAccountRef.current;
        commitHudAccount(
          {
            ...prevAcc,
            dCoin: GM_INFINITE_DCOIN_CAP,
            updatedAt: new Date().toISOString(),
          },
          true
        );
        playDigitalTone('confirm', soundEnabled);
        pushChatMessage(
          'system',
          `[GM] Modo DL Din Infinito ATIVADO (${GM_INFINITE_DCOIN_CAP.toLocaleString('pt-BR')} DL Din com recarga automática).`,
          { tone: 'loot' }
        );
      } else {
        playDigitalTone('click', soundEnabled);
        pushChatMessage('system', '[GM] Modo DL Din Infinito desativado.', {
          tone: 'info',
        });
      }
    },
    [gmInfiniteStorageKey, isGM, pushChatMessage, soundEnabled]
  );

  const handleAdminSetServerExpRate = useCallback(
    async (rate: ServerExpRatePct) => {
      if (!isGM) return;
      const res = await setServerExpRate(rate, selection.tamerName);
      if (!res.ok) {
        playDigitalTone('error', soundEnabled);
        return;
      }
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Taxa de EXP do servidor ajustada para ${rate}% EXP!`,
        { tone: 'level' }
      );
      if (isServerGm) {
        void logGmAction({
          action: 'exp_rate',
          targetUid: 'server',
          targetName: 'Servidor',
          summary: `Ajustou taxa global de EXP para ${rate}%`,
          gmName: selection.tamerName,
        });
      }
    },
    [isGM, isServerGm, pushChatMessage, selection.tamerName, soundEnabled]
  );

  const handleAdminClearInventory = useCallback(() => {
    if (!isGM) return;
    const prevAcc = hudAccountRef.current;
    commitHudAccount(
      {
        ...prevAcc,
        inventory: [],
        updatedAt: new Date().toISOString(),
      },
      true
    );
    playDigitalTone('click', soundEnabled);
    pushChatMessage('system', '[GM] Mochila esvaziada para testes.', {
      tone: 'info',
    });
  }, [isGM, pushChatMessage, soundEnabled]);

  useEffect(() => {
    let cancelled = false;
    const tId: TamerId = selection.characterId;
    const dId: StarterDigimonId = starterDigimon.digimonId;
    const currentFormId = activeFormRef.current.id;
    const startMap = simRef.current.mapId;

    // Load active Tamer, active Digimon form, and map-relevant assets first without blocking startup
    const criticalLoads: Promise<unknown>[] = [
      preloadTamerSheets(tId),
      preloadDigimonPartnerAssets(currentFormId),
      ...DATS_FIXED_NPCS.map((npc) => preloadFixedNpcSprite(npc)),
    ];
    if (
      startMap === HUNTING_MAP_ID ||
      startMap === DATA_FOREST_MAP_ID ||
      startMap === DIGI_MOUNTAIN_MAP_ID ||
      startMap === DIGITAL_DESERT_MAP_ID ||
      startMap === DATA_SEA_MAP_ID ||
      startMap === DIGIMON_ISLAND_MAP_ID ||
      startMap === DARK_AREA_MAP_ID ||
      startMap === VIRTUAL_WORLD_MAP_ID
    ) {
      criticalLoads.push(preloadWildDigimonSpritesForMap(startMap));
    }

    Promise.all(criticalLoads).then(() => {
      if (!cancelled) {
        setLoadedAssetsKey(`${tId}:${dId}`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selection.characterId, starterDigimon.digimonId]);

  // Always preload active Digimon sprites whenever the player swaps partners or evolves
  useEffect(() => {
    void preloadDigimonPartnerAssets(activeFormProfile.id);
  }, [activeFormProfile.id]);

  useEffect(() => {
    if (liveSnapshot.mapId === DIGI_MOUNTAIN_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGI_MOUNTAIN_MAP_ID);
    } else if (liveSnapshot.mapId === DIGITAL_DESERT_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGITAL_DESERT_MAP_ID);
    } else if (liveSnapshot.mapId === DATA_SEA_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DATA_SEA_MAP_ID);
    } else if (liveSnapshot.mapId === DIGIMON_ISLAND_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DIGIMON_ISLAND_MAP_ID);
    } else if (liveSnapshot.mapId === DARK_AREA_MAP_ID) {
      void preloadWildDigimonSpritesForMap(DARK_AREA_MAP_ID);
    } else if (liveSnapshot.mapId === VIRTUAL_WORLD_MAP_ID) {
      void preloadWildDigimonSpritesForMap(VIRTUAL_WORLD_MAP_ID);
    }
  }, [liveSnapshot.mapId]);

  useEffect(() => {
    persistProgress();
    const handleBeforeUnload = () => persistProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.accountUsername, selection.characterId, selection.tamerName]);

  // Keyboard controls (WASD / Arrow keys + E/Enter interaction + F1/F2 skills, guarded when Chat input is focused)
  useEffect(() => {
    function keyToDir(k: string): CardinalDirection | null {
      if (k === 'w' || k === 'arrowup') return 'N';
      if (k === 's' || k === 'arrowdown') return 'S';
      if (k === 'a' || k === 'arrowleft') return 'W';
      if (k === 'd' || k === 'arrowright') return 'E';
      return null;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isEvolvingRef.current) {
        return;
      }
      if (
        isChatFocusedRef.current ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (pendingPortalConfirmRef.current) {
        if (e.key.toLowerCase() === 'escape') {
          e.preventDefault();
          playDigitalTone('click', soundEnabled);
          setPendingPortalConfirm(null);
        }
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleTriggerManualSkill('special1');
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        handleTriggerManualSkill('special2');
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        handleUseQuickSlotRef.current('food');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        handleUseQuickSlotRef.current('vitamin');
        return;
      }
      if (e.key === 'F9') {
        if (!isGM) return;
        e.preventDefault();
        playDigitalTone('click', soundEnabled);
        setActiveHudWindow((curr) => (curr === 'admin' ? null : 'admin'));
        return;
      }

      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      if (k === 'escape') {
        if (overlayLayerRef.current.portalConfirm) {
          setPendingPortalConfirm(null);
        } else if (overlayLayerRef.current.mudShop) {
          setMudfrigimonShopOpen(false);
          setPlayerMarketOpen(false);
        } else if (overlayLayerRef.current.npc) {
          setActiveNpcDialogue(null);
        } else if (overlayLayerRef.current.station) {
          setActiveStationModal(null);
        } else if (overlayLayerRef.current.hud) {
          setBeginnerTutorialOpen(false);
          setEvoluterUnlockFormId(null);
          setActiveHudWindow(null);
        } else if (overlayLayerRef.current.inventory) {
          setInventoryOpen(false);
        }
        return;
      }
      if (
        activeHudWindowRef.current === 'incubator' ||
        activeHudWindowRef.current === 'archive'
      ) {
        return;
      }
      if (k === 'i') {
        setInventoryOpen((o) => !o);
        return;
      }
      if (k === 'e' || k === 'enter') {
        const sim = simRef.current;
        if (nearbyPortalRef.current) {
          e.preventDefault();
          attemptPortalTravel(nearbyPortalRef.current);
          return;
        }
        if (sim.nearbyPointId) {
          e.preventDefault();
          openNearbyStation();
        }
        return;
      }

      const dir = keyToDir(k);
      if (!dir) return;
      pendingIncubatorWalkRef.current = false;
      pendingArchiveWalkRef.current = false;
      pendingPortalWalkRef.current = false;
      pendingConductorWalkRef.current = false;
      pendingTargetPortalRef.current = null;
      pendingDatsPointIdRef.current = null;
      setActiveStationModal(null);
      setActiveNpcDialogue(null);
      const order = simRef.current.keyOrder;
      if (!order.includes(dir)) {
        order.push(dir);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const dir = keyToDir(e.key.toLowerCase());
      if (!dir) return;
      simRef.current.keyOrder = simRef.current.keyOrder.filter((d) => d !== dir);
    }

    function onWindowBlur() {
      simRef.current.keyOrder = [];
      simRef.current.joyVx = 0;
      simRef.current.joyVy = 0;
      simRef.current.joyMag = 0;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGM, soundEnabled, handleTriggerManualSkill]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lazily build each heavy map layer ONLY when first visited (saves ~50MB VRAM & seconds of freeze)
    let datsGroundCanvas: HTMLCanvasElement | null = null;
    let datsDepthProps: ReturnType<typeof buildDatsDepthProps> | null = null;
    let dTerminalGroundCanvas: HTMLCanvasElement | null = null;
    let dTerminalDepthProps: ReturnType<typeof buildDTerminalDepthProps> | null = null;
    let huntingGroundCanvas: HTMLCanvasElement | null = null;
    let huntingDepthProps: ReturnType<typeof buildHuntingDepthProps> | null = null;
    let dataForestGroundCanvas: HTMLCanvasElement | null = null;
    let dataForestDepthProps: ReturnType<typeof buildDataForestDepthProps> | null = null;
    let digiMountainGroundCanvas: HTMLCanvasElement | null = null;
    let digiMountainDepthProps: ReturnType<typeof buildDigiMountainDepthProps> | null = null;
    let digitalDesertGroundCanvas: HTMLCanvasElement | null = null;
    let digitalDesertDepthProps: ReturnType<typeof buildDigitalDesertDepthProps> | null = null;
    let dataSeaGroundCanvas: HTMLCanvasElement | null = null;
    let dataSeaDepthProps: ReturnType<typeof buildDataSeaDepthProps> | null = null;
    let digimonIslandGroundCanvas: HTMLCanvasElement | null = null;
    let digimonIslandDepthProps: ReturnType<typeof buildDigimonIslandDepthProps> | null = null;
    let darkAreaGroundCanvas: HTMLCanvasElement | null = null;
    let darkAreaDepthProps: ReturnType<typeof buildDarkAreaDepthProps> | null = null;
    let virtualWorldGroundCanvas: HTMLCanvasElement | null = null;
    let virtualWorldDepthProps: ReturnType<typeof buildVirtualWorldDepthProps> | null = null;

    function ensureDatsAssets() {
      if (!datsGroundCanvas) {
        datsGroundCanvas = buildDatsCenterStaticLayer();
      }
      if (!datsDepthProps) {
        datsDepthProps = buildDatsDepthProps({
          isIncubatorNearby: () =>
            simRef.current.nearbyPointId === DATS_INCUBATOR_STATION.id,
          isArchiveNearby: () =>
            simRef.current.nearbyPointId === DATS_ARCHIVE_STATION.id,
          isPortalNearby: () =>
            simRef.current.nearbyPointId === 'digital-world-portal',
        });
      }
      return { ground: datsGroundCanvas, props: datsDepthProps };
    }

    function ensureDTerminalAssets() {
      if (!dTerminalGroundCanvas) {
        dTerminalGroundCanvas = buildDTerminalStaticLayer();
      }
      if (!dTerminalDepthProps) {
        dTerminalDepthProps = buildDTerminalDepthProps({
          isConductorNearby: () =>
            simRef.current.nearbyPointId === D_TERMINAL_CONDUCTOR_NPC.id,
          isConductorHovered: () =>
            hoveredNpcIdRef.current === D_TERMINAL_CONDUCTOR_NPC.id,
          isReturnPortalNearby: () => simRef.current.nearReturnPortal,
        });
      }
      return { ground: dTerminalGroundCanvas, props: dTerminalDepthProps };
    }

    function ensureHuntingAssets() {
      if (!huntingGroundCanvas) {
        huntingGroundCanvas = buildHuntingFieldStaticLayer();
      }
      if (!huntingDepthProps) {
        huntingDepthProps = buildHuntingDepthProps();
      }
      return { ground: huntingGroundCanvas, props: huntingDepthProps };
    }

    function ensureDataForestAssets() {
      if (!dataForestGroundCanvas) {
        dataForestGroundCanvas = buildDataForestStaticLayer();
      }
      if (!dataForestDepthProps) {
        dataForestDepthProps = buildDataForestDepthProps();
      }
      return { ground: dataForestGroundCanvas, props: dataForestDepthProps };
    }

    function ensureDigiMountainAssets() {
      if (!digiMountainGroundCanvas) {
        digiMountainGroundCanvas = buildDigiMountainStaticLayer();
      }
      if (!digiMountainDepthProps) {
        digiMountainDepthProps = buildDigiMountainDepthProps();
      }
      return { ground: digiMountainGroundCanvas, props: digiMountainDepthProps };
    }

    function ensureDigitalDesertAssets() {
      if (!digitalDesertGroundCanvas) {
        digitalDesertGroundCanvas = buildDigitalDesertStaticLayer();
      }
      if (!digitalDesertDepthProps) {
        digitalDesertDepthProps = buildDigitalDesertDepthProps();
      }
      return { ground: digitalDesertGroundCanvas, props: digitalDesertDepthProps };
    }

    function ensureDataSeaAssets() {
      if (!dataSeaGroundCanvas) {
        dataSeaGroundCanvas = buildDataSeaStaticLayer();
      }
      if (!dataSeaDepthProps) {
        dataSeaDepthProps = buildDataSeaDepthProps();
      }
      return { ground: dataSeaGroundCanvas, props: dataSeaDepthProps };
    }

    function ensureDigimonIslandAssets() {
      if (!digimonIslandGroundCanvas) {
        digimonIslandGroundCanvas = buildDigimonIslandStaticLayer();
      }
      if (!digimonIslandDepthProps) {
        digimonIslandDepthProps = buildDigimonIslandDepthProps();
      }
      return { ground: digimonIslandGroundCanvas, props: digimonIslandDepthProps };
    }

    function ensureDarkAreaAssets() {
      if (!darkAreaGroundCanvas) {
        darkAreaGroundCanvas = buildDarkAreaStaticLayer();
      }
      if (!darkAreaDepthProps) {
        darkAreaDepthProps = buildDarkAreaDepthProps();
      }
      return { ground: darkAreaGroundCanvas, props: darkAreaDepthProps };
    }

    function ensureVirtualWorldAssets() {
      if (!virtualWorldGroundCanvas) {
        virtualWorldGroundCanvas = buildVirtualWorldStaticLayer();
      }
      if (!virtualWorldDepthProps) {
        virtualWorldDepthProps = buildVirtualWorldDepthProps();
      }
      return { ground: virtualWorldGroundCanvas, props: virtualWorldDepthProps };
    }

    let activeLayerMapId: string | null = null;
    function releaseInactiveMapLayers(nextMapId: string) {
      if (activeLayerMapId === nextMapId) return;
      activeLayerMapId = nextMapId;

      if (nextMapId !== DATS_MAP_ID) {
        if (datsGroundCanvas) {
          datsGroundCanvas.width = 0;
          datsGroundCanvas.height = 0;
          datsGroundCanvas = null;
        }
        datsDepthProps = null;
      }
      if (nextMapId !== D_TERMINAL_MAP_ID) {
        if (dTerminalGroundCanvas) {
          dTerminalGroundCanvas.width = 0;
          dTerminalGroundCanvas.height = 0;
          dTerminalGroundCanvas = null;
        }
        dTerminalDepthProps = null;
      }
      if (nextMapId !== HUNTING_MAP_ID) {
        if (huntingGroundCanvas) {
          huntingGroundCanvas.width = 0;
          huntingGroundCanvas.height = 0;
          huntingGroundCanvas = null;
        }
        huntingDepthProps = null;
      }
      if (nextMapId !== DATA_FOREST_MAP_ID) {
        if (dataForestGroundCanvas) {
          dataForestGroundCanvas.width = 0;
          dataForestGroundCanvas.height = 0;
          dataForestGroundCanvas = null;
        }
        dataForestDepthProps = null;
      }
      if (nextMapId !== DIGI_MOUNTAIN_MAP_ID) {
        if (digiMountainGroundCanvas) {
          digiMountainGroundCanvas.width = 0;
          digiMountainGroundCanvas.height = 0;
          digiMountainGroundCanvas = null;
        }
        digiMountainDepthProps = null;
      }
      if (nextMapId !== DIGITAL_DESERT_MAP_ID) {
        if (digitalDesertGroundCanvas) {
          digitalDesertGroundCanvas.width = 0;
          digitalDesertGroundCanvas.height = 0;
          digitalDesertGroundCanvas = null;
        }
        digitalDesertDepthProps = null;
      }
      if (nextMapId !== DATA_SEA_MAP_ID) {
        if (dataSeaGroundCanvas) {
          dataSeaGroundCanvas.width = 0;
          dataSeaGroundCanvas.height = 0;
          dataSeaGroundCanvas = null;
        }
        dataSeaDepthProps = null;
      }
      if (nextMapId !== DIGIMON_ISLAND_MAP_ID) {
        if (digimonIslandGroundCanvas) {
          digimonIslandGroundCanvas.width = 0;
          digimonIslandGroundCanvas.height = 0;
          digimonIslandGroundCanvas = null;
        }
        digimonIslandDepthProps = null;
      }
      if (nextMapId !== DARK_AREA_MAP_ID) {
        if (darkAreaGroundCanvas) {
          darkAreaGroundCanvas.width = 0;
          darkAreaGroundCanvas.height = 0;
          darkAreaGroundCanvas = null;
        }
        darkAreaDepthProps = null;
      }
      if (nextMapId !== VIRTUAL_WORLD_MAP_ID) {
        if (virtualWorldGroundCanvas) {
          virtualWorldGroundCanvas.width = 0;
          virtualWorldGroundCanvas.height = 0;
          virtualWorldGroundCanvas = null;
        }
        virtualWorldDepthProps = null;
      }
    }

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;
    let hudTimer = 0;
    let lastHudSignature = '';
    let modalDrewFrozenFrame = false;

    // Reusable depth-sort buffer & cached font widths (eliminates 60Hz GC churn & measureText reflows)
    const drawables: Array<{ sortY: number; draw: () => void }> = [];
    const textWidthCache = new Map<string, number>();
    function measureTextCached(
      c: CanvasRenderingContext2D,
      font: string,
      text: string
    ): number {
      const key = `${font}|${text}`;
      const cached = textWidthCache.get(key);
      if (cached !== undefined) return cached;
      const w = c.measureText(text).width;
      if (textWidthCache.size > 400) {
        textWidthCache.clear();
      }
      textWidthCache.set(key, w);
      return w;
    }

    // Cache canvas layout bounds via ResizeObserver to eliminate 60Hz synchronous layout reflow
    let cachedW = canvas.clientWidth || 360;
    let cachedH = canvas.clientHeight || 540;
    let appliedW = 0;
    let appliedH = 0;
    let appliedDpr = 0;

    const refreshBounds = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        cachedW = rect.width;
        cachedH = rect.height;
      }
    };
    refreshBounds();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(refreshBounds)
        : null;
    resizeObserver?.observe(canvas);
    window.addEventListener('resize', refreshBounds);

    function syncCanvasSize() {
      const quality = runtimeMetaRef.current.graphicsQuality;
      // Cap DPR cleanly (1.2 balanced / 1.5 high) to prevent 3x Retina mobile fill-rate stutters
      const maxDpr = quality === 'equilibrada' ? 1.2 : 1.5;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const targetW = Math.max(1, Math.round(cachedW * dpr));
      const targetH = Math.max(1, Math.round(cachedH * dpr));
      if (
        canvas!.width !== targetW ||
        canvas!.height !== targetH ||
        appliedW !== cachedW ||
        appliedH !== cachedH ||
        appliedDpr !== dpr
      ) {
        canvas!.width = targetW;
        canvas!.height = targetH;
        appliedW = cachedW;
        appliedH = cachedH;
        appliedDpr = dpr;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: cachedW, h: cachedH };
    }

    function loop(now: number) {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        lastTs = now;
        rafId = requestAnimationFrame(loop);
        return;
      }

      try {
      const dt = Math.max(0, Math.min(0.05, (now - lastTs) / 1000));
      lastTs = now;
      elapsed = Math.max(0, elapsed + dt);

      const { w: viewW, h: viewH } = syncCanvasSize();
      const sim = simRef.current;
      releaseInactiveMapLayers(sim.mapId);
      const isDTerminal = sim.mapId === D_TERMINAL_MAP_ID;
      const isVirtualWorld = sim.mapId === VIRTUAL_WORLD_MAP_ID;
      const isDarkArea = sim.mapId === DARK_AREA_MAP_ID;
      const isDigimonIsland = sim.mapId === DIGIMON_ISLAND_MAP_ID;
      const isDataSea = sim.mapId === DATA_SEA_MAP_ID;
      const isDigitalDesert = sim.mapId === DIGITAL_DESERT_MAP_ID;
      const isDigiMountain = sim.mapId === DIGI_MOUNTAIN_MAP_ID;
      const isDataForest = sim.mapId === DATA_FOREST_MAP_ID;
      const isHunting = sim.mapId === HUNTING_MAP_ID;
      const isCombatMap =
        isHunting ||
        isDataForest ||
        isDigiMountain ||
        isDigitalDesert ||
        isDataSea ||
        isDigimonIsland ||
        isDarkArea ||
        isVirtualWorld;
      const { worldW, worldH, minY } = getMapDimensions(sim.mapId);
      const colliders = isVirtualWorld
        ? VIRTUAL_WORLD_COLLIDERS
        : isDarkArea
          ? DARK_AREA_COLLIDERS
          : isDigimonIsland
            ? DIGIMON_ISLAND_COLLIDERS
            : isDataSea
              ? DATA_SEA_COLLIDERS
              : isDigitalDesert
                ? DIGITAL_DESERT_COLLIDERS
                : isDigiMountain
                  ? DIGI_MOUNTAIN_COLLIDERS
                  : isDataForest
                    ? DATA_FOREST_COLLIDERS
                    : isHunting
                      ? HUNTING_COLLIDERS
                      : isDTerminal
                        ? D_TERMINAL_COLLIDERS
                        : DATS_COLLIDERS;

      const isEvolving = isEvolvingRef.current;

      // 1. Tamer movement vector (4-way cardinal on WASD/joystick, smooth straight-line on click/tap)
      let moveX = 0;
      let moveY = 0;
      let maxStepDist = Infinity;
      let moveDir: CardinalDirection | null = null;

      if (!isEvolving) {
        if (sim.keyOrder.length > 0) {
          const activeDir = sim.keyOrder[sim.keyOrder.length - 1];
          moveDir = activeDir;
          if (activeDir === 'N') moveY = -1;
          else if (activeDir === 'S') moveY = 1;
          else if (activeDir === 'E') moveX = 1;
          else moveX = -1;
          sim.tapTarget = null;
          sim.autoNavActive = false;
        } else if (sim.joyMag > 0.18) {
          const joyDir = resolveStableCardinalDir(sim.joyVx, sim.joyVy, sim.dir);
          moveDir = joyDir;
          if (joyDir === 'N') moveY = -1;
          else if (joyDir === 'S') moveY = 1;
          else if (joyDir === 'E') moveX = 1;
          else moveX = -1;
          sim.tapTarget = null;
          sim.autoNavActive = false;
        } else if (sim.tapTarget) {
          const dx = sim.tapTarget.x - sim.x;
          const dy = sim.tapTarget.y - sim.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 4) {
            sim.tapTarget = null;
            sim.autoNavActive = false;
          } else {
            moveX = dx / dist;
            moveY = dy / dist;
            maxStepDist = dist;
            moveDir = resolveStableCardinalDir(dx, dy, sim.dir);
          }
        }
      }

      // 2. Tamer movement, collision & animation state machine
      const liveTamerAttrs = computeTamerAttributes(
        hudAccountRef.current.tamer,
        hudAccountRef.current.equippedItems
      );
      if (moveDir) {
        if (sim.state !== 'walk') {
          sim.state = 'walk';
          sim.frameIndex = 0;
          sim.frameTime = 0;
        }
        sim.dir = moveDir;

        const prevX = sim.x;
        const prevY = sim.y;
        const moveSpeed = liveTamerAttrs.speed;
        const stepDist = Math.min(maxStepDist, moveSpeed * dt);

        sim.x = Math.max(42, Math.min(worldW - 42, sim.x + moveX * stepDist));
        sim.y = Math.max(minY, Math.min(worldH - 42, sim.y + moveY * stepDist));

        for (const col of colliders) {
          const [rx, ry] = resolveCircleRect(sim.x, sim.y, PLAYER_RADIUS, col);
          sim.x = rx;
          sim.y = ry;
        }

        if (!isCombatMap) {
          for (const npc of DATS_FIXED_NPCS) {
            const [nx, ny] = resolveCircleCircle(
              sim.x,
              sim.y,
              PLAYER_RADIUS,
              npc.x,
              npc.y,
              npc.collisionRadius
            );
            sim.x = nx;
            sim.y = ny;
          }
        } else {
          const activeFieldNpcs = isVirtualWorld
            ? VIRTUAL_WORLD_FRIENDLY_NPCS
            : isDarkArea
              ? DARK_AREA_FRIENDLY_NPCS
              : isDigimonIsland
              ? DIGIMON_ISLAND_FRIENDLY_NPCS
            : isDataSea
              ? DATA_SEA_FRIENDLY_NPCS
              : isDigitalDesert
                ? DIGITAL_DESERT_FRIENDLY_NPCS
                : isDigiMountain
                  ? DIGI_MOUNTAIN_FRIENDLY_NPCS
                  : isDataForest
                    ? DATA_FOREST_FRIENDLY_NPCS
                    : FRIENDLY_FIELD_NPCS;
          for (const npc of activeFieldNpcs) {
            const [nx, ny] = resolveCircleCircle(
              sim.x,
              sim.y,
              PLAYER_RADIUS,
              npc.x,
              npc.y,
              22
            );
            sim.x = nx;
            sim.y = ny;
          }
        }

        const movedDist = Math.hypot(sim.x - prevX, sim.y - prevY);
        sim.distMovedAccum += movedDist;
        if (sim.distMovedAccum >= 32) {
          sim.stepsCount += Math.floor(sim.distMovedAccum / 32);
          sim.distMovedAccum %= 32;
        }

        if (sim.tapTarget) {
          const remDist = Math.hypot(
            sim.tapTarget.x - sim.x,
            sim.tapTarget.y - sim.y
          );
          if (remDist <= 4 || (dt > 0.001 && movedDist < 0.25)) {
            sim.tapTarget = null;
            sim.autoNavActive = false;
          }
        }

        const walkFrameRate = 11.5;
        sim.frameTime += dt;
        if (sim.frameTime >= 1 / walkFrameRate) {
          sim.frameTime = 0;
          sim.frameIndex = (sim.frameIndex + 1) % TAMER_FRAME_WRAP;
        }
      } else {
        if (sim.state === 'walk') {
          sim.state = 'idle';
          sim.frameIndex = 0;
          sim.frameTime = 0;
          sim.lastSaveTs = now;
          persistProgress();
        }
        sim.frameTime += dt;
        if (sim.frameTime >= 0.36) {
          sim.frameTime = 0;
          sim.frameIndex = (sim.frameIndex + 1) % TAMER_FRAME_WRAP;
        }
      }

      // 2b. Wild Enemy Patrol, Per-Mob Aggro Chase, Counter-Attack & Respawn Loop (paused cleanly during Digivolution)
      const inSafeZone = isPointInMapSafeZone(sim.mapId, sim.x, sim.y);
      if (isCombatMap && !isEvolving) {
        let retreatedToSafeZone = false;

        for (const enemy of sim.enemies) {
          if (enemy.hitFlashTimer > 0) {
            enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
          }
          if (enemy.attackAnimTimer > 0) {
            enemy.attackAnimTimer = Math.max(0, enemy.attackAnimTimer - dt);
          }
          if ((enemy.counterCooldown ?? 0) > 0) {
            enemy.counterCooldown = Math.max(0, (enemy.counterCooldown ?? 0) - dt);
          }

          if (!enemy.alive) {
            enemy.aggroed = false;
            enemy.aggroTimer = 0;
            enemy.counterCooldown = 0;
            // World Raid Bosses respawn strictly via synchronized Firestore timer
            if (enemy.isBoss) {
              continue;
            }
            enemy.respawnTimer -= dt;
            if (enemy.respawnTimer <= 0) {
              enemy.alive = true;
              enemy.hp = enemy.maxHp;
              enemy.x = enemy.homeX;
              enemy.y = enemy.homeY;
              enemy.attackAnimTimer = 0;
            }
            continue;
          }

          const applyEnemyHitToLocalPartner = (
            attacker: EnemyMonsterInstance,
            opts?: {
              damageScale?: number;
              isAoeSkill?: boolean;
              skillBannerText?: string;
            }
          ) => {
            if (retreatedToSafeZone || inSafeZone) return;
            const cur = hudAccountRef.current;
            const lvDiff = attacker.level - cur.digimon.level;
            const tamerDefAttrs = computeTamerAttributes(cur.tamer, cur.equippedItems);
            const derivedDef = computeDerivedDigimonAttributes(
              tamerDefAttrs,
              cur.digimon,
              cur.defeatedEnemiesTotal,
              activeFormRef.current.id
            );

            // EV (Evasão) e BL (Bloqueio) são drasticamente reduzidos contra inimigos muito acima do nível
            const defReliability =
              lvDiff >= 10
                ? 0
                : lvDiff >= 5
                  ? Math.max(0.15, 1 - (lvDiff - 4) * 0.16)
                  : 1;
            const effectiveEvasion = derivedDef.evasion * defReliability;
            const effectiveBlock = derivedDef.blockRate * defReliability;

            if (Math.random() * 100 < effectiveEvasion) {
              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: sim.partner.x,
                y: sim.partner.y - 44,
                text: opts?.isAoeSkill ? 'ESQUIVOU (ÁREA)!' : 'ESQUIVOU!',
                color: '#38bdf8',
                elapsed: 0,
                duration: 0.75,
              });
              return;
            }

            // Ataque escalonado por faixa de mapa (Rookie 1–10 < Floresta 10–19 < Champions 20–30 < Deserto 30–40 < Mar de Dados 40–50 < Ilha dos Digimons 50–60 < Área Sombria 60–70 < Mundo Virtual 70–80)
            const baseEnemyAtk =
              attacker.level >= 70
                ? 52 +
                  attacker.level * 4.8 +
                  (attacker.level - 19) * 10.5 +
                  (attacker.level - 39) * 4.5 +
                  (attacker.level - 49) * 5.5 +
                  (attacker.level - 59) * 6.5 +
                  (attacker.level - 69) * 7.5
                : attacker.level >= 60
                  ? 52 +
                    attacker.level * 4.8 +
                    (attacker.level - 19) * 10.5 +
                    (attacker.level - 39) * 4.5 +
                    (attacker.level - 49) * 5.5 +
                    (attacker.level - 59) * 6.5
                : attacker.level >= 50
                  ? 52 +
                    attacker.level * 4.8 +
                    (attacker.level - 19) * 10.5 +
                    (attacker.level - 39) * 4.5 +
                    (attacker.level - 49) * 5.5
                : attacker.level >= 40
                  ? 52 +
                    attacker.level * 4.8 +
                    (attacker.level - 19) * 10.5 +
                    (attacker.level - 39) * 4.5
                  : attacker.level >= 20
                    ? 52 + attacker.level * 4.8 + (attacker.level - 19) * 10.5
                    : attacker.level >= 10
                      ? 22 + attacker.level * 4.8
                      : 13 + attacker.level * 3.8;
            // Multiplicador de ameaça: inimigos muito acima do seu nível aplicam golpes esmagadores
            const overlevelThreatMult =
              lvDiff >= 3
                ? Math.min(3.2, 1 + (lvDiff - 2) * 0.15)
                : lvDiff <= -5
                  ? Math.max(0.55, 1 + (lvDiff + 4) * 0.08)
                  : 1;
            const rawEnemyAtk =
              baseEnemyAtk *
              (attacker.isBoss ? 1.6 : 1) *
              overlevelThreatMult *
              (opts?.damageScale ?? 1);
            const defMitigationFactor = lvDiff >= 8 ? 0.2 : 0.45;
            const mitigated = Math.max(
              attacker.isBoss ? 16 : lvDiff >= 5 ? Math.round(rawEnemyAtk * 0.65) : 4,
              Math.round(rawEnemyAtk - derivedDef.defense * defMitigationFactor)
            );
            const isCrushing = lvDiff >= 6;
            // BL (Bloqueio): reduz o dano sofrido pela metade
            const isBlocked = Math.random() * 100 < effectiveBlock;
            const incomingDmg = isBlocked
              ? Math.max(1, Math.round(mitigated * 0.5))
              : mitigated;
            const nextHp = cur.digimon.hp - incomingDmg;
            if (opts?.skillBannerText) {
              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: attacker.x,
                y: attacker.y - 98,
                text: opts.skillBannerText,
                color: opts.isAoeSkill ? '#fde047' : '#fca5a5',
                elapsed: 0,
                duration: 0.95,
              });
            }
            sim.floatingTexts.push({
              id: sim.nextFxId++,
              x: sim.partner.x,
              y: sim.partner.y - (opts?.isAoeSkill ? 58 : 44),
              text: opts?.isAoeSkill
                ? isBlocked
                  ? `ÁREA BLOQ -${incomingDmg}`
                  : `SKILL ÁREA -${incomingDmg}`
                : isBlocked
                  ? `BLOQUEIO -${incomingDmg}`
                  : isCrushing
                    ? `ESMAGADOR -${incomingDmg}!`
                    : `-${incomingDmg}`,
              color: isBlocked
                ? '#fbbf24'
                : opts?.isAoeSkill
                  ? '#f97316'
                  : isCrushing
                    ? '#ef4444'
                    : '#fb7185',
              elapsed: 0,
              duration: isCrushing || opts?.isAoeSkill ? 0.92 : 0.78,
            });

            if (nextHp <= 0) {
              retreatedToSafeZone = true;
              // Emergency retreat back to the map's Safe Sanctuary without losing saved progress
              const recoveredAccount: AccountHudPersistence = {
                ...cur,
                digimon: {
                  ...cur.digimon,
                  hp: Math.max(25, Math.round(cur.digimon.maxHp * 0.35)),
                  ds: Math.max(
                    cur.digimon.ds,
                    Math.max(20, Math.round(cur.digimon.maxDs * 0.35))
                  ),
                },
              };
              commitHudAccount(recoveredAccount);
              pushChatMessage(
                'system',
                lvDiff >= 6
                  ? `${activeFormRef.current.name} foi derrotado por ${attacker.name} (Nv.${attacker.level}) — inimigo muito forte! Evolua e suba de nível antes de enfrentá-lo.`
                  : `${activeFormRef.current.name} sofreu dano crítico e recuou para a Área Segura!`,
                { tone: 'warning' }
              );
              const safeSpawn = isVirtualWorld
                ? VIRTUAL_WORLD_SPAWN_POINT
                : isDarkArea
                  ? DARK_AREA_SPAWN_POINT
                  : isDigimonIsland
                  ? DIGIMON_ISLAND_SPAWN_POINT
                : isDataSea
                  ? DATA_SEA_SPAWN_POINT
                  : isDigitalDesert
                    ? DIGITAL_DESERT_SPAWN_POINT
                    : isDigiMountain
                      ? DIGI_MOUNTAIN_SPAWN_POINT
                      : isDataForest
                        ? DATA_FOREST_SPAWN_POINT
                        : HUNTING_SPAWN_POINT;
              sim.x = safeSpawn.x;
              sim.y = safeSpawn.y;
              sim.partner.x = sim.x + 44;
              sim.partner.y = sim.y - 24;
              sim.partner.targetEnemyId = null;
              sim.partner.activeAttack = null;
              sim.partner.aiState = 'IDLE';
              for (const other of sim.enemies) {
                if (other.aggroed && !other.isBoss) {
                  other.hp = other.maxHp;
                }
                other.aggroed = false;
                other.aggroTimer = 0;
              }
            } else {
              const updated: AccountHudPersistence = {
                ...cur,
                digimon: { ...cur.digimon, hp: nextHp },
              };
              hudAccountRef.current = updated;
              setHudAccount(updated);
            }
          };

          const beingEngagedByPartner =
            (sim.partner.targetEnemyId === enemy.id &&
              sim.partner.aiState === 'ATTACK') ||
            sim.partner.activeAttack?.targetId === enemy.id;

          // Para Raid Bosses: coleta todos os Digimons atacantes ativos (local + remotos) e alterna o foco a cada 7s!
          let activeBossAttackers: RaidBossAttackerCandidate[] = [];
          if (enemy.isBoss) {
            const distLocalToBoss = Math.hypot(
              sim.partner.x - enemy.x,
              sim.partner.y - enemy.y
            );
            const localIsEngagingBoss =
              !inSafeZone &&
              !retreatedToSafeZone &&
              (beingEngagedByPartner ||
                (bossParticipatedRef.current &&
                  distLocalToBoss <= BOSS_AGGRO_DETECT_RADIUS_PX));
            if (localIsEngagingBoss) {
              activeBossAttackers.push({
                uid: actorUid,
                tamerName: runtimeMetaRef.current.tamerName,
                digimonName: activeFormRef.current.name,
                x: sim.partner.x,
                y: sim.partner.y,
                isLocal: true,
              });
            }

            const contributorsMap = worldBossRef.current?.contributors ?? {};
            for (const [remoteUid, smooth] of remoteSmoothRef.current.entries()) {
              const rp = smooth.player;
              if (
                rp.mapId !== sim.mapId ||
                rp.channelId !== currentChannelRef.current
              )
                continue;
              const rx = smooth.partnerRenderX;
              const ry = smooth.partnerRenderY;
              if (isPointInMapSafeZone(sim.mapId, rx, ry)) continue;
              const distRemote = Math.hypot(rx - enemy.x, ry - enemy.y);
              const isContrib = Boolean(contributorsMap[remoteUid]?.damage);
              const detectRange = isContrib ? BOSS_AGGRO_DETECT_RADIUS_PX + 20 : 235;
              if (distRemote <= detectRange) {
                activeBossAttackers.push({
                  uid: remoteUid,
                  tamerName: rp.tamerName,
                  digimonName: getDigimonFormProfile(rp.digimonFormId).name,
                  x: rx,
                  y: ry,
                  isLocal: false,
                });
              }
            }
          }

          if ((beingEngagedByPartner && !inSafeZone) || (enemy.isBoss && activeBossAttackers.length > 0 && !inSafeZone)) {
            if (!enemy.aggroed) {
              enemy.aggroed = true;
              const initLvDiff = enemy.level - hudAccountRef.current.digimon.level;
              enemy.counterCooldown = enemy.isBoss
                ? 0.4
                : initLvDiff >= 6
                  ? 0.22
                  : 0.55;
              if (enemy.isBoss) {
                enemy.bossAoeCooldown = 4.0;
              }
            }
            enemy.aggroTimer = 8.5;
          }

          if (enemy.aggroed) {
            if (
              (inSafeZone && activeBossAttackers.length === 0) ||
              (retreatedToSafeZone && activeBossAttackers.length === 0)
            ) {
              enemy.aggroed = false;
              enemy.aggroTimer = 0;
            } else {
              enemy.aggroTimer = Math.max(0, (enemy.aggroTimer ?? 0) - dt);
              const leashDist = Math.hypot(
                enemy.x - enemy.homeX,
                enemy.y - enemy.homeY
              );
              const maxLeash = enemy.isBoss ? 420 : 340;
              if ((enemy.aggroTimer ?? 0) <= 0 || leashDist > maxLeash) {
                enemy.aggroed = false;
                enemy.aggroTimer = 0;
              }
            }
          }

          if (!enemy.aggroed) {
            if (enemy.isBoss) {
              enemy.bossTargetUid = undefined;
              enemy.bossTargetName = undefined;
              enemy.bossTargetX = undefined;
              enemy.bossTargetY = undefined;
              enemy.bossAoeCooldown = undefined;
            }
            // Wild Digimon recover HP rapidly when disengaged so under-leveled players cannot chip them down
            if (!enemy.isBoss && enemy.hp < enemy.maxHp) {
              enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.28 * dt);
            }
            enemy.patrolTimer += dt;
            enemy.patrolAngle += dt * (enemy.isBoss ? 0.36 : 0.52);
            const patrolRx = enemy.isBoss ? 14 : 18;
            const patrolRy = enemy.isBoss ? 8 : 12;
            const targetX = enemy.homeX + Math.cos(enemy.patrolAngle) * patrolRx;
            const targetY = enemy.homeY + Math.sin(enemy.patrolAngle * 0.8) * patrolRy;
            const stepX = (targetX - enemy.x) * Math.min(1, dt * 1.4);
            if (Math.abs(stepX) > 0.08) {
              enemy.facingRight = stepX > 0;
            }
            enemy.x += stepX;
            enemy.y += (targetY - enemy.y) * Math.min(1, dt * 1.4);
            continue;
          }

          // Para Raid Bosses: escolhe o alvo principal atual na rotação de 7 segundos!
          let focusX = sim.partner.x;
          let focusY = sim.partner.y;
          let focusIsLocal = true;
          let focusDigimonName = activeFormRef.current.name;

          if (enemy.isBoss) {
            if (activeBossAttackers.length > 0) {
              const rotation = selectRaidBossPrimaryTarget(
                activeBossAttackers,
                Date.now()
              );
              const chosen = rotation.primaryTarget!;
              const prevUid = enemy.bossTargetUid;
              enemy.bossTargetUid = chosen.uid;
              enemy.bossTargetName = chosen.digimonName;
              enemy.bossTargetX = chosen.x;
              enemy.bossTargetY = chosen.y;
              enemy.bossTargetSwapRemainingSec = rotation.swapRemainingSec;
              focusX = chosen.x;
              focusY = chosen.y;
              focusIsLocal = chosen.isLocal;
              focusDigimonName = chosen.digimonName;

              if (prevUid && prevUid !== chosen.uid && rotation.totalAttackers > 1) {
                sim.floatingTexts.push({
                  id: sim.nextFxId++,
                  x: enemy.x,
                  y: enemy.y - 106,
                  text: `ALVO: ${chosen.digimonName.toUpperCase()}!`,
                  color: '#fde047',
                  elapsed: 0,
                  duration: 1.1,
                });
              }
            } else {
              enemy.bossTargetUid = undefined;
              enemy.bossTargetName = undefined;
              enemy.bossTargetX = undefined;
              enemy.bossTargetY = undefined;
              focusIsLocal = false;
            }

            // Skill em Área (AoE) do Raid Boss: atinge TODOS os Digimons que estão atacando ele!
            enemy.bossAoeCooldown = Math.max(
              0,
              (enemy.bossAoeCooldown ?? BOSS_AOE_SKILL_COOLDOWN_SEC) - dt
            );
            if (enemy.bossAoeCooldown <= 0 && activeBossAttackers.length > 0) {
              enemy.bossAoeCooldown = BOSS_AOE_SKILL_COOLDOWN_SEC;
              enemy.attackAnimTimer = 0.52;
              const hitsInRadius = activeBossAttackers
                .filter(
                  (att) =>
                    Math.hypot(att.x - enemy.x, att.y - enemy.y) <=
                    BOSS_AOE_SKILL_RADIUS_PX
                )
                .map((att) => ({ x: att.x, y: att.y }));

              sim.bossAoeEffects.push({
                id: sim.nextFxId++,
                x: enemy.x,
                y: enemy.y,
                radius: BOSS_AOE_SKILL_RADIUS_PX,
                elapsed: 0,
                duration: 0.72,
                hits: hitsInRadius,
              });

              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: enemy.x,
                y: enemy.y - 118,
                text: 'TEMPESTADE DE TESOURAS! (ÁREA)',
                color: '#fde047',
                elapsed: 0,
                duration: 1.05,
              });

              const localInAoe =
                !retreatedToSafeZone &&
                !inSafeZone &&
                Math.hypot(sim.partner.x - enemy.x, sim.partner.y - enemy.y) <=
                  BOSS_AOE_SKILL_RADIUS_PX &&
                activeBossAttackers.some((att) => att.isLocal);

              if (localInAoe) {
                applyEnemyHitToLocalPartner(enemy, {
                  damageScale: 0.85,
                  isAoeSkill: true,
                });
              }
            }
          }

          // Enemy is actively aggroed: face current focus target, close distance if needed, and counter-attack!
          const dxToFocus = focusX - enemy.x;
          const dyToFocus = focusY - enemy.y;
          const distToFocus = Math.hypot(dxToFocus, dyToFocus);
          if (Math.abs(dxToFocus) > 1) {
            enemy.facingRight = dxToFocus >= 0;
          }

          const meleeReach = enemy.isBoss ? 114 : 84;
          if (distToFocus > meleeReach) {
            const mobChaseSpeed = enemy.isBoss ? 118 : 135;
            const step = Math.min(
              distToFocus - (meleeReach - 12),
              mobChaseSpeed * dt
            );
            if (step > 0.05 && distToFocus > 0.001) {
              let nx = Math.max(
                48,
                Math.min(worldW - 48, enemy.x + (dxToFocus / distToFocus) * step)
              );
              let ny = Math.max(
                minY,
                Math.min(worldH - 48, enemy.y + (dyToFocus / distToFocus) * step)
              );
              for (const col of colliders) {
                const [rx, ry] = resolveCircleRect(nx, ny, 16, col);
                nx = rx;
                ny = ry;
              }
              if (!isPointInMapSafeZone(sim.mapId, nx, ny)) {
                enemy.x = nx;
                enemy.y = ny;
              }
            }
          }

          const updatedDist = Math.hypot(focusX - enemy.x, focusY - enemy.y);
          if (
            updatedDist <= meleeReach + 8 &&
            (enemy.counterCooldown ?? 0) <= 0
          ) {
            const cur = hudAccountRef.current;
            const lvDiff = enemy.level - cur.digimon.level;
            enemy.counterCooldown = enemy.isBoss
              ? 1.4
              : lvDiff >= 6
                ? 1.22
                : enemy.level >= 20
                  ? 1.45
                  : 1.65;
            enemy.attackAnimTimer = 0.48;
            enemy.facingRight = focusX >= enemy.x;

            if (focusIsLocal && !retreatedToSafeZone) {
              applyEnemyHitToLocalPartner(enemy, {
                skillBannerText:
                  enemy.isBoss && Math.random() < 0.42
                    ? 'TESOURA CRUZADA!'
                    : undefined,
              });
            } else if (enemy.isBoss && !focusIsLocal) {
              // Exibe impacto visual no Digimon remoto que está recebendo o foco do Boss
              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: focusX,
                y: focusY - 46,
                text: `ALVO · ${focusDigimonName}`,
                color: '#fca5a5',
                elapsed: 0,
                duration: 0.72,
              });
            }
          }
        }
      }

      // Safe Zone natural HP & DS recovery (batched every 1.5s for identical rate with 50% fewer React renders)
      if (inSafeZone) {
        sim.safeRegenTimer += dt;
        if (sim.safeRegenTimer >= 1.5) {
          sim.safeRegenTimer = 0;
          const cur = hudAccountRef.current;
          if (
            cur.tamer.hp < liveTamerAttrs.maxHp ||
            cur.tamer.ds < liveTamerAttrs.maxDs ||
            cur.digimon.hp < cur.digimon.maxHp ||
            cur.digimon.ds < cur.digimon.maxDs
          ) {
            const tamerHpStep = Math.max(14, Math.round(liveTamerAttrs.maxHp * 0.08));
            const tamerDsStep = Math.max(12, Math.round(liveTamerAttrs.maxDs * 0.08));
            const digiHpStep = Math.max(18, Math.round(cur.digimon.maxHp * 0.08));
            const digiDsStep = Math.max(16, Math.round(cur.digimon.maxDs * 0.08));
            const nextAccount: AccountHudPersistence = {
              ...cur,
              tamer: {
                ...cur.tamer,
                maxHp: liveTamerAttrs.maxHp,
                maxDs: liveTamerAttrs.maxDs,
                hp: Math.min(liveTamerAttrs.maxHp, cur.tamer.hp + tamerHpStep),
                ds: Math.min(liveTamerAttrs.maxDs, cur.tamer.ds + tamerDsStep),
              },
              digimon: {
                ...cur.digimon,
                hp: Math.min(cur.digimon.maxHp, cur.digimon.hp + digiHpStep),
                ds: Math.min(cur.digimon.maxDs, cur.digimon.ds + digiDsStep),
              },
            };
            hudAccountRef.current = nextAccount;
            setHudAccount(nextAccount);
          }
        }
      }

      // 2b2. Auto HP & DS Consumable Recovery + Auto-Attack Mob Targeting
      const autoCfg = autoHuntConfigRef.current;
      autoPotionCooldownRef.current.hp = Math.max(
        0,
        autoPotionCooldownRef.current.hp - dt
      );
      autoPotionCooldownRef.current.ds = Math.max(
        0,
        autoPotionCooldownRef.current.ds - dt
      );

      if (!isEvolving) {
        let curForAuto = hudAccountRef.current;

        if (
          autoCfg.autoHpEnabled &&
          autoPotionCooldownRef.current.hp <= 0 &&
          curForAuto.digimon.hp > 0 &&
          curForAuto.digimon.maxHp > 0 &&
          (curForAuto.digimon.hp / curForAuto.digimon.maxHp) * 100 <=
            autoCfg.hpThresholdPct
        ) {
          const hpDeficit = curForAuto.digimon.maxHp - curForAuto.digimon.hp;
          const hpItem = pickBestRecoveryItem(curForAuto.inventory, 'hp', hpDeficit);
          if (hpItem && hpItem.hpRestore) {
            const idx = curForAuto.inventory.findIndex((i) => i.id === hpItem.id);
            if (idx >= 0) {
              const nextHp = Math.min(
                curForAuto.digimon.maxHp,
                curForAuto.digimon.hp + hpItem.hpRestore
              );
              const restored = nextHp - curForAuto.digimon.hp;
              const nextInv = [...curForAuto.inventory];
              if (nextInv[idx].quantity > 1) {
                nextInv[idx] = {
                  ...nextInv[idx],
                  quantity: nextInv[idx].quantity - 1,
                };
              } else {
                nextInv.splice(idx, 1);
              }
              curForAuto = {
                ...curForAuto,
                digimon: { ...curForAuto.digimon, hp: nextHp },
                inventory: nextInv,
              };
              commitHudAccount(curForAuto);
              autoPotionCooldownRef.current.hp = 1.15;
              if (restored > 0) {
                sim.floatingTexts.push({
                  id: sim.nextFxId++,
                  x: sim.partner.x,
                  y: sim.partner.y - 68,
                  text: `+${restored.toLocaleString('pt-BR')} HP`,
                  color: '#4ade80',
                  elapsed: 0,
                  duration: 1.1,
                });
              }
            }
          }
        }

        if (
          autoCfg.autoDsEnabled &&
          autoPotionCooldownRef.current.ds <= 0 &&
          curForAuto.digimon.maxDs > 0 &&
          (curForAuto.digimon.ds / curForAuto.digimon.maxDs) * 100 <=
            autoCfg.dsThresholdPct
        ) {
          const dsDeficit = curForAuto.digimon.maxDs - curForAuto.digimon.ds;
          const dsItem = pickBestRecoveryItem(curForAuto.inventory, 'ds', dsDeficit);
          if (dsItem && dsItem.dsRestore) {
            const idx = curForAuto.inventory.findIndex((i) => i.id === dsItem.id);
            if (idx >= 0) {
              const nextDs = Math.min(
                curForAuto.digimon.maxDs,
                curForAuto.digimon.ds + dsItem.dsRestore
              );
              const restored = nextDs - curForAuto.digimon.ds;
              const nextInv = [...curForAuto.inventory];
              if (nextInv[idx].quantity > 1) {
                nextInv[idx] = {
                  ...nextInv[idx],
                  quantity: nextInv[idx].quantity - 1,
                };
              } else {
                nextInv.splice(idx, 1);
              }
              curForAuto = {
                ...curForAuto,
                digimon: { ...curForAuto.digimon, ds: nextDs },
                inventory: nextInv,
              };
              commitHudAccount(curForAuto);
              autoPotionCooldownRef.current.ds = 1.15;
              if (restored > 0) {
                sim.floatingTexts.push({
                  id: sim.nextFxId++,
                  x: sim.partner.x,
                  y: sim.partner.y - 84,
                  text: `+${restored.toLocaleString('pt-BR')} DS`,
                  color: '#38e8ff',
                  elapsed: 0,
                  duration: 1.1,
                });
              }
            }
          }
        }
      }

      const canRunAutoFarm =
        autoCfg.enabled &&
        isAutoFarmVipActive(hudAccountRef.current, isGM);
      if (
        canRunAutoFarm &&
        autoCfg.targetSpecies.length > 0 &&
        isCombatMap &&
        !isEvolving
      ) {
        const targetSet = autoCfg.targetSpecies;
        let currentAutoEnemy = sim.partner.targetEnemyId
          ? sim.enemies.find(
              (e) =>
                e.id === sim.partner.targetEnemyId &&
                e.alive &&
                e.disposition === 'enemy' &&
                targetSet.includes(e.species)
            )
          : undefined;

        if (!currentAutoEnemy) {
          let bestDist = Infinity;
          for (const enemy of sim.enemies) {
            if (!enemy.alive || enemy.disposition !== 'enemy') continue;
            if (enemy.id === sim.partner.ignoredEnemyId) continue;
            if (!targetSet.includes(enemy.species)) continue;
            const d = Math.hypot(enemy.x - sim.x, enemy.y - sim.y);
            if (d < bestDist) {
              bestDist = d;
              currentAutoEnemy = enemy;
            }
          }
          if (currentAutoEnemy) {
            sim.partner.targetEnemyId = currentAutoEnemy.id;
            sim.partner.recoverFailCount = 0;
            if (!inSafeZone && bestDist <= 315 && sim.partner.aiState !== 'ATTACK') {
              sim.partner.aiState = 'CHASE';
            }
          }
        }

        if (currentAutoEnemy) {
          const distToTarget = Math.hypot(
            currentAutoEnemy.x - sim.x,
            currentAutoEnemy.y - sim.y
          );
          const hasManualMove =
            sim.keyOrder.length > 0 ||
            sim.joyMag > 0.18 ||
            (Boolean(sim.tapTarget) && !sim.autoNavActive);

          if (!hasManualMove) {
            if (inSafeZone || distToTarget > 250) {
              sim.tapTarget = {
                x: Math.max(48, Math.min(worldW - 48, currentAutoEnemy.x)),
                y: Math.max(
                  minY,
                  Math.min(
                    worldH - 48,
                    currentAutoEnemy.y + (currentAutoEnemy.isBoss ? 72 : 0)
                  )
                ),
              };
              sim.autoNavActive = true;
            } else if (sim.autoNavActive && distToTarget <= 185) {
              sim.tapTarget = null;
              sim.autoNavActive = false;
            }
          }
        }
      } else if (sim.autoNavActive) {
        sim.tapTarget = null;
        sim.autoNavActive = false;
      }

      // 2c. Autonomous 7-State Starter Digimon Partner AI (paused cleanly during Digivolution)
      const curAcc = hudAccountRef.current;
      const liveForm = activeFormRef.current;
      const prevPartnerX = sim.partner.x;
      const prevPartnerY = sim.partner.y;
      if (!isEvolving) updatePartnerAI(sim.partner, {
        dt,
        tamerX: sim.x,
        tamerY: sim.y,
        tamerDir: sim.dir,
        tamerMoving: sim.state === 'walk',
        tamerSpeed: liveTamerAttrs.speed,
        isCombatMap,
        isInSafeZone: inSafeZone,
        worldW,
        worldH,
        minY,
        colliders,
        enemies: isCombatMap ? sim.enemies : [],
        speedMult: liveForm.spdMult,
        partnerSizeOffset: liveForm.worldDimensions.followGapBonus,
        basicHitIntervalSec: liveForm.basicHitIntervalSec,
        special1CooldownSec: liveForm.special1CooldownSec,
        special2CooldownSec: liveForm.special2CooldownSec,
        canUseSpecial1:
          curAcc.digimon.ds >= getDmoSkillSpec(liveForm.id, 'f1').dsCost,
        canUseSpecial2:
          curAcc.digimon.ds >= getDmoSkillSpec(liveForm.id, 'f2').dsCost,
        onConsumeSpecialDs: (kind) => {
          const cost = getDmoSkillSpec(
            liveForm.id,
            kind === 'special1' ? 'f1' : 'f2'
          ).dsCost;
          const liveAcc = hudAccountRef.current;
          if (liveAcc.digimon.ds < cost) return false;
          const nextAcc: AccountHudPersistence = {
            ...liveAcc,
            digimon: {
              ...liveAcc.digimon,
              ds: Math.max(0, liveAcc.digimon.ds - cost),
            },
          };
          hudAccountRef.current = nextAcc;
          setHudAccount(nextAcc);
          return true;
        },
        resolveCircleRect,
        snapDir: (dx, dy) => snapToCardinalVector(dx, dy).dir,
        onDealDamage: (enemy: EnemyMonsterInstance, kind: PartnerAttackKind, amount: number) => {
          const curLive = hudAccountRef.current;
          const levelGap = enemy.level - curLive.digimon.level;

          if (!enemy.aggroed) {
            enemy.aggroed = true;
            enemy.counterCooldown = enemy.isBoss
              ? 0.4
              : levelGap >= 6
                ? 0.22
                : 0.55;
          }
          enemy.aggroTimer = 8.5;

          const formNow = activeFormRef.current;
          const tamerCombatAttrs = computeTamerAttributes(
            curLive.tamer,
            curLive.equippedItems
          );
          const derivedCombat = computeDerivedDigimonAttributes(
            tamerCombatAttrs,
            curLive.digimon,
            curLive.defeatedEnemiesTotal,
            formNow.id
          );

          // HT (Acerto) + Penalidade real por diferença de nível:
          // Inimigos muito acima do nível do seu Digimon esquivam da maioria dos ataques!
          const accDelta = (derivedCombat.accuracy - enemy.level * 12) * 0.06;
          let levelHitPenalty = 0;
          if (levelGap >= 2) {
            levelHitPenalty = (levelGap - 1) * 5.8;
          }
          const minHitFloor = levelGap >= 12 ? 8 : levelGap >= 6 ? 16 : 52;
          const baseHit = kind === 'basic' ? 92 : 96;
          const hitChance = Math.min(
            kind === 'basic' ? 99 : 99.5,
            Math.max(
              kind === 'basic' ? minHitFloor : Math.min(92, minHitFloor + 8),
              baseHit + accDelta - levelHitPenalty
            )
          );
          if (Math.random() * 100 > hitChance) {
            sim.floatingTexts.push({
              id: sim.nextFxId++,
              x: enemy.x,
              y: enemy.y - 42,
              text: 'ERROU!',
              color: '#94a3b8',
              elapsed: 0,
              duration: 0.72,
            });
            return;
          }

          // Chance de crítico cai drasticamente contra mobs muito acima do nível
          const effectiveCritRate =
            levelGap >= 10
              ? 0.5
              : levelGap >= 4
                ? derivedCombat.critRateTotal * Math.max(0.15, 1 - (levelGap - 3) * 0.14)
                : derivedCombat.critRateTotal;
          const isCrit = Math.random() * 100 < effectiveCritRate;
          const baseScaled =
            kind === 'special2'
              ? Math.max(amount, derivedCombat.totalSpecial2Damage)
              : kind === 'special1'
                ? Math.max(amount, derivedCombat.totalSpecial1Damage)
                : Math.max(amount, derivedCombat.totalBasicDamage);
          const skillSpec =
            kind === 'special1'
              ? getDmoSkillSpec(formNow.id, 'f1')
              : kind === 'special2'
                ? getDmoSkillSpec(formNow.id, 'f2')
                : null;
          const matchup = computeDmoMatchupMultiplier(
            formNow.id,
            enemy.species,
            skillSpec?.element
          );

          // Defesa real (DE) do Digimon selvagem + Resistência por diferença de nível
          // Defesa reajustada para valorizar os +7% (4/5) e +15% (5/5) de atributos dos Digimons
          const enemyDefense =
            (9 +
              enemy.level * 4.4 +
              (enemy.level >= 10 ? (enemy.level - 9) * 1.4 : 0) +
              (enemy.level >= 20 ? (enemy.level - 19) * 5.6 : 0)) *
            (enemy.isBoss ? 1.4 : 1);
          const afterDefense = Math.max(
            4,
            baseScaled * matchup.multiplier -
              enemyDefense * (kind === 'basic' ? 0.52 : 0.34)
          );

          let levelDmgMult = 1;
          if (levelGap >= 3) {
            // Queda acentuada de dano ao enfrentar inimigos de nível muito superior
            levelDmgMult = Math.max(0.1, Math.pow(0.84, levelGap - 2));
          } else if (levelGap <= -4) {
            levelDmgMult = Math.min(1.25, 1 + Math.abs(levelGap + 3) * 0.04);
          }

          const resisted = levelGap >= 6;
          const matchedDamage = Math.max(
            resisted ? 2 : 6,
            Math.round(afterDefense * levelDmgMult)
          );
          const finalDamage = isCrit
            ? Math.round(matchedDamage * 1.5)
            : matchedDamage;
          const matchupTag = resisted
            ? ' RESISTIDO'
            : matchup.multiplier >= 1.45
              ? ' SUPER!'
              : matchup.multiplier >= 1.2
                ? ' VANT.'
                : '';
          enemy.hitFlashTimer = 0.16;

          const fxId = sim.nextFxId++;
          sim.combatEffects.push({
            id: fxId,
            kind,
            attackerX: sim.partner.x,
            attackerY: sim.partner.y,
            targetX: enemy.x,
            targetY: enemy.y,
            elapsed: 0,
            duration:
              kind === 'basic'
                ? 0.28
                : kind === 'special1'
                  ? 0.72
                  : 0.84,
          });

          const skillLabel =
            kind === 'special2'
              ? formNow.special2Name
              : kind === 'special1'
                ? formNow.special1Name
                : null;

          if (skillLabel) {
            sim.activeSkillBanner = `${skillLabel}!`;
            sim.skillBannerTimer = 1.1;
          }

          sim.floatingTexts.push({
            id: sim.nextFxId++,
            x: enemy.x,
            y: enemy.y - (enemy.isBoss ? 86 : 42),
            text:
              kind === 'basic'
                ? isCrit
                  ? `-${finalDamage} CRÍTICO!${matchupTag}`
                  : `-${finalDamage}${matchupTag}`
                : isCrit
                  ? `-${finalDamage} ${skillLabel ?? ''} CRÍTICO!${matchupTag}`
                  : `-${finalDamage} ${skillLabel ?? ''}!${matchupTag}`,
            color: resisted
              ? '#94a3b8'
              : isCrit
                ? '#fde047'
                : matchup.multiplier >= 1.45
                  ? '#4ade80'
                  : kind === 'special2'
                    ? formNow.theme.accentHex
                    : kind === 'special1'
                      ? '#fef08a'
                      : '#ffffff',
            elapsed: 0,
            duration: 0.85,
          });

          // Shared Multiplayer World Raid Boss damage submission (synced live via Firestore + local test fallback)
          if (enemy.isBoss && enemy.bossId) {
            bossParticipatedRef.current = true;
            const nextBossHp = Math.max(0, enemy.hp - finalDamage);
            enemy.hp = nextBossHp;
            if (nextBossHp <= 0) {
              enemy.alive = false;
              if (sim.partner.targetEnemyId === enemy.id) {
                sim.partner.targetEnemyId = null;
              }
            }
            void broadcastWorldCombatAction(
              {
                mapId: sim.mapId,
                channelId: currentChannelRef.current,
                worldX: sim.x,
                worldY: sim.y,
                partnerX: sim.partner.x,
                partnerY: sim.partner.y,
                partnerDir: sim.partner.dir,
                kind,
                targetId: enemy.id,
                targetX: enemy.x,
                targetY: enemy.y,
                damage: finalDamage,
                targetHpAfter: nextBossHp,
                killed: nextBossHp <= 0,
              },
              buildLocalPresenceSnapshot()
            );
            lastPresenceSyncRef.current.partnerX = sim.partner.x;
            lastPresenceSyncRef.current.partnerY = sim.partner.y;
            lastPresenceSyncRef.current.partnerMoving = false;
            lastPresenceSyncRef.current.sentAtMs = Date.now();
            enqueueWorldBossDamage(
              enemy.bossId,
              runtimeMetaRef.current.tamerName,
              finalDamage,
              nextBossHp
            );
            return;
          }

          const nextMobHp = Math.max(0, enemy.hp - finalDamage);
          enemy.hp = nextMobHp;
          const mobKilled = nextMobHp <= 0;

          // Broadcast live Partner Digimon hit + shared wild mob HP/kill to same-map, same-channel players
          void broadcastWorldCombatAction(
            {
              mapId: sim.mapId,
              channelId: currentChannelRef.current,
              worldX: sim.x,
              worldY: sim.y,
              partnerX: sim.partner.x,
              partnerY: sim.partner.y,
              partnerDir: sim.partner.dir,
              kind,
              targetId: enemy.id,
              targetX: enemy.x,
              targetY: enemy.y,
              damage: finalDamage,
              targetHpAfter: nextMobHp,
              killed: mobKilled,
            },
            buildLocalPresenceSnapshot()
          );
          lastPresenceSyncRef.current.partnerX = sim.partner.x;
          lastPresenceSyncRef.current.partnerY = sim.partner.y;
          lastPresenceSyncRef.current.partnerMoving = false;
          lastPresenceSyncRef.current.sentAtMs = Date.now();

          if (mobKilled) {
            enemy.alive = false;
            enemy.respawnTimer = 6.5;
            if (sim.partner.targetEnemyId === enemy.id) {
              sim.partner.targetEnemyId = null;
            }

            const prevAcc = hudAccountRef.current;
            const activeParty = playerPartyRef.current;
            const myChNow = currentChannelRef.current;
            const sameMapPartyCount = activeParty
              ? Math.max(
                  1,
                  activeParty.memberUids.filter((uid) => {
                    if (uid === actorUid) return true;
                    const live = remoteSmoothRef.current.get(uid)?.player;
                    const memberMap =
                      live?.mapId ?? activeParty.members[uid]?.mapId;
                    const memberCh =
                      live?.channelId ?? activeParty.members[uid]?.channelId;
                    return memberMap === sim.mapId && memberCh === myChNow;
                  }).length
                )
              : 1;
            const partyShareFactor = calcPartyShareFactor(sameMapPartyCount);

            const baseMobDigimonExp = Math.max(
              1,
              Math.round(
                calcDmoKillExp(
                  enemy.expReward,
                  prevAcc.digimon.level,
                  enemy.level
                ) * partyShareFactor
              )
            );
            const baseMobTamerExp = Math.max(
              1,
              Math.round(
                calcDmoKillExp(
                  enemy.expReward,
                  prevAcc.tamer.level,
                  enemy.level
                ) *
                  0.48 *
                  partyShareFactor
              )
            );
            const totalGuildExpBonusPct = guildDailyEventXpRef.current;
            const playerXpBoostPct = getActiveXpBoostBonusPct(prevAcc.xpBoostUntilMs);
            const autoFarmVipXpBonusPct =
              autoHuntConfigRef.current.enabled &&
              isAutoFarmVipActive(prevAcc, isGM)
                ? AUTO_FARM_VIP_XP_BONUS_PCT
                : 0;
            const gainedDigimonExp = applyServerExpMultiplier(
              baseMobDigimonExp,
              serverExpRateRef.current,
              totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
            );
            const gainedTamerExp = applyServerExpMultiplier(
              baseMobTamerExp,
              serverExpRateRef.current,
              totalGuildExpBonusPct + playerXpBoostPct + autoFarmVipXpBonusPct
            );
            const bitsDrop = 10 + enemy.level * 5;

            if (activeParty && sameMapPartyCount >= 2) {
              void publishPartyXpEvent({
                partyId: activeParty.partyId,
                killerUid: actorUid,
                killerName: runtimeMetaRef.current.tamerName,
                mapId: sim.mapId,
                channelId: myChNow,
                mobName: enemy.name,
                mobLevel: enemy.level,
                baseExp: enemy.expReward,
              });
            }

            const tamerRes = applyExpToTamer(
              prevAcc.tamer,
              gainedTamerExp,
              prevAcc.equippedItems
            );
            const digiRes = applyExpToDigimon(
              prevAcc.digimon,
              gainedDigimonExp,
              runtimeMetaRef.current.starterDigimonId
            );

            const dropRes = rollAndApplyDigimonDrops(
              prevAcc.inventory,
              enemy.species,
              Math.random,
              getUnlockedInventorySlots(prevAcc)
            );

            const nextAcc: AccountHudPersistence = {
              ...prevAcc,
              tamer: tamerRes.next,
              digimon: digiRes.next,
              bits: prevAcc.bits + bitsDrop,
              inventory: dropRes.nextInventory,
              defeatedEnemiesTotal: prevAcc.defeatedEnemiesTotal + 1,
              updatedAt: new Date().toISOString(),
            };
            commitHudAccount(nextAcc, dropRes.grantedDrops.length > 0);

            if (playerGuildRef.current) {
              const gId = playerGuildRef.current.guildId;
              const gName = playerGuildRef.current.name;
              void contributeGuildExp({
                guildId: gId,
                actorUid,
                tamerName: runtimeMetaRef.current.tamerName,
                tamerLevel: tamerRes.next.level,
                characterId: selection.characterId,
                digimonFormId: digiRes.next.activeFormId ?? starterDigimon.digimonId,
                expGain: Math.max(8, Math.round(enemy.expReward * 0.35)),
                mobsKilled: 1,
              }).then((gRes) => {
                if (gRes.leveledUp && gRes.newLevel) {
                  pushNotification(
                    'Guilda Subiu de Nível!',
                    `${gName} alcançou o Nível ${gRes.newLevel}!`
                  );
                }
              });
            }

            if (dropRes.grantedDrops.length > 0) {
              pushDropRewardToasts(dropRes.grantedDrops, enemy.name);
              spawnDigiEggDropAnimations(
                dropRes.grantedDrops,
                enemy.x,
                enemy.y,
                { sourceName: enemy.name, isBoss: Boolean(enemy.isBoss) }
              );
              const rareDrops = dropRes.grantedDrops.filter(
                (r) => r.category === 'digiegg' || r.itemKey === EVOLUTER_ITEM_KEY
              );
              if (rareDrops.length > 0) {
                pushNotification(
                  'Drop Raro Obtido!',
                  `${rareDrops.map((r) => `${r.name} x${r.quantity}`).join(', ')} dropado por ${enemy.name}!`
                );
              }
            }

            const bitsDropLabel = formatDigitalCurrency(bitsDrop);
            sim.floatingTexts.push({
              id: sim.nextFxId++,
              x: enemy.x,
              y: enemy.y - 60,
              text: `+${gainedDigimonExp} EXP · +${bitsDropLabel}`,
              color: '#4ade80',
              elapsed: 0,
              duration: 1.15,
            });

            pushChatMessage(
              'system',
              `${enemy.name} derrotado! +${gainedDigimonExp} EXP (${formNow.name}) e +${bitsDropLabel}.`,
              { tone: 'loot' }
            );
            for (const reward of dropRes.grantedDrops) {
              pushChatMessage(
                'system',
                `Item obtido: ${reward.name} x${reward.quantity} (armazenado no Inventário).`,
                { tone: 'loot' }
              );
            }
            if (dropRes.skippedFullDrops.length > 0) {
              pushChatMessage(
                'system',
                `Inventário cheio! Não foi possível guardar: ${dropRes.skippedFullDrops.map((d) => d.name).join(', ')}.`,
                { tone: 'warning' }
              );
            }
            if (tamerRes.leveledUp) {
              setLevelUpPulse(true);
              setTimeout(() => setLevelUpPulse(false), 1800);
              pushChatMessage(
                'system',
                `LEVEL UP! Tamer ${runtimeMetaRef.current.tamerName} alcançou o Nível ${tamerRes.next.level}!`,
                { tone: 'level' }
              );
            }
            if (digiRes.leveledUp) {
              setDigimonLevelUpPulse(true);
              setTimeout(() => setDigimonLevelUpPulse(false), 1800);
              pushChatMessage(
                'system',
                `LEVEL UP! ${formNow.name} alcançou o Nível ${digiRes.next.level}!`,
                { tone: 'level' }
              );
            }
            if (digiRes.newlyUnlockedForms.length > 0) {
              const activeLineStarterId = runtimeMetaRef.current.starterDigimonId;
              for (const unlocked of digiRes.newlyUnlockedForms) {
                const evoCost = getFormEvoluterCost(
                  activeLineStarterId,
                  unlocked.id
                );
                const needsEvoUnlock =
                  evoCost > 0 &&
                  !isEvolutionSlotUnlockedByEvoluter(
                    activeLineStarterId,
                    unlocked.id,
                    digiRes.next
                  );
                playDigitalTone('confirm', soundEnabled);
                setEvolutionUnlockAlert(unlocked);
                pushChatMessage(
                  'system',
                  needsEvoUnlock
                    ? `EVOLUÇÃO DISPONÍVEL! ${formNow.name} alcançou o Nível ${unlocked.unlockLevel}! Use ${evoCost} Evoluters para desbloquear ${unlocked.name}!`
                    : `EVOLUÇÃO DESBLOQUEADA! ${formNow.name} alcançou o Nível ${unlocked.unlockLevel} e está pronto para evoluir para ${unlocked.name}!`,
                  { tone: 'level' }
                );
                pushNotification(
                  needsEvoUnlock
                    ? `Desbloqueie ${unlocked.name}!`
                    : 'Evolução Desbloqueada!',
                  needsEvoUnlock
                    ? `${formNow.name} alcançou o Nv. ${unlocked.unlockLevel} e precisa de ${evoCost} Evoluters para liberar ${unlocked.name}.`
                    : `${formNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
                );
              }
            }
          }
        },
      });

      // Update VFX & floating damage timers
      if (sim.evoFlashTimer > 0) {
        sim.evoFlashTimer = Math.max(0, sim.evoFlashTimer - dt);
      }
      if (sim.evoAnim) {
        sim.evoAnim.elapsed += dt;
        if (sim.evoAnim.elapsed >= sim.evoAnim.duration) {
          sim.evoAnim = null;
        }
      }
      if (sim.swapAnim) {
        sim.swapAnim.elapsed += dt;
        if (sim.swapAnim.elapsed >= sim.swapAnim.duration) {
          sim.swapAnim = null;
        }
      }
      if (sim.skillBannerTimer > 0) {
        sim.skillBannerTimer = Math.max(0, sim.skillBannerTimer - dt);
        if (sim.skillBannerTimer === 0) sim.activeSkillBanner = null;
      }
      if (sim.combatEffects.length > 0) {
        let writeIdx = 0;
        for (let i = 0; i < sim.combatEffects.length; i++) {
          const fx = sim.combatEffects[i];
          fx.elapsed += dt;
          if (fx.elapsed < fx.duration) {
            sim.combatEffects[writeIdx++] = fx;
          }
        }
        sim.combatEffects.length = writeIdx;
      }
      if (sim.bossAoeEffects.length > 0) {
        let writeIdx = 0;
        for (let i = 0; i < sim.bossAoeEffects.length; i++) {
          const bfx = sim.bossAoeEffects[i];
          bfx.elapsed += dt;
          if (bfx.elapsed < bfx.duration) {
            sim.bossAoeEffects[writeIdx++] = bfx;
          }
        }
        sim.bossAoeEffects.length = writeIdx;
      }
      if (sim.floatingTexts.length > 0) {
        let writeIdx = 0;
        for (let i = 0; i < sim.floatingTexts.length; i++) {
          const ft = sim.floatingTexts[i];
          ft.elapsed += dt;
          ft.y -= dt * 28;
          if (ft.elapsed < ft.duration) {
            sim.floatingTexts[writeIdx++] = ft;
          }
        }
        sim.floatingTexts.length = writeIdx;
      }
      if (sim.eggDropFx.length > 0) {
        let writeIdx = 0;
        for (let i = 0; i < sim.eggDropFx.length; i++) {
          const eggFx = sim.eggDropFx[i];
          eggFx.elapsed += dt;
          if (eggFx.elapsed < eggFx.duration) {
            sim.eggDropFx[writeIdx++] = eggFx;
          }
        }
        sim.eggDropFx.length = writeIdx;
      }

      // 3. Detect proximity to interaction points, Interconnected Portals & Exploration Zones
      let closestPt: DatsInteractionPoint | null = null;
      if (isDTerminal) {
        const dtPortals = getPortalsForMap(D_TERMINAL_MAP_ID);
        const dtReturnPortal = dtPortals[0] ?? null;
        const nearDtReturn =
          dtReturnPortal !== null &&
          Math.hypot(sim.x - dtReturnPortal.x, sim.y - dtReturnPortal.y) <=
            dtReturnPortal.radius;

        nearbyPortalRef.current = nearDtReturn ? dtReturnPortal : null;
        sim.nearReturnPortal = nearDtReturn;

        const distConductor = Math.hypot(
          sim.x - D_TERMINAL_CONDUCTOR_NPC.x,
          sim.y - D_TERMINAL_CONDUCTOR_NPC.y
        );
        const nearConductor = distConductor <= D_TERMINAL_CONDUCTOR_NPC.radius;
        sim.nearbyPointId =
          !nearDtReturn && nearConductor ? D_TERMINAL_CONDUCTOR_NPC.id : null;

        if (
          pendingTargetPortalRef.current &&
          nearDtReturn &&
          !overlayLayerRef.current.hud &&
          !overlayLayerRef.current.portalConfirm
        ) {
          const targetPortal = pendingTargetPortalRef.current;
          pendingTargetPortalRef.current = null;
          sim.tapTarget = null;
          sim.keyOrder = [];
          attemptPortalTravel(targetPortal);
        } else if (
          pendingConductorWalkRef.current &&
          nearConductor &&
          !overlayLayerRef.current.hud &&
          !overlayLayerRef.current.station
        ) {
          pendingConductorWalkRef.current = false;
          sim.tapTarget = null;
          sim.keyOrder = [];
          setActiveStationModal(D_TERMINAL_INTERACTION_POINTS[0]);
          playDigitalTone('confirm', soundEnabled);
        }
      } else if (!isCombatMap) {
        nearbyPortalRef.current = null;
        let closestDist = Infinity;
        for (const pt of DATS_INTERACTION_POINTS) {
          const d = Math.hypot(sim.x - pt.x, sim.y - pt.y);
          if (d <= pt.radius && d < closestDist) {
            closestDist = d;
            closestPt = pt;
          }
        }
        sim.nearbyPointId = closestPt?.id ?? null;
        sim.nearReturnPortal = false;

        if (closestPt && !sim.discoveredZones.has(closestPt.id)) {
          sim.discoveredZones.add(closestPt.id);
          sim.lastSaveTs = now;
          persistProgress();
        }

        if (
          pendingIncubatorWalkRef.current &&
          closestPt?.id === DATS_INCUBATOR_STATION.id &&
          !overlayLayerRef.current.hud
        ) {
          pendingIncubatorWalkRef.current = false;
          sim.tapTarget = null;
          sim.keyOrder = [];
          setActiveStationModal(null);
          setActiveHudWindow('incubator');
          playDigitalTone('confirm', soundEnabled);
        } else if (
          pendingArchiveWalkRef.current &&
          closestPt?.id === DATS_ARCHIVE_STATION.id &&
          !overlayLayerRef.current.hud
        ) {
          pendingArchiveWalkRef.current = false;
          sim.tapTarget = null;
          sim.keyOrder = [];
          setActiveStationModal(null);
          setActiveHudWindow('archive');
          playDigitalTone('confirm', soundEnabled);
        } else if (
          pendingPortalWalkRef.current &&
          closestPt?.id === 'digital-world-portal' &&
          !overlayLayerRef.current.hud &&
          !overlayLayerRef.current.portalConfirm
        ) {
          pendingPortalWalkRef.current = false;
          sim.tapTarget = null;
          sim.keyOrder = [];
          attemptPortalTravel(DATS_SOUTH_PORTAL_LINK);
        } else if (
          pendingDatsPointIdRef.current &&
          closestPt?.id === pendingDatsPointIdRef.current &&
          !overlayLayerRef.current.hud &&
          !overlayLayerRef.current.station
        ) {
          pendingDatsPointIdRef.current = null;
          sim.tapTarget = null;
          sim.keyOrder = [];
          setActiveStationModal(closestPt);
          playDigitalTone('confirm', soundEnabled);
        }
      } else {
        const activeInteractionPts = isVirtualWorld
          ? VIRTUAL_WORLD_INTERACTION_POINTS
          : isDarkArea
            ? DARK_AREA_INTERACTION_POINTS
            : isDigimonIsland
              ? DIGIMON_ISLAND_INTERACTION_POINTS
              : isDataSea
                ? DATA_SEA_INTERACTION_POINTS
                : isDigitalDesert
                  ? DIGITAL_DESERT_INTERACTION_POINTS
                  : isDigiMountain
                    ? DIGI_MOUNTAIN_INTERACTION_POINTS
                    : isDataForest
                      ? DATA_FOREST_INTERACTION_POINTS
                      : HUNTING_INTERACTION_POINTS;

        const mapPortals = getPortalsForMap(sim.mapId);
        let nearestPortal: MapPortalLink | null = null;
        let nearestPortalDist = Infinity;
        for (const portal of mapPortals) {
          const d = Math.hypot(sim.x - portal.x, sim.y - portal.y);
          if (d <= portal.radius && d < nearestPortalDist) {
            nearestPortalDist = d;
            nearestPortal = portal;
          }
        }
        nearbyPortalRef.current = nearestPortal;
        sim.nearReturnPortal = nearestPortal !== null;

        if (
          pendingTargetPortalRef.current &&
          !overlayLayerRef.current.hud &&
          !overlayLayerRef.current.portalConfirm
        ) {
          const targetPortal = pendingTargetPortalRef.current;
          const distToTarget = Math.hypot(
            sim.x - targetPortal.x,
            sim.y - targetPortal.y
          );
          if (distToTarget <= targetPortal.radius) {
            pendingTargetPortalRef.current = null;
            sim.tapTarget = null;
            sim.keyOrder = [];
            attemptPortalTravel(targetPortal);
          }
        }

        let closestDist = Infinity;
        for (const pt of activeInteractionPts) {
          const d = Math.hypot(sim.x - pt.x, sim.y - pt.y);
          if (d <= pt.radius && d < closestDist) {
            closestDist = d;
            closestPt = pt;
          }
        }
        sim.nearbyPointId = sim.nearReturnPortal ? null : (closestPt?.id ?? null);

        const activeZone = isVirtualWorld
          ? getVirtualWorldZoneAtPoint(sim.x, sim.y)
          : isDarkArea
            ? getDarkAreaZoneAtPoint(sim.x, sim.y)
            : isDigimonIsland
              ? getDigimonIslandZoneAtPoint(sim.x, sim.y)
              : isDataSea
                ? getDataSeaZoneAtPoint(sim.x, sim.y)
                : isDigitalDesert
                  ? getDigitalDesertZoneAtPoint(sim.x, sim.y)
                  : isDigiMountain
                    ? getDigiMountainZoneAtPoint(sim.x, sim.y)
                    : isDataForest
                      ? getDataForestZoneAtPoint(sim.x, sim.y)
                      : getHuntingZoneAtPoint(sim.x, sim.y);
        if (activeZone && !sim.discoveredZones.has(activeZone.id)) {
          sim.discoveredZones.add(activeZone.id);
          sim.lastSaveTs = now;
          persistProgress();
        }
      }

      if (moveDir && now - sim.lastSaveTs > 5000) {
        sim.lastSaveTs = now;
        persistPositionOnly();
      }

      const activeEvoAnim = sim.evoAnim;
      const activeSwapAnim = sim.swapAnim;
      const renderForm =
        activeEvoAnim &&
        activeEvoAnim.elapsed < activeEvoAnim.duration * activeEvoAnim.swapPoint
          ? getDigimonFormProfile(activeEvoAnim.fromFormId as DigimonFormId)
          : activeSwapAnim &&
              activeSwapAnim.elapsed <
                activeSwapAnim.duration * activeSwapAnim.swapPoint
            ? getDigimonFormProfile(activeSwapAnim.fromFormId as DigimonFormId)
            : activeFormRef.current;

      // 4. Smooth Camera clamped cleanly inside active world map
      const cameraZoom = getWorldCameraZoom(
        viewW,
        viewH,
        worldW,
        worldH,
        isCombatMap
      );
      const effViewW = viewW / cameraZoom;
      const effViewH = viewH / cameraZoom;
      const halfW = effViewW / 2;
      const halfH = effViewH / 2;
      const isPortraitMobile = viewW < 640 && viewH > viewW;
      const cameraVerticalBias = isPortraitMobile ? 64 : 44;
      const focusX = isEvolving ? sim.partner.x : sim.x;
      const focusY = isEvolving ? sim.partner.y - 24 : sim.y - cameraVerticalBias;
      const targetCamX =
        effViewW >= worldW
          ? worldW / 2
          : Math.max(halfW, Math.min(worldW - halfW, focusX));
      const targetCamY =
        effViewH >= worldH
          ? worldH / 2
          : Math.max(halfH, Math.min(worldH - halfH, focusY));

      const camLerp = Math.min(1, dt * (isEvolving ? 11 : 8));
      sim.camX += (targetCamX - sim.camX) * camLerp;
      sim.camY += (targetCamY - sim.camY) * camLerp;

      // 5. Render Active Map + Depth-Sorted Props, Enemies, Tamer & Partner Digimon
      // When a fullscreen modal covers the world (Personagem, Digimon, Inventário, Incubadora, Shop, etc.),
      // draw 1 clean frozen frame and then pause world redraws until the modal closes so the UI runs at full FPS
      const modalCoveringWorld =
        (overlayLayerRef.current.hud && activeHudWindowRef.current !== 'map') ||
        overlayLayerRef.current.inventory ||
        overlayLayerRef.current.mudShop ||
        overlayLayerRef.current.station;

      let shouldDrawWorldFrame = true;
      if (modalCoveringWorld) {
        if (modalDrewFrozenFrame) {
          shouldDrawWorldFrame = false;
        } else {
          modalDrewFrozenFrame = true;
        }
      } else {
        modalDrewFrozenFrame = false;
      }

      if (shouldDrawWorldFrame) {
      const renderCamX = Math.round(sim.camX);
      const renderCamY = Math.round(sim.camY);

      ctx!.clearRect(0, 0, viewW, viewH);
      ctx!.save();
      ctx!.translate(viewW / 2, viewH / 2);
      if (cameraZoom !== 1) {
        ctx!.scale(cameraZoom, cameraZoom);
      }
      ctx!.translate(-renderCamX, -renderCamY);

      // Viewport-sliced ground blit: maps are already pre-baked at high-DPI quality,
      // so hardware 'medium' bilinear filtering preserves 100% sharpness at ~50% lower mobile GPU cost
      const visLeft = Math.max(0, Math.floor(renderCamX - halfW - 12));
      const visTop = Math.max(0, Math.floor(renderCamY - halfH - 12));
      const visRight = Math.min(worldW, Math.ceil(renderCamX + halfW + 12));
      const visBottom = Math.min(worldH, Math.ceil(renderCamY + halfH + 12));
      const visW = Math.max(1, visRight - visLeft);
      const visH = Math.max(1, visBottom - visTop);

      let activeProps: Array<{ sortY: number; draw: (c: CanvasRenderingContext2D, el: number) => void }>;

      if (isVirtualWorld) {
        const vw = ensureVirtualWorldAssets();
        const scaleX = vw.ground.width / VIRTUAL_WORLD_WORLD_W;
        const scaleY = vw.ground.height / VIRTUAL_WORLD_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          vw.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawVirtualWorldGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = vw.props;
      } else if (isDarkArea) {
        const da = ensureDarkAreaAssets();
        const scaleX = da.ground.width / DARK_AREA_WORLD_W;
        const scaleY = da.ground.height / DARK_AREA_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          da.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDarkAreaGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = da.props;
      } else if (isDigimonIsland) {
        const di = ensureDigimonIslandAssets();
        const scaleX = di.ground.width / DIGIMON_ISLAND_WORLD_W;
        const scaleY = di.ground.height / DIGIMON_ISLAND_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          di.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDigimonIslandGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = di.props;
      } else if (isDataSea) {
        const sea = ensureDataSeaAssets();
        const scaleX = sea.ground.width / DATA_SEA_WORLD_W;
        const scaleY = sea.ground.height / DATA_SEA_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          sea.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDataSeaGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = sea.props;
      } else if (isDigitalDesert) {
        const ds = ensureDigitalDesertAssets();
        const scaleX = ds.ground.width / DIGITAL_DESERT_WORLD_W;
        const scaleY = ds.ground.height / DIGITAL_DESERT_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          ds.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDigitalDesertGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = ds.props;
      } else if (isDigiMountain) {
        const dm = ensureDigiMountainAssets();
        const scaleX = dm.ground.width / DIGI_MOUNTAIN_WORLD_W;
        const scaleY = dm.ground.height / DIGI_MOUNTAIN_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          dm.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDigiMountainGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = dm.props;
      } else if (isDataForest) {
        const df = ensureDataForestAssets();
        const scaleX = df.ground.width / DATA_FOREST_WORLD_W;
        const scaleY = df.ground.height / DATA_FOREST_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          df.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDataForestGroundAnimations(
          ctx!,
          elapsed,
          sim.nearReturnPortal,
          worldBossRef.current?.alive ?? true
        );
        activeProps = df.props;
      } else if (isHunting) {
        const hf = ensureHuntingAssets();
        const scaleX = hf.ground.width / HUNTING_WORLD_W;
        const scaleY = hf.ground.height / HUNTING_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          hf.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawHuntingGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
        activeProps = hf.props;
      } else if (isDTerminal) {
        const dtMap = ensureDTerminalAssets();
        const scaleX = dtMap.ground.width / D_TERMINAL_WORLD_W;
        const scaleY = dtMap.ground.height / D_TERMINAL_WORLD_H;
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          dtMap.ground,
          visLeft * scaleX,
          visTop * scaleY,
          visW * scaleX,
          visH * scaleY,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDTerminalGroundAnimations(
          ctx!,
          elapsed,
          sim.nearbyPointId === D_TERMINAL_CONDUCTOR_NPC.id,
          sim.nearReturnPortal
        );
        activeProps = dtMap.props;
      } else {
        const dats = ensureDatsAssets();
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'medium';
        ctx!.drawImage(
          dats.ground,
          visLeft,
          visTop,
          visW,
          visH,
          visLeft,
          visTop,
          visW,
          visH
        );
        drawDatsGroundAnimations(ctx!, elapsed, sim.nearbyPointId);
        activeProps = dats.props;
      }

      // Unified Interconnected Dimensional Portal Ground Projections on all Combat Maps
      const activeCombatPortals = isCombatMap ? getPortalsForMap(sim.mapId) : [];
      for (const portal of activeCombatPortals) {
        const isNearThisPortal = nearbyPortalRef.current?.id === portal.id;
        drawDimensionalPortalGround(
          ctx!,
          portal.x,
          portal.y,
          elapsed,
          isNearThisPortal,
          { scale: portal.scale ?? 0.96, theme: portal.theme }
        );
      }

      if (sim.tapTarget) {
        const pulse = 1 + Math.sin(elapsed * 9) * 0.18;
        ctx!.save();
        ctx!.strokeStyle = '#38e8ff';
        ctx!.lineWidth = 2.5;
        ctx!.beginPath();
        ctx!.arc(sim.tapTarget.x, sim.tapTarget.y, 14 * pulse, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.fillStyle = 'rgba(56, 232, 255, 0.24)';
        ctx!.fill();
        ctx!.restore();
      }

      drawables.length = 0;

      // Vertical frustum culling for map props keeps off-screen decorations out of sort/draw
      const propMinY = renderCamY - halfH - 280;
      const propMaxY = renderCamY + halfH + 340;
      for (const prop of activeProps) {
        if (prop.sortY < propMinY || prop.sortY > propMaxY) continue;
        drawables.push({
          sortY: prop.sortY,
          draw: () => prop.draw(ctx!, elapsed),
        });
      }

      for (const portal of activeCombatPortals) {
        if (portal.y < propMinY || portal.y > propMaxY) continue;
        const isNearThisPortal = nearbyPortalRef.current?.id === portal.id;
        drawables.push({
          sortY: portal.y,
          draw: () =>
            drawDimensionalPortalGate(
              ctx!,
              portal.x,
              portal.y,
              elapsed,
              isNearThisPortal,
              {
                scale: portal.scale ?? 0.96,
                theme: portal.theme,
                title: portal.title,
                subtitle: portal.subtitle,
              }
            ),
        });
      }

      if (isCombatMap) {
        // Frustum-cull wild Digimon outside the active camera viewport for locked 60fps on mobile
        const cullMargin = 220;
        const camMinX = renderCamX - halfW - cullMargin;
        const camMaxX = renderCamX + halfW + cullMargin;
        const camMinY = renderCamY - halfH - cullMargin;
        const camMaxY = renderCamY + halfH + cullMargin;

        for (const enemy of sim.enemies) {
          if (!enemy.alive) continue;
          if (
            enemy.x < camMinX ||
            enemy.x > camMaxX ||
            enemy.y < camMinY ||
            enemy.y > camMaxY
          ) {
            continue;
          }
          const targeted = sim.partner.targetEnemyId === enemy.id;
          drawables.push({
            sortY: enemy.y,
            draw: () => drawEnemyMonster(ctx!, enemy, elapsed, targeted),
          });
        }
      } else if (sim.mapId === DATS_MAP_ID) {
        // Fixed Official DATS NPCs (Richard Sampson, MudFrigimon)
        for (const npc of DATS_FIXED_NPCS) {
          drawables.push({
            sortY: npc.y,
            draw: () => {
              const isNearNpc =
                Math.hypot(sim.x - npc.x, sim.y - npc.y) <= 98;
              drawFixedWorldNpc(ctx!, npc, elapsed, {
                hovered: hoveredNpcIdRef.current === npc.id,
                nearby: isNearNpc,
              });
            },
          });
        }
      }

      // Player Tamer (with subtle 2.5D depth scaling on Combat Maps)
      drawables.push({
        sortY: sim.y,
        draw: () => {
          const pScale = getMapPerspectiveScale(sim.mapId, sim.y);
          ctx!.save();
          if (pScale !== 1) {
            ctx!.translate(sim.x, sim.y);
            ctx!.scale(pScale, pScale);
            ctx!.translate(-sim.x, -sim.y);
          }

          ctx!.save();
          ctx!.fillStyle = 'rgba(0, 0, 0, 0.38)';
          ctx!.beginPath();
          ctx!.ellipse(sim.x, sim.y + 2, 21, 7, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();

          const liveMeta = runtimeMetaRef.current;
          const drew = drawTamerMovementFrame(
            ctx!,
            liveMeta.characterId,
            sim.state,
            sim.dir,
            sim.frameIndex,
            elapsed,
            sim.x,
            sim.y
          );

          if (!drew) {
            ctx!.save();
            ctx!.strokeStyle = liveMeta.accentHex;
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            ctx!.arc(sim.x, sim.y - 36, 14, elapsed * 4, elapsed * 4 + Math.PI * 1.4);
            ctx!.stroke();
            ctx!.restore();
          }

          const tagY = sim.y - 94;
          if (liveMeta.showPlayerNames) {
            ctx!.save();
            const localFont = '700 12px "Exo 2", sans-serif';
            ctx!.font = localFont;
            ctx!.textAlign = 'center';
            const localTagText = isGM
              ? `★ GM ${liveMeta.tamerName}`
              : liveMeta.tamerName;
            const tw = measureTextCached(ctx!, localFont, localTagText) + 14;
            ctx!.fillStyle = 'rgba(4, 17, 46, 0.88)';
            ctx!.beginPath();
            ctx!.roundRect(sim.x - tw / 2, tagY - 14, tw, 18, 6);
            ctx!.fill();
            ctx!.strokeStyle = isGM ? '#facc15' : liveMeta.accentHex;
            ctx!.lineWidth = isGM ? 1.4 : 1;
            ctx!.stroke();
            ctx!.fillStyle = isGM ? '#fef08a' : '#ffffff';
            ctx!.fillText(localTagText, sim.x, tagY - 1);
            ctx!.restore();
          }

          // Local overhead chat bubble
          if (
            liveMeta.showChatBubbles &&
            localBubbleRef.current &&
            Date.now() < localBubbleRef.current.expiresAt
          ) {
            drawSpeechBubble(
              ctx!,
              sim.x,
              tagY - 16,
              localBubbleRef.current.text,
              isGM ? '#facc15' : liveMeta.accentHex
            );
          }

          ctx!.restore();
        },
      });

      // Other Live Online Players & Their Partner Digimons on the SAME Map & SAME Channel
      const nowFrameMs = Date.now();
      const activeChNow = currentChannelRef.current;
      for (const smooth of remoteSmoothRef.current.values()) {
        const rp = smooth.player;
        if (rp.mapId !== sim.mapId || rp.channelId !== activeChNow) continue;

        // Bounded dead-reckoning + constant-velocity steering (eliminates stop-start stuttering)
        const packetAgeSec = Math.max(
          0,
          (nowFrameMs - smooth.lastPacketAtMs) / 1000
        );
        const predictSec =
          rp.moveState === 'walk' ? Math.min(0.24, packetAgeSec) : 0;
        const predX = smooth.targetX + smooth.vx * predictSec;
        const predY = smooth.targetY + smooth.vy * predictSec;
        const tDx = predX - smooth.renderX;
        const tDy = predY - smooth.renderY;
        const tDist = Math.hypot(tDx, tDy);
        if (tDist > 360) {
          smooth.renderX = rp.worldX;
          smooth.renderY = rp.worldY;
        } else if (tDist > 0.6) {
          const moveSpeed = Math.max(135, Math.min(340, tDist * 7.2));
          const step = Math.min(tDist, moveSpeed * dt);
          smooth.renderX += (tDx / tDist) * step;
          smooth.renderY += (tDy / tDist) * step;
        }
        if (tDist > 4) {
          smooth.visualDir = snapToCardinalVector(tDx, tDy).dir;
        } else {
          smooth.visualDir = rp.facingDir;
        }

        const pPredictSec = rp.partnerMoving ? Math.min(0.24, packetAgeSec) : 0;
        const predPX = smooth.partnerTargetX + smooth.partnerVx * pPredictSec;
        const predPY = smooth.partnerTargetY + smooth.partnerVy * pPredictSec;
        const pDx = predPX - smooth.partnerRenderX;
        const pDy = predPY - smooth.partnerRenderY;
        const pDist = Math.hypot(pDx, pDy);
        if (pDist > 360) {
          smooth.partnerRenderX = rp.partnerX;
          smooth.partnerRenderY = rp.partnerY;
        } else if (pDist > 0.6) {
          const pMoveSpeed = Math.max(150, Math.min(390, pDist * 7.5));
          const pStep = Math.min(pDist, pMoveSpeed * dt);
          smooth.partnerRenderX += (pDx / pDist) * pStep;
          smooth.partnerRenderY += (pDy / pDist) * pStep;
        }
        if (pDist > 4) {
          smooth.partnerVisualDir = snapToCardinalVector(pDx, pDy).dir;
        } else {
          smooth.partnerVisualDir = rp.partnerDir;
        }

        const isRemoteWalking =
          tDist > 2.5 || (rp.moveState === 'walk' && packetAgeSec < 0.65);
        if (isRemoteWalking) {
          smooth.frameTime += dt;
          if (smooth.frameTime >= 0.095) {
            smooth.frameTime = 0;
            smooth.frameIndex = (smooth.frameIndex + 1) % TAMER_FRAME_WRAP;
          }
        } else {
          smooth.frameTime = 0;
          smooth.frameIndex = 0;
        }

        if (smooth.activeAttack) {
          smooth.activeAttack.elapsed += dt;
          if (smooth.activeAttack.elapsed >= smooth.activeAttack.duration) {
            smooth.activeAttack = null;
          }
        }

        const isRemotePartnerMoving =
          !smooth.activeAttack &&
          (pDist > 2.5 || (rp.partnerMoving && packetAgeSec < 0.65));
        if (isRemotePartnerMoving) {
          smooth.partnerFrameTime += dt;
          if (smooth.partnerFrameTime >= 0.14) {
            smooth.partnerFrameTime = 0;
            smooth.partnerFrameIndex =
              (smooth.partnerFrameIndex + 1) % DIGIMON_FRAME_COUNT;
          }
        } else {
          smooth.partnerFrameTime = 0;
          smooth.partnerFrameIndex = 0;
        }
        const remoteAttackSnap = smooth.activeAttack
          ? { ...smooth.activeAttack }
          : null;

        const rX = smooth.renderX;
        const rY = smooth.renderY;
        const rDir = smooth.visualDir;
        const rpX = smooth.partnerRenderX;
        const rpY = smooth.partnerRenderY;
        const rpDir = smooth.partnerVisualDir;
        const rFrame = smooth.frameIndex;
        const rpFrame = smooth.partnerFrameIndex;
        const rCharMeta =
          TAMER_CHARACTERS.find((c) => c.id === rp.characterId) ??
          TAMER_CHARACTERS[0];
        const rForm = getDigimonFormProfile(rp.digimonFormId);
        const rDims = rForm.worldDimensions;
        const rBubbleText =
          smooth.bubbleText && nowFrameMs < smooth.bubbleExpiresAt
            ? smooth.bubbleText
            : '';

        // Remote Tamer Drawable
        drawables.push({
          sortY: rY,
          draw: () => {
            const pScale = getMapPerspectiveScale(sim.mapId, rY);
            ctx!.save();
            if (pScale !== 1) {
              ctx!.translate(rX, rY);
              ctx!.scale(pScale, pScale);
              ctx!.translate(-rX, -rY);
            }

            // Ground shadow + subtle online presence aura ring
            ctx!.save();
            ctx!.fillStyle = 'rgba(0, 0, 0, 0.36)';
            ctx!.beginPath();
            ctx!.ellipse(rX, rY + 2, 21, 7, 0, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.strokeStyle = rp.isGm
              ? 'rgba(250, 204, 21, 0.65)'
              : 'rgba(52, 211, 153, 0.55)';
            ctx!.lineWidth = 1.4;
            ctx!.beginPath();
            ctx!.ellipse(rX, rY + 2, 23, 8, 0, 0, Math.PI * 2);
            ctx!.stroke();
            ctx!.restore();

            const drew = drawTamerMovementFrame(
              ctx!,
              rp.characterId,
              isRemoteWalking ? 'walk' : 'idle',
              rDir,
              rFrame,
              elapsed,
              rX,
              rY
            );

            if (!drew) {
              ctx!.save();
              ctx!.fillStyle = rCharMeta.theme.accentHex;
              ctx!.beginPath();
              ctx!.arc(rX, rY - 36, 13, 0, Math.PI * 2);
              ctx!.fill();
              ctx!.restore();
            }

            // Remote Tamer Nameplate (with GM Crown or Level tag)
            const tagY = rY - 94;
            if (runtimeMetaRef.current.showPlayerNames) {
              ctx!.save();
              const remoteFont = '700 11.5px "Exo 2", sans-serif';
              ctx!.font = remoteFont;
              ctx!.textAlign = 'center';
              const label = rp.isGm
                ? `★ GM ${rp.tamerName}`
                : `${rp.tamerName} Lv.${rp.tamerLevel}`;
              const tw = measureTextCached(ctx!, remoteFont, label) + 14;
              ctx!.fillStyle = rp.isGm
                ? 'rgba(42, 22, 4, 0.92)'
                : 'rgba(4, 22, 44, 0.88)';
              ctx!.beginPath();
              ctx!.roundRect(rX - tw / 2, tagY - 14, tw, 18, 6);
              ctx!.fill();
              ctx!.strokeStyle = rp.isGm ? '#facc15' : '#34d399';
              ctx!.lineWidth = rp.isGm ? 1.5 : 1.1;
              ctx!.stroke();
              ctx!.fillStyle = rp.isGm ? '#fef08a' : '#d1fae5';
              ctx!.fillText(label, rX, tagY - 1);
              ctx!.restore();
            }

            if (rBubbleText && runtimeMetaRef.current.showChatBubbles) {
              drawSpeechBubble(
                ctx!,
                rX,
                tagY - 16,
                rBubbleText,
                rp.isGm ? '#facc15' : '#34d399'
              );
            }

            ctx!.restore();
          },
        });

        // Remote Partner Digimon Drawable (exact canonical evolution height & width)
        drawables.push({
          sortY: rpY,
          draw: () => {
            const pScale = getMapPerspectiveScale(sim.mapId, rpY);
            ctx!.save();
            if (pScale !== 1) {
              ctx!.translate(rpX, rpY);
              ctx!.scale(pScale, pScale);
              ctx!.translate(-rpX, -rpY);
            }

            ctx!.save();
            const rAerial = getPartnerAerialProfile(rForm.id);
            const rLiveAlt = rAerial.isAerial
              ? getPartnerLiveHoverAltitude(
                  rForm.id,
                  isRemotePartnerMoving ? 'walk' : 'idle',
                  elapsed
                )
              : 0;
            const rAltRatio = rAerial.isAerial
              ? Math.max(0, Math.min(1, rLiveAlt / 36))
              : 0;
            const rShadowScale = rAerial.isAerial ? 0.9 - rAltRatio * 0.22 : 1;

            ctx!.fillStyle = rAerial.isAerial
              ? `rgba(0, 0, 0, ${(0.2 - rAltRatio * 0.06).toFixed(2)})`
              : 'rgba(0, 0, 0, 0.22)';
            ctx!.beginPath();
            ctx!.ellipse(
              rpX,
              rpY + 1.5,
              rDims.shadowRx * 1.08 * rShadowScale,
              rDims.shadowRy * 1.06 * rShadowScale,
              0,
              0,
              Math.PI * 2
            );
            ctx!.fill();
            ctx!.fillStyle = rAerial.isAerial
              ? `rgba(0, 0, 0, ${(0.29 - rAltRatio * 0.09).toFixed(2)})`
              : 'rgba(0, 0, 0, 0.34)';
            ctx!.beginPath();
            ctx!.ellipse(
              rpX,
              rpY + 1,
              rDims.shadowRx * 0.78 * rShadowScale,
              rDims.shadowRy * 0.72 * rShadowScale,
              0,
              0,
              Math.PI * 2
            );
            ctx!.fill();
            ctx!.restore();

            if (isRemotePartnerMoving && !rAerial.isAerial) {
              const stepVector =
                rpDir === 'W'
                  ? { vx: 1, vy: 0.1 }
                  : rpDir === 'E'
                    ? { vx: -1, vy: 0.1 }
                    : rpDir === 'N'
                      ? { vx: 0, vy: 1 }
                      : { vx: 0, vy: -0.6 };
              ctx!.save();
              for (let di = 0; di < 3; di++) {
                const phase = (elapsed * 3.8 + di * 0.33) % 1;
                const px = rpX + stepVector.vx * (10 + phase * 26) + (di - 1) * 5;
                const py = rpY + stepVector.vy * (4 + phase * 14) - phase * 6;
                ctx!.globalAlpha = (1 - phase) * 0.42;
                ctx!.fillStyle = di === 1 ? rForm.theme.accentHex : 'rgba(226, 232, 240, 0.85)';
                ctx!.beginPath();
                ctx!.arc(px, py, Math.max(1.5, (1 - phase) * 5.2), 0, Math.PI * 2);
                ctx!.fill();
              }
              ctx!.restore();
            }

            if (remoteAttackSnap) {
              const prog =
                remoteAttackSnap.elapsed /
                Math.max(0.1, remoteAttackSnap.duration);
              drawDigimonAttackPoseFrame(
                ctx!,
                rForm.id,
                remoteAttackSnap.kind,
                remoteAttackSnap.facingRight,
                prog,
                rpX,
                rpY
              );
            } else {
              drawDigimonPartnerFrame(
                ctx!,
                rForm.id,
                isRemotePartnerMoving ? 'walk' : 'idle',
                rpDir,
                rpFrame,
                elapsed,
                rpX,
                rpY
              );
            }

            ctx!.save();
            const remotePartnerFont = '700 10px "Exo 2", sans-serif';
            ctx!.font = remotePartnerFont;
            ctx!.textAlign = 'center';
            const pTagY = rpY - rDims.nameplateOffsetY - rAerial.nameplateLift;
            const pName = `${rForm.name}`;
            const ptw = measureTextCached(ctx!, remotePartnerFont, pName) + 10;
            ctx!.fillStyle = 'rgba(4, 17, 46, 0.84)';
            ctx!.beginPath();
            ctx!.roundRect(rpX - ptw / 2, pTagY - 12, ptw, 14, 5);
            ctx!.fill();
            ctx!.strokeStyle = rForm.theme.accentHex;
            ctx!.lineWidth = 0.9;
            ctx!.stroke();
            ctx!.fillStyle = rForm.theme.accentHex;
            ctx!.fillText(pName, rpX, pTagY - 1.5);
            ctx!.restore();

            ctx!.restore();
          },
        });
      }

      // Active Digimon Partner (uses current Evolution Form sprites, studied worldDimensions, 2.5D depth & FX)
      const dims = renderForm.worldDimensions;
      drawables.push({
        sortY: sim.partner.y,
        draw: () => {
          const hatchScale = computeHatchVisualScale(
            hudAccountRef.current.digimon.hatchSizePct
          );
          const pScale =
            getMapPerspectiveScale(sim.mapId, sim.partner.y) * hatchScale;
          ctx!.save();
          if (pScale !== 1) {
            ctx!.translate(sim.partner.x, sim.partner.y);
            ctx!.scale(pScale, pScale);
            ctx!.translate(-sim.partner.x, -sim.partner.y);
          }

          const aerial = getPartnerAerialProfile(renderForm.id);
          const liveHoverAlt = aerial.isAerial
            ? getPartnerLiveHoverAltitude(
                renderForm.id,
                sim.partner.isMoving ? 'walk' : 'idle',
                elapsed
              )
            : 0;
          const altRatio = aerial.isAerial
            ? Math.max(0, Math.min(1, liveHoverAlt / 36))
            : 0;
          const shadowScale = aerial.isAerial ? 0.9 - altRatio * 0.22 : 1;

          ctx!.save();
          ctx!.fillStyle = aerial.isAerial
            ? `rgba(0, 0, 0, ${(0.2 - altRatio * 0.06).toFixed(2)})`
            : 'rgba(0, 0, 0, 0.24)';
          ctx!.beginPath();
          ctx!.ellipse(
            sim.partner.x,
            sim.partner.y + 1.5,
            dims.shadowRx * 1.08 * shadowScale,
            dims.shadowRy * 1.08 * shadowScale,
            0,
            0,
            Math.PI * 2
          );
          ctx!.fill();
          ctx!.fillStyle = aerial.isAerial
            ? `rgba(0, 0, 0, ${(0.3 - altRatio * 0.1).toFixed(2)})`
            : 'rgba(0, 0, 0, 0.38)';
          ctx!.beginPath();
          ctx!.ellipse(
            sim.partner.x,
            sim.partner.y + 1,
            dims.shadowRx * 0.78 * shadowScale,
            dims.shadowRy * 0.74 * shadowScale,
            0,
            0,
            Math.PI * 2
          );
          ctx!.fill();
          ctx!.restore();

          if (activeEvoAnim) {
            drawInWorldEvoBackLayer(
              ctx!,
              sim.partner.x,
              sim.partner.y,
              dims,
              activeEvoAnim
            );
          } else if (activeSwapAnim) {
            drawInWorldSwapBackLayer(
              ctx!,
              sim.partner.x,
              sim.partner.y,
              dims,
              activeSwapAnim
            );
          } else if (sim.evoFlashTimer > 0) {
            const flashAlpha = Math.min(1, sim.evoFlashTimer / 1.1);
            const ringScale = Math.max(1, dims.widthPx / 54);
            const ringR = Math.max(
              1,
              ((1.65 - sim.evoFlashTimer) * 44 + 22) * Math.min(1.55, ringScale)
            );
            ctx!.save();
            ctx!.globalAlpha = flashAlpha * 0.85;
            ctx!.strokeStyle = '#fde047';
            ctx!.lineWidth = 3;
            ctx!.beginPath();
            ctx!.ellipse(sim.partner.x, sim.partner.y - 4, ringR, ringR * 0.42, 0, 0, Math.PI * 2);
            ctx!.stroke();
            ctx!.strokeStyle = '#38e8ff';
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            ctx!.ellipse(
              sim.partner.x,
              sim.partner.y - 12,
              ringR * 0.72,
              ringR * 0.28,
              0,
              0,
              Math.PI * 2
            );
            ctx!.stroke();
            ctx!.restore();
          }

          if (sim.partner.isMoving && !sim.partner.activeAttack) {
            if (aerial.showsWindWisps) {
              // Crisp mid-air wind stream wisps trailing behind soaring wings (zero ground dust)
              const airDirX =
                sim.partner.dir === 'W'
                  ? 1
                  : sim.partner.dir === 'E'
                    ? -1
                    : 0;
              const airDirY =
                sim.partner.dir === 'N'
                  ? 1
                  : sim.partner.dir === 'S'
                    ? -0.7
                    : 0.08;
              const flyY = sim.partner.y - (liveHoverAlt + 24);
              ctx!.save();
              ctx!.lineCap = 'round';
              for (let wi = 0; wi < 3; wi++) {
                const phase = (elapsed * 3.8 + wi * 0.33) % 1;
                const spreadY = (wi - 1) * 14;
                const sx =
                  sim.partner.x +
                  airDirX * (14 + phase * 32) +
                  (airDirX === 0 ? (wi - 1) * 18 : 0);
                const sy = flyY + spreadY + airDirY * (8 + phase * 18);
                ctx!.globalAlpha = (1 - phase) * 0.44;
                ctx!.strokeStyle =
                  wi === 1 ? renderForm.theme.accentHex : 'rgba(224, 242, 254, 0.9)';
                ctx!.lineWidth = Math.max(1.2, (1 - phase) * 2.6);
                ctx!.beginPath();
                ctx!.moveTo(sx, sy);
                ctx!.lineTo(sx + airDirX * 16, sy + airDirY * 9);
                ctx!.stroke();
              }
              ctx!.restore();
            } else if (!aerial.isAerial) {
              const stepVector =
                sim.partner.dir === 'W'
                  ? { vx: 1, vy: 0.1 }
                  : sim.partner.dir === 'E'
                    ? { vx: -1, vy: 0.1 }
                    : sim.partner.dir === 'N'
                      ? { vx: 0, vy: 1 }
                      : { vx: 0, vy: -0.6 };
              ctx!.save();
              for (let di = 0; di < 4; di++) {
                const phase = (elapsed * 4.2 + di * 0.25) % 1;
                const spread = Math.sin(di * 2.1 + elapsed * 7) * 5;
                const px = sim.partner.x + stepVector.vx * (10 + phase * 28) + spread;
                const py = sim.partner.y + stepVector.vy * (4 + phase * 15) - phase * 7;
                ctx!.globalAlpha = (1 - phase) * 0.48;
                ctx!.fillStyle =
                  di % 2 === 0 ? renderForm.theme.accentHex : 'rgba(241, 245, 249, 0.88)';
                ctx!.beginPath();
                ctx!.arc(px, py, Math.max(1.6, (1 - phase) * 5.6), 0, Math.PI * 2);
                ctx!.fill();
              }
              ctx!.restore();
            }
          }

          const evoTransform = activeEvoAnim
            ? getInWorldEvoSpriteTransform(activeEvoAnim)
            : null;
          const swapTransform =
            !activeEvoAnim && activeSwapAnim
              ? getInWorldSwapSpriteTransform(activeSwapAnim)
              : null;
          ctx!.save();
          if (evoTransform) {
            ctx!.translate(sim.partner.x, sim.partner.y + evoTransform.liftY);
            ctx!.scale(evoTransform.scaleX, evoTransform.scaleY);
            ctx!.translate(-sim.partner.x, -sim.partner.y);
          } else if (swapTransform) {
            ctx!.globalAlpha *= swapTransform.alpha;
            ctx!.translate(sim.partner.x, sim.partner.y + swapTransform.liftY);
            ctx!.scale(swapTransform.scaleX, swapTransform.scaleY);
            ctx!.translate(-sim.partner.x, -sim.partner.y);
          }
          if (sim.partner.activeAttack) {
            const prog =
              sim.partner.activeAttack.elapsed /
              Math.max(0.1, sim.partner.activeAttack.duration);
            drawDigimonAttackPoseFrame(
              ctx!,
              renderForm.id,
              sim.partner.activeAttack.kind,
              sim.partner.activeAttack.facingRight,
              prog,
              sim.partner.x,
              sim.partner.y
            );
          } else {
            drawDigimonPartnerFrame(
              ctx!,
              renderForm.id,
              sim.partner.isMoving ? 'walk' : 'idle',
              sim.partner.dir,
              sim.partner.frameIndex % DIGIMON_FRAME_COUNT,
              elapsed,
              sim.partner.x,
              sim.partner.y
            );
          }
          ctx!.restore();

          if (activeEvoAnim) {
            drawInWorldEvoFrontLayer(
              ctx!,
              sim.partner.x,
              sim.partner.y,
              dims,
              activeEvoAnim
            );
          } else if (activeSwapAnim) {
            drawInWorldSwapFrontLayer(
              ctx!,
              sim.partner.x,
              sim.partner.y,
              dims,
              activeSwapAnim
            );
          }

          ctx!.save();
          ctx!.font = '700 10.5px "Exo 2", sans-serif';
          ctx!.textAlign = 'center';
          const flyingNameLift = aerial.nameplateLift;
          const pTagY = sim.partner.y - dims.nameplateOffsetY - flyingNameLift;
          const pName =
            renderForm.id === activeFormRef.current.id
              ? hudAccountRef.current.digimon.nickname ?? renderForm.name
              : renderForm.name;
          const ptw = measureTextCached(ctx!, ctx!.font, pName) + 12;
          ctx!.fillStyle = 'rgba(4, 17, 46, 0.86)';
          ctx!.beginPath();
          ctx!.roundRect(sim.partner.x - ptw / 2, pTagY - 12, ptw, 15, 5);
          ctx!.fill();
          ctx!.strokeStyle = renderForm.theme.accentHex;
          ctx!.lineWidth = 1;
          ctx!.stroke();
          ctx!.fillStyle = renderForm.theme.accentHex;
          ctx!.fillText(pName, sim.partner.x, pTagY - 1);
          ctx!.restore();

          ctx!.restore();
        },
      });

      drawables.sort((a, b) => a.sortY - b.sortY);
      for (const item of drawables) {
        item.draw();
      }

      // Indicador visual do alvo atual (rotação de 7s) dos Raid Bosses
      for (const enemy of sim.enemies) {
        if (
          !enemy.isBoss ||
          !enemy.alive ||
          !enemy.aggroed ||
          enemy.bossTargetX === undefined ||
          enemy.bossTargetY === undefined
        ) {
          continue;
        }
        const tx = enemy.bossTargetX;
        const ty = enemy.bossTargetY;
        const pulse = 1 + Math.sin(elapsed * 8) * 0.12;
        ctx!.save();
        ctx!.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx!.lineWidth = 2.4;
        ctx!.setLineDash([7, 5]);
        ctx!.beginPath();
        ctx!.ellipse(tx, ty + 2, 30 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.strokeStyle = 'rgba(253, 224, 71, 0.82)';
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.ellipse(tx, ty + 2, 22 * pulse, 8.5 * pulse, 0, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.restore();
      }

      // Efeitos visuais de Skill em Área (AoE) dos Raid Bosses atingindo todos os atacantes
      for (const bfx of sim.bossAoeEffects) {
        const prog = Math.max(0, Math.min(1, bfx.elapsed / bfx.duration));
        const alpha = 1 - prog * prog;
        const curR = bfx.radius * (0.16 + prog * 0.84);
        ctx!.save();
        ctx!.globalAlpha = alpha;

        const grad = ctx!.createRadialGradient(
          bfx.x,
          bfx.y,
          curR * 0.35,
          bfx.x,
          bfx.y,
          curR
        );
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.02)');
        grad.addColorStop(0.75, 'rgba(239, 68, 68, 0.24)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0.42)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.ellipse(bfx.x, bfx.y, curR, curR * 0.56, 0, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.strokeStyle = '#fb7185';
        ctx!.lineWidth = 3.6 * (1 - prog * 0.5);
        ctx!.beginPath();
        ctx!.ellipse(bfx.x, bfx.y, curR, curR * 0.56, 0, 0, Math.PI * 2);
        ctx!.stroke();

        ctx!.strokeStyle = '#fde047';
        ctx!.lineWidth = 2;
        for (let bi = 0; bi < 6; bi++) {
          const ang = (bi * Math.PI) / 3 + prog * 1.4;
          const bx = bfx.x + Math.cos(ang) * curR * 0.88;
          const by = bfx.y + Math.sin(ang) * curR * 0.56 * 0.88;
          ctx!.beginPath();
          ctx!.arc(bx, by, 14 * (1 - prog * 0.4), ang - 0.8, ang + 0.8);
          ctx!.stroke();
        }

        // Cortes em X sobre cada Digimon atingido dentro da área
        for (const hit of bfx.hits) {
          const s = 14 + prog * 8;
          ctx!.strokeStyle = '#fef08a';
          ctx!.lineWidth = 2.6;
          ctx!.beginPath();
          ctx!.moveTo(hit.x - s, hit.y - 26 - s * 0.6);
          ctx!.lineTo(hit.x + s, hit.y - 26 + s * 0.6);
          ctx!.moveTo(hit.x + s, hit.y - 26 - s * 0.6);
          ctx!.lineTo(hit.x - s, hit.y - 26 + s * 0.6);
          ctx!.stroke();
        }

        ctx!.restore();
      }

      for (const fx of sim.combatEffects) {
        drawDigimonSpecialVfx(
          ctx!,
          fx.attackerFormId ?? renderForm.id,
          fx.kind,
          fx.attackerX,
          fx.attackerY,
          fx.targetX,
          fx.targetY,
          fx.elapsed / fx.duration,
          fx.id
        );
      }

      if (runtimeMetaRef.current.showFloatingDamage) {
        for (const ft of sim.floatingTexts) {
          const fade = Math.max(0, 1 - ft.elapsed / ft.duration);
          ctx!.save();
          ctx!.globalAlpha = fade;
          ctx!.font = '800 12px "Exo 2", sans-serif';
          ctx!.textAlign = 'center';
          ctx!.strokeStyle = 'rgba(2, 6, 23, 0.92)';
          ctx!.lineWidth = 3;
          ctx!.strokeText(ft.text, ft.x, ft.y);
          ctx!.fillStyle = ft.color;
          ctx!.fillText(ft.text, ft.x, ft.y);
          ctx!.restore();
        }
      }

      ctx!.restore();

      // Cinematic DigiEgg Drop-to-Inventory VFX (anchored above slain monster -> flies into bottom-right Inventory dock)
      if (sim.eggDropFx.length > 0) {
        drawDigiEggDropFx({
          ctx: ctx!,
          fxList: sim.eggDropFx,
          camX: sim.camX,
          camY: sim.camY,
          cameraZoom,
          viewW,
          viewH,
          onCollectArrive: triggerEggCollectedDockPulse,
        });
      }

      } // end shouldDrawWorldFrame

      // Sync React HUD Snapshot cleanly (~3-4Hz) ONLY when meaningful HUD values actually change
      hudTimer += dt;
      const hudInterval = sim.partner.targetEnemyId ? 0.22 : 0.3;
      if (hudTimer >= hudInterval) {
        hudTimer = 0;
        const activeTarget = sim.partner.targetEnemyId
          ? sim.enemies.find(
              (e) => e.id === sim.partner.targetEnemyId && e.alive && e.hp > 0
            ) ?? null
          : null;

        const modalBlockingHud =
          (activeHudWindowRef.current !== null &&
            activeHudWindowRef.current !== 'map') ||
          overlayLayerRef.current.inventory;

        if (!modalBlockingHud) {
          let aliveEnemiesSig = '';
          if (isCombatMap) {
            for (const e of sim.enemies) {
              if (e.alive) {
                // Coarse 96px grid prevents idle patrolling mobs from forcing nonstop React re-renders
                aliveEnemiesSig += `${e.id}:${Math.round(e.x / 96)},${Math.round(e.y / 96)};`;
              }
            }
          }
          let remoteSig = '';
          const myChForHud = currentChannelRef.current;
          for (const s of remoteSmoothRef.current.values()) {
            if (s.player.mapId === sim.mapId && s.player.channelId === myChForHud) {
              remoteSig += `${s.player.uid}:${Math.round(s.renderX / 48)},${Math.round(s.renderY / 48)};`;
            }
          }

          const hudSignature = [
            sim.mapId,
            myChForHud,
            Math.round(sim.x / 8),
            Math.round(sim.y / 8),
            sim.dir,
            sim.state,
            Math.round(sim.partner.x / 10),
            Math.round(sim.partner.y / 10),
            sim.partner.aiState,
            inSafeZone ? 1 : 0,
            closestPt?.id ?? '',
            sim.nearReturnPortal ? 1 : 0,
            sim.discoveredZones.size,
            Math.ceil(sim.partner.special1Cooldown * 5),
            Math.ceil(sim.partner.special2Cooldown * 5),
            sim.activeSkillBanner ?? '',
            activeTarget ? `${activeTarget.id}:${activeTarget.hp}/${activeTarget.maxHp}` : '',
            aliveEnemiesSig,
            remoteSig,
          ].join('|');

          if (hudSignature !== lastHudSignature) {
            lastHudSignature = hudSignature;
            setLiveSnapshot({
              mapId: sim.mapId,
              tamerX: sim.x,
              tamerY: sim.y,
              tamerDir: sim.dir,
              tamerMoveState: sim.state,
              partnerX: sim.partner.x,
              partnerY: sim.partner.y,
              partnerState: sim.partner.aiState,
              inSafeZone,
              nearbyPointId: closestPt?.id ?? null,
              nearReturnPortal: sim.nearReturnPortal,
              discoveredZoneIds: Array.from(sim.discoveredZones),
              special1Cooldown: sim.partner.special1Cooldown,
              special1MaxCooldown: renderForm.special1CooldownSec,
              special2Cooldown: sim.partner.special2Cooldown,
              special2MaxCooldown: renderForm.special2CooldownSec,
              activeSkillBanner: sim.activeSkillBanner,
              targetEnemy: activeTarget
                ? {
                    id: activeTarget.id,
                    species: activeTarget.species,
                    name: activeTarget.name,
                    level: activeTarget.level,
                    hp: activeTarget.hp,
                    maxHp: activeTarget.maxHp,
                    isBoss: activeTarget.isBoss,
                    classification: getWildDigimonClassification(activeTarget.species),
                  }
                : null,
              minimapEnemies: isCombatMap
                ? sim.enemies.map((e) => ({
                    id: e.id,
                    species: e.species,
                    x: e.x,
                    y: e.y,
                    alive: e.alive,
                    isBoss: e.isBoss,
                  }))
                : [],
              minimapPlayers: Array.from(remoteSmoothRef.current.values())
                .filter(
                  (s) =>
                    s.player.mapId === sim.mapId &&
                    s.player.channelId === myChForHud
                )
                .map((s) => ({
                  uid: s.player.uid,
                  tamerName: s.player.tamerName,
                  characterId: s.player.characterId,
                  x: s.renderX,
                  y: s.renderY,
                  isGm: s.player.isGm,
                })),
            });
          }
        }

        // Responsive real-time multiplayer presence broadcast (200ms walking cadence + safety timeout + 12s keepalive)
        const syncMeta = lastPresenceSyncRef.current;
        const nowMs = Date.now();
        const elapsedSinceSync = nowMs - syncMeta.sentAtMs;
        if (syncMeta.inFlight && elapsedSinceSync >= 1800) {
          syncMeta.inFlight = false;
        }
        const movedDist = Math.hypot(sim.x - syncMeta.x, sim.y - syncMeta.y);
        const partnerMovedDist = Math.hypot(
          sim.partner.x - syncMeta.partnerX,
          sim.partner.y - syncMeta.partnerY
        );
        const mapOrFormChanged =
          sim.mapId !== syncMeta.mapId ||
          currentChannelRef.current !== syncMeta.channelId ||
          renderForm.id !== syncMeta.formId ||
          hudAccountRef.current.tamer.level !== syncMeta.tamerLevel ||
          hudAccountRef.current.digimon.level !== syncMeta.digimonLevel;
        const stoppedMoving =
          ((syncMeta.state === 'walk' && sim.state === 'idle') ||
            (syncMeta.partnerMoving && !sim.partner.isMoving)) &&
          elapsedSinceSync >= 100;
        const movedEnough =
          (movedDist >= 8 ||
            partnerMovedDist >= 10 ||
            sim.dir !== syncMeta.dir ||
            sim.state !== syncMeta.state ||
            sim.partner.isMoving !== syncMeta.partnerMoving) &&
          elapsedSinceSync >= 200;
        const heartbeatDue = elapsedSinceSync >= 12_000;

        if (
          document.visibilityState === 'visible' &&
          !syncMeta.inFlight &&
          (mapOrFormChanged || stoppedMoving || movedEnough || heartbeatDue)
        ) {
          syncMeta.inFlight = true;
          syncMeta.x = sim.x;
          syncMeta.y = sim.y;
          syncMeta.partnerX = sim.partner.x;
          syncMeta.partnerY = sim.partner.y;
          syncMeta.partnerMoving = sim.partner.isMoving;
          syncMeta.dir = sim.dir;
          syncMeta.state = sim.state;
          syncMeta.mapId = sim.mapId;
          syncMeta.channelId = currentChannelRef.current;
          syncMeta.formId = renderForm.id;
          syncMeta.tamerLevel = hudAccountRef.current.tamer.level;
          syncMeta.digimonLevel = hudAccountRef.current.digimon.level;
          syncMeta.sentAtMs = nowMs;

          void publishLocalWorldPresence(buildLocalPresenceSnapshot()).finally(() => {
            syncMeta.inFlight = false;
          });
        }
      }
      } catch (err) {
        console.warn('[DigiLegends] world loop frame recovered:', err);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', refreshBounds);
      releaseInactiveMapLayers('__dispose__');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCanvasTap(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setActiveStationModal(null);
    const sim = simRef.current;

    const rect = canvas.getBoundingClientRect();
    const tapScreenX = e.clientX - rect.left;
    const tapScreenY = e.clientY - rect.top;
    const isVirtualWorld = sim.mapId === VIRTUAL_WORLD_MAP_ID;
    const isDarkArea = sim.mapId === DARK_AREA_MAP_ID;
    const isDigimonIsland = sim.mapId === DIGIMON_ISLAND_MAP_ID;
    const isDataSea = sim.mapId === DATA_SEA_MAP_ID;
    const isDigitalDesert = sim.mapId === DIGITAL_DESERT_MAP_ID;
    const isDigiMountain = sim.mapId === DIGI_MOUNTAIN_MAP_ID;
    const isDataForest = sim.mapId === DATA_FOREST_MAP_ID;
    const isCombat = isCombatWorldMap(sim.mapId);
    const { worldW, worldH, minY } = getMapDimensions(sim.mapId);

    const cameraZoom = getWorldCameraZoom(
      rect.width,
      rect.height,
      worldW,
      worldH,
      isCombat
    );
    const worldX = (tapScreenX - rect.width / 2) / cameraZoom + sim.camX;
    const worldY = (tapScreenY - rect.height / 2) / cameraZoom + sim.camY;

    if (sim.mapId === D_TERMINAL_MAP_ID) {
      // Direct tap on PawnChessmon (Black) — Trailmon Conductor NPC
      if (
        Math.abs(worldX - D_TERMINAL_CONDUCTOR_NPC.x) <= 62 &&
        worldY >= D_TERMINAL_CONDUCTOR_NPC.y - 150 &&
        worldY <= D_TERMINAL_CONDUCTOR_NPC.y + 26
      ) {
        setSelectedRemotePlayer(null);
        setActiveNpcDialogue(null);
        pendingTargetPortalRef.current = null;
        if (sim.nearbyPointId === D_TERMINAL_CONDUCTOR_NPC.id) {
          setActiveStationModal(D_TERMINAL_INTERACTION_POINTS[0]);
          playDigitalTone('confirm', soundEnabled);
        } else {
          pendingConductorWalkRef.current = true;
          sim.tapTarget = {
            x: D_TERMINAL_CONDUCTOR_NPC.standX,
            y: D_TERMINAL_CONDUCTOR_NPC.standY,
          };
          playDigitalTone('click', soundEnabled);
        }
        return;
      }

      // Direct tap on D-Terminal Southern Return Portal -> DATS Center
      if (
        Math.abs(worldX - D_TERMINAL_RETURN_PORTAL.x) <= 84 &&
        worldY >= D_TERMINAL_RETURN_PORTAL.y - 152 &&
        worldY <= D_TERMINAL_RETURN_PORTAL.y + 38
      ) {
        setSelectedRemotePlayer(null);
        setActiveNpcDialogue(null);
        pendingConductorWalkRef.current = false;
        const dtPortal = getPortalsForMap(D_TERMINAL_MAP_ID)[0];
        if (dtPortal) {
          if (sim.nearReturnPortal) {
            attemptPortalTravel(dtPortal);
          } else {
            pendingTargetPortalRef.current = dtPortal;
            sim.tapTarget = { x: dtPortal.x, y: dtPortal.y };
            playDigitalTone('click', soundEnabled);
          }
          return;
        }
      }
    }

    if (sim.mapId === DATS_MAP_ID) {
      const hitFixedNpc = [...DATS_FIXED_NPCS]
        .sort((a, b) => b.y - a.y)
        .find((npc) => isPointInsideNpcHitbox(npc, worldX, worldY));
      if (hitFixedNpc) {
        pendingIncubatorWalkRef.current = false;
        pendingArchiveWalkRef.current = false;
        pendingPortalWalkRef.current = false;
        pendingConductorWalkRef.current = false;
        pendingTargetPortalRef.current = null;
        pendingDatsPointIdRef.current = null;
        sim.tapTarget = null;
        playDigitalTone('confirm', soundEnabled);
        if (hitFixedNpc.id === MUDFRIGIMON_NPC.id) {
          setActiveNpcDialogue(null);
          setActiveStationModal(null);
          setPlayerMarketOpen(false);
          setMudfrigimonShopOpen(true);
        } else if (hitFixedNpc.id === MIKI_MARKET_NPC.id) {
          setActiveNpcDialogue(null);
          setActiveStationModal(null);
          setMudfrigimonShopOpen(false);
          setPlayerMarketOpen(true);
        } else {
          setMudfrigimonShopOpen(false);
          setPlayerMarketOpen(false);
          setActiveNpcDialogue(hitFixedNpc);
        }
        return;
      }
    }

    if (
      sim.mapId === DATS_MAP_ID &&
      worldX >= 322 &&
      worldX <= 438 &&
      worldY >= 584 &&
      worldY <= 786
    ) {
      setSelectedRemotePlayer(null);
      setActiveNpcDialogue(null);
      pendingIncubatorWalkRef.current = false;
      pendingPortalWalkRef.current = false;
      pendingDatsPointIdRef.current = null;
      if (sim.nearbyPointId === DATS_ARCHIVE_STATION.id) {
        openNearbyStation();
      } else {
        pendingArchiveWalkRef.current = true;
        sim.tapTarget = {
          x: DATS_ARCHIVE_STATION.standX,
          y: DATS_ARCHIVE_STATION.standY,
        };
        playDigitalTone('click', soundEnabled);
      }
      return;
    }

    if (
      sim.mapId === DATS_MAP_ID &&
      worldX >= 460 &&
      worldX <= 590 &&
      worldY >= 596 &&
      worldY <= 786
    ) {
      setSelectedRemotePlayer(null);
      setActiveNpcDialogue(null);
      pendingArchiveWalkRef.current = false;
      pendingPortalWalkRef.current = false;
      pendingDatsPointIdRef.current = null;
      if (sim.nearbyPointId === DATS_INCUBATOR_STATION.id) {
        openNearbyStation();
      } else {
        pendingIncubatorWalkRef.current = true;
        sim.tapTarget = {
          x: DATS_INCUBATOR_STATION.standX,
          y: DATS_INCUBATOR_STATION.standY,
        };
        playDigitalTone('click', soundEnabled);
      }
      return;
    }

    // Direct tap on DATS Southern Dimensional Portal -> goes straight to D-Terminal
    if (
      sim.mapId === DATS_MAP_ID &&
      Math.abs(worldX - 800) <= 84 &&
      worldY >= 1175 &&
      worldY <= 1368
    ) {
      setSelectedRemotePlayer(null);
      setActiveNpcDialogue(null);
      pendingIncubatorWalkRef.current = false;
      pendingArchiveWalkRef.current = false;
      pendingDatsPointIdRef.current = null;
      if (sim.nearbyPointId === 'digital-world-portal') {
        attemptPortalTravel(DATS_SOUTH_PORTAL_LINK);
      } else {
        pendingPortalWalkRef.current = true;
        sim.tapTarget = { x: 800, y: 1316 };
        playDigitalTone('click', soundEnabled);
      }
      return;
    }

    // Direct tap on other DATS interactive stations (Entrance, Terminal, etc.)
    if (sim.mapId === DATS_MAP_ID) {
      const tappedDatsPt = DATS_INTERACTION_POINTS.find(
        (pt) =>
          pt.id !== DATS_ARCHIVE_STATION.id &&
          pt.id !== DATS_INCUBATOR_STATION.id &&
          pt.id !== 'digital-world-portal' &&
          pt.id !== 'dats-mudfrigimon-npc' &&
          pt.id !== 'dats-player-market-npc' &&
          Math.hypot(worldX - pt.x, worldY - pt.y) <= 56
      );
      if (tappedDatsPt) {
        setSelectedRemotePlayer(null);
        setActiveNpcDialogue(null);
        pendingIncubatorWalkRef.current = false;
        pendingArchiveWalkRef.current = false;
        pendingPortalWalkRef.current = false;
        if (sim.nearbyPointId === tappedDatsPt.id) {
          openNearbyStation();
        } else {
          pendingDatsPointIdRef.current = tappedDatsPt.id;
          sim.tapTarget = { x: tappedDatsPt.x, y: tappedDatsPt.y };
          playDigitalTone('click', soundEnabled);
        }
        return;
      }
    }

    if (isCombat) {
      // Direct tap on any interconnected Dimensional Portal (Back / Next / Hub) on this Combat Map
      const tappedPortal = getPortalsForMap(sim.mapId).find(
        (portal) =>
          Math.abs(worldX - portal.x) <= 78 &&
          worldY >= portal.y - 148 &&
          worldY <= portal.y + 36
      );
      if (tappedPortal) {
        setSelectedRemotePlayer(null);
        setActiveNpcDialogue(null);
        const dist = Math.hypot(sim.x - tappedPortal.x, sim.y - tappedPortal.y);
        if (dist <= tappedPortal.radius) {
          attemptPortalTravel(tappedPortal);
        } else {
          pendingTargetPortalRef.current = tappedPortal;
          sim.tapTarget = { x: tappedPortal.x, y: tappedPortal.y };
          playDigitalTone('click', soundEnabled);
        }
        return;
      }
      const activeFieldNpcs = isVirtualWorld
        ? VIRTUAL_WORLD_FRIENDLY_NPCS
        : isDarkArea
          ? DARK_AREA_FRIENDLY_NPCS
          : isDigimonIsland
            ? DIGIMON_ISLAND_FRIENDLY_NPCS
            : isDataSea
              ? DATA_SEA_FRIENDLY_NPCS
              : isDigitalDesert
                ? DIGITAL_DESERT_FRIENDLY_NPCS
                : isDigiMountain
                  ? DIGI_MOUNTAIN_FRIENDLY_NPCS
                  : isDataForest
                    ? DATA_FOREST_FRIENDLY_NPCS
                    : FRIENDLY_FIELD_NPCS;
      const hitFieldNpc = activeFieldNpcs.find(
        (npc) =>
          Math.abs(worldX - npc.x) <= 32 &&
          worldY >= npc.y - 82 &&
          worldY <= npc.y + 10
      );
      if (hitFieldNpc) {
        sim.tapTarget = null;
        playDigitalTone('confirm', soundEnabled);
        setActiveNpcDialogue(fieldNpcToDialogueModel(hitFieldNpc));
        return;
      }

      // Direct tap/click-to-target on an alive wild Digimon (generous hitbox for Raid Boss Kuwagamon)
      const tappedEnemy = sim.enemies.find((enemy) => {
        if (!enemy.alive) return false;
        if (enemy.isBoss) {
          return (
            Math.abs(worldX - enemy.x) <= 78 &&
            worldY >= enemy.y - 165 &&
            worldY <= enemy.y + 22
          );
        }
        return (
          Math.abs(worldX - enemy.x) <= 42 &&
          worldY >= enemy.y - 92 &&
          worldY <= enemy.y + 18
        );
      });
      if (tappedEnemy) {
        sim.partner.targetEnemyId = tappedEnemy.id;
        sim.partner.recoverFailCount = 0;
        if (!isPointInMapSafeZone(sim.mapId, sim.x, sim.y)) {
          sim.partner.aiState = 'CHASE';
        }
        const distToEnemy = Math.hypot(tappedEnemy.x - sim.x, tappedEnemy.y - sim.y);
        const engageRadius = tappedEnemy.isBoss ? 235 : 195;
        if (distToEnemy > engageRadius) {
          // Walk smoothly closer so partner engages right away
          sim.tapTarget = {
            x: Math.max(48, Math.min(worldW - 48, tappedEnemy.x)),
            y: Math.max(minY, Math.min(worldH - 48, tappedEnemy.y + (tappedEnemy.isBoss ? 72 : 0))),
          };
        } else {
          sim.tapTarget = null;
        }
        playDigitalTone('confirm', soundEnabled);
        return;
      }
    }

    // Check if the player tapped another online Tamer on this map & channel
    for (const smooth of remoteSmoothRef.current.values()) {
      if (
        smooth.player.mapId !== sim.mapId ||
        smooth.player.channelId !== currentChannelRef.current
      )
        continue;
      if (
        Math.abs(worldX - smooth.renderX) <= 30 &&
        worldY >= smooth.renderY - 94 &&
        worldY <= smooth.renderY + 12
      ) {
        sim.tapTarget = null;
        setActiveNpcDialogue(null);
        playDigitalTone('confirm', soundEnabled);
        setSelectedRemotePlayer(smooth.player);
        return;
      }
    }

    pendingIncubatorWalkRef.current = false;
    pendingArchiveWalkRef.current = false;
    pendingPortalWalkRef.current = false;
    pendingConductorWalkRef.current = false;
    pendingTargetPortalRef.current = null;
    pendingDatsPointIdRef.current = null;
    setSelectedRemotePlayer(null);
    setActiveNpcDialogue(null);
    const nextTapX = Math.max(48, Math.min(worldW - 48, worldX));
    const nextTapY = Math.max(minY, Math.min(worldH - 48, worldY));
    sim.autoNavActive = false;
    sim.tapTarget = {
      x: nextTapX,
      y: nextTapY,
    };
    if (Math.hypot(nextTapX - sim.x, nextTapY - sim.y) > 4) {
      sim.dir = snapToCardinalVector(nextTapX - sim.x, nextTapY - sim.y).dir;
    }
    playDigitalTone('click', soundEnabled);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = simRef.current;

    const rect = canvas.getBoundingClientRect();
    const { worldW, worldH } = getMapDimensions(sim.mapId);
    const cameraZoom = getWorldCameraZoom(
      rect.width,
      rect.height,
      worldW,
      worldH,
      isCombatWorldMap(sim.mapId)
    );
    const worldX = (e.clientX - rect.left - rect.width / 2) / cameraZoom + sim.camX;
    const worldY = (e.clientY - rect.top - rect.height / 2) / cameraZoom + sim.camY;

    let nextHover: string | null = null;
    if (sim.mapId === D_TERMINAL_MAP_ID) {
      if (
        Math.abs(worldX - D_TERMINAL_CONDUCTOR_NPC.x) <= 62 &&
        worldY >= D_TERMINAL_CONDUCTOR_NPC.y - 150 &&
        worldY <= D_TERMINAL_CONDUCTOR_NPC.y + 26
      ) {
        nextHover = D_TERMINAL_CONDUCTOR_NPC.id;
      } else if (
        Math.abs(worldX - D_TERMINAL_RETURN_PORTAL.x) <= 84 &&
        worldY >= D_TERMINAL_RETURN_PORTAL.y - 152 &&
        worldY <= D_TERMINAL_RETURN_PORTAL.y + 38
      ) {
        nextHover = 'd-terminal-to-dats';
      }
    } else if (sim.mapId === DATS_MAP_ID) {
      const hoveredFixedNpc = [...DATS_FIXED_NPCS]
        .sort((a, b) => b.y - a.y)
        .find((npc) => isPointInsideNpcHitbox(npc, worldX, worldY));
      if (hoveredFixedNpc) {
        nextHover = hoveredFixedNpc.id;
      } else if (
        worldX >= 322 &&
        worldX <= 438 &&
        worldY >= 584 &&
        worldY <= 786
      ) {
        nextHover = DATS_ARCHIVE_STATION.id;
      } else if (
        worldX >= 460 &&
        worldX <= 590 &&
        worldY >= 596 &&
        worldY <= 786
      ) {
        nextHover = DATS_INCUBATOR_STATION.id;
      } else if (
        Math.abs(worldX - 800) <= 84 &&
        worldY >= 1175 &&
        worldY <= 1368
      ) {
        nextHover = 'digital-world-portal';
      }
    } else if (isCombatWorldMap(sim.mapId)) {
      const hoveredPortal = getPortalsForMap(sim.mapId).find(
        (portal) =>
          Math.abs(worldX - portal.x) <= 78 &&
          worldY >= portal.y - 148 &&
          worldY <= portal.y + 36
      );
      if (hoveredPortal) {
        nextHover = hoveredPortal.id;
      } else {
        const activeFieldNpcs =
          sim.mapId === VIRTUAL_WORLD_MAP_ID
            ? VIRTUAL_WORLD_FRIENDLY_NPCS
            : sim.mapId === DARK_AREA_MAP_ID
              ? DARK_AREA_FRIENDLY_NPCS
              : sim.mapId === DIGIMON_ISLAND_MAP_ID
                ? DIGIMON_ISLAND_FRIENDLY_NPCS
                : sim.mapId === DATA_SEA_MAP_ID
                  ? DATA_SEA_FRIENDLY_NPCS
                  : sim.mapId === DIGITAL_DESERT_MAP_ID
                    ? DIGITAL_DESERT_FRIENDLY_NPCS
                    : sim.mapId === DIGI_MOUNTAIN_MAP_ID
                      ? DIGI_MOUNTAIN_FRIENDLY_NPCS
                      : sim.mapId === DATA_FOREST_MAP_ID
                        ? DATA_FOREST_FRIENDLY_NPCS
                        : FRIENDLY_FIELD_NPCS;
        const hitFieldNpc = activeFieldNpcs.find(
          (npc) =>
            Math.abs(worldX - npc.x) <= 32 &&
            worldY >= npc.y - 82 &&
            worldY <= npc.y + 10
        );
        nextHover = hitFieldNpc?.id ?? null;
      }
    }

    if (hoveredNpcIdRef.current !== nextHover) {
      hoveredNpcIdRef.current = nextHover;
      setHoveredNpcId(nextHover);
    }
  }

  function updateJoystick(clientX: number, clientY: number) {
    pendingIncubatorWalkRef.current = false;
    pendingArchiveWalkRef.current = false;
    pendingPortalWalkRef.current = false;
    pendingConductorWalkRef.current = false;
    pendingTargetPortalRef.current = null;
    pendingDatsPointIdRef.current = null;
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;
    const mag = maxR > 0 ? clamped / maxR : 0;

    simRef.current.joyVx = mag > 0.18 ? Math.cos(angle) : 0;
    simRef.current.joyVy = mag > 0.18 ? Math.sin(angle) : 0;
    simRef.current.joyMag = mag;
    joystickActiveRef.current = true;

    // Direct GPU-composited DOM transform update — ZERO React re-renders during movement!
    if (joystickKnobElRef.current) {
      joystickKnobElRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;
    }
  }

  function resetJoystick() {
    simRef.current.joyVx = 0;
    simRef.current.joyVy = 0;
    simRef.current.joyMag = 0;
    joystickActiveRef.current = false;
    if (joystickKnobElRef.current) {
      joystickKnobElRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
  }

  const handleAssignQuickSlot = useCallback(
    (slot: 'food' | 'vitamin', itemKey: string | null) => {
      const next =
        slot === 'food'
          ? { ...quickSlotsRef.current, foodItemKey: itemKey }
          : { ...quickSlotsRef.current, vitaminItemKey: itemKey };
      quickSlotsRef.current = next;
      setQuickSlots(next);
      try {
        localStorage.setItem(quickSlotsStorageKey, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      playDigitalTone('click', soundEnabledRef.current);
    },
    [quickSlotsStorageKey]
  );

  function handleUseQuickSlot(slot: 'food' | 'vitamin') {
    const nowMs = Date.now();
    if (nowMs - lastQuickSlotUseMsRef.current < 380) return;
    lastQuickSlotUseMsRef.current = nowMs;

    const itemKey =
      slot === 'food'
        ? quickSlotsRef.current.foodItemKey
        : quickSlotsRef.current.vitaminItemKey;
    if (!itemKey) {
      playDigitalTone('error', soundEnabledRef.current);
      pushChatMessage(
        'system',
        slot === 'food'
          ? 'Clique no quadrado de Comida (HP) acima do Ultimate para escolher uma comida!'
          : 'Clique no quadrado de Vitamina (DS) acima do Mega para escolher uma vitamina!',
        { tone: 'info' }
      );
      return;
    }

    const invItem = hudAccountRef.current.inventory.find(
      (i) => i.itemKey === itemKey && i.quantity > 0
    );
    if (!invItem) {
      playDigitalTone('error', soundEnabledRef.current);
      pushChatMessage(
        'system',
        slot === 'food'
          ? 'Sem estoque da Comida equipada! Compre na Loja da MudFrigimon ou escolha outra.'
          : 'Sem estoque da Vitamina equipada! Compre na Loja da MudFrigimon ou escolha outra.',
        { tone: 'warning' }
      );
      return;
    }

    handleUseInventoryItem(invItem);
  }
  handleUseQuickSlotRef.current = handleUseQuickSlot;

  function handleUseInventoryItem(item: InventoryItem) {
    const cur = hudAccountRef.current;
    const idx = cur.inventory.findIndex((i) => i.id === item.id);
    if (idx < 0) return;

    const boostSpec = getXpBoostSpecByKey(item.itemKey);
    if (boostSpec) {
      const updatedInv = [...cur.inventory];
      if (updatedInv[idx].quantity > 1) {
        updatedInv[idx] = {
          ...updatedInv[idx],
          quantity: updatedInv[idx].quantity - 1,
        };
      } else {
        updatedInv.splice(idx, 1);
      }

      const nowMs = Date.now();
      const baseMs = Math.max(nowMs, cur.xpBoostUntilMs ?? 0);
      const maxCapMs = nowMs + 7 * 24 * 60 * 60 * 1000;
      const nextUntilMs = Math.min(maxCapMs, baseMs + boostSpec.durationMs);
      const remainingLabel =
        formatXpBoostRemainingLabel(nextUntilMs, nowMs) ?? `${boostSpec.hours}h`;

      commitHudAccount(
        {
          ...cur,
          inventory: updatedInv,
          xpBoostUntilMs: nextUntilMs,
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);

      const sim = simRef.current;
      sim.floatingTexts.push({
        id: sim.nextFxId++,
        x: sim.partner.x,
        y: sim.partner.y - 76,
        text: `+100% XP (${boostSpec.shortLabel})!`,
        color: '#fde047',
        elapsed: 0,
        duration: 1.5,
      });
      pushChatMessage(
        'system',
        `${boostSpec.name} ativado! +100% de EXP em batalha (restante: ${remainingLabel}).`,
        { tone: 'loot' }
      );
      pushNotification(
        'Boost +100% XP Ativo!',
        `${boostSpec.name} ativado com sucesso. Tempo total restante: ${remainingLabel}.`
      );
      return;
    }

    if (item.itemKey === 'bag_expander_6') {
      const currentSlots = getUnlockedInventorySlots(cur);
      if (currentSlots >= INVENTORY_TOTAL_SLOTS) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `Seu Inventário já está no máximo (${INVENTORY_TOTAL_SLOTS}/${INVENTORY_TOTAL_SLOTS} slots).`,
          { tone: 'warning' }
        );
        return;
      }
      const nextSlots = Math.min(INVENTORY_TOTAL_SLOTS, currentSlots + 6);
      const updatedInv = [...cur.inventory];
      if (updatedInv[idx].quantity > 1) {
        updatedInv[idx] = {
          ...updatedInv[idx],
          quantity: updatedInv[idx].quantity - 1,
        };
      } else {
        updatedInv.splice(idx, 1);
      }
      commitHudAccount(
        {
          ...cur,
          inventory: updatedInv,
          unlockedInventorySlots: nextSlots,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `Mochila expandida! Agora você tem ${nextSlots}/${INVENTORY_TOTAL_SLOTS} slots liberados.`,
        { tone: 'loot' }
      );
      pushNotification(
        'Mochila Expandida!',
        `Seu Inventário agora possui ${nextSlots} slots permanentes.`
      );
      return;
    }

    if (item.itemKey === 'archive_expander_6') {
      const currentArch = getUnlockedArchiveSlots(cur);
      if (currentArch >= ARCHIVE_TOTAL_SLOTS) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage(
          'system',
          `Seu Digimon Archive já está no máximo (${ARCHIVE_TOTAL_SLOTS}/${ARCHIVE_TOTAL_SLOTS} slots).`,
          { tone: 'warning' }
        );
        return;
      }
      const nextArch = Math.min(ARCHIVE_TOTAL_SLOTS, currentArch + 6);
      const updatedInv = [...cur.inventory];
      if (updatedInv[idx].quantity > 1) {
        updatedInv[idx] = {
          ...updatedInv[idx],
          quantity: updatedInv[idx].quantity - 1,
        };
      } else {
        updatedInv.splice(idx, 1);
      }
      commitHudAccount(
        {
          ...cur,
          inventory: updatedInv,
          unlockedArchiveSlots: nextArch,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `Digimon Archive expandido! Agora você tem ${nextArch}/${ARCHIVE_TOTAL_SLOTS} slots liberados.`,
        { tone: 'loot' }
      );
      pushNotification(
        'Archive Expandido!',
        `Seu Digimon Archive agora possui ${nextArch} slots permanentes.`
      );
      return;
    }

    const activeName = activeFormRef.current.name;
    let nextHp = cur.digimon.hp;
    let nextDs = cur.digimon.ds;
    let restoredHp = 0;
    let restoredDs = 0;
    if (item.hpRestore) {
      if (nextHp >= cur.digimon.maxHp) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage('system', `${activeName} já está com HP máximo.`, {
          tone: 'info',
        });
        return;
      }
      nextHp = Math.min(cur.digimon.maxHp, nextHp + item.hpRestore);
      restoredHp = nextHp - cur.digimon.hp;
    }
    if (item.dsRestore) {
      if (nextDs >= cur.digimon.maxDs) {
        playDigitalTone('error', soundEnabled);
        pushChatMessage('system', `${activeName} já está com DS máximo.`, {
          tone: 'info',
        });
        return;
      }
      nextDs = Math.min(cur.digimon.maxDs, nextDs + item.dsRestore);
      restoredDs = nextDs - cur.digimon.ds;
    }

    const updatedInv = [...cur.inventory];
    if (updatedInv[idx].quantity > 1) {
      updatedInv[idx] = {
        ...updatedInv[idx],
        quantity: updatedInv[idx].quantity - 1,
      };
    } else {
      updatedInv.splice(idx, 1);
    }

    commitHudAccount(
      {
        ...cur,
        digimon: { ...cur.digimon, hp: nextHp, ds: nextDs },
        inventory: updatedInv,
      },
      true
    );
    playDigitalTone('confirm', soundEnabled);

    const sim = simRef.current;
    const healParts: string[] = [];
    if (restoredHp > 0) {
      healParts.push(`+${restoredHp.toLocaleString('pt-BR')} HP`);
      sim.floatingTexts.push({
        id: sim.nextFxId++,
        x: sim.partner.x,
        y: sim.partner.y - 68,
        text: `+${restoredHp.toLocaleString('pt-BR')} HP`,
        color: '#4ade80',
        elapsed: 0,
        duration: 1.25,
      });
    }
    if (restoredDs > 0) {
      healParts.push(`+${restoredDs.toLocaleString('pt-BR')} DS`);
      sim.floatingTexts.push({
        id: sim.nextFxId++,
        x: sim.partner.x,
        y: sim.partner.y - 84,
        text: `+${restoredDs.toLocaleString('pt-BR')} DS`,
        color: '#38e8ff',
        elapsed: 0,
        duration: 1.25,
      });
    }
    const effectSummary = healParts.length > 0 ? ` (${healParts.join(' · ')})` : '';
    pushChatMessage(
      'system',
      `Usou ${item.name} em ${activeName}${effectSummary}.`,
      {
        tone: 'loot',
      }
    );
  }

  function handleDiscardInventoryItem(item: InventoryItem, quantity = 1) {
    const cur = hudAccountRef.current;
    const idx = cur.inventory.findIndex((i) => i.id === item.id);
    if (idx < 0) return;

    const removeCount = Math.max(1, Math.round(quantity));
    const updatedInv = [...cur.inventory];
    if (updatedInv[idx].quantity > removeCount) {
      updatedInv[idx] = {
        ...updatedInv[idx],
        quantity: updatedInv[idx].quantity - removeCount,
      };
    } else {
      updatedInv.splice(idx, 1);
    }
    commitHudAccount({ ...cur, inventory: updatedInv }, true);
    playDigitalTone('click', soundEnabled);
  }

  function handleDiscardInventoryItems(
    requests: Array<{ itemId: string; quantity: number }>
  ) {
    if (requests.length === 0) return;
    const cur = hudAccountRef.current;
    const removeById = new Map<string, number>();
    for (const req of requests) {
      const qty = Math.max(1, Math.round(req.quantity));
      removeById.set(req.itemId, (removeById.get(req.itemId) ?? 0) + qty);
    }
    let changed = false;
    const updatedInv: InventoryItem[] = [];
    for (const invItem of cur.inventory) {
      const toRemove = removeById.get(invItem.id) ?? 0;
      if (toRemove <= 0) {
        updatedInv.push(invItem);
        continue;
      }
      changed = true;
      if (invItem.quantity > toRemove) {
        updatedInv.push({
          ...invItem,
          quantity: invItem.quantity - toRemove,
        });
      }
    }
    if (!changed) return;
    commitHudAccount({ ...cur, inventory: updatedInv }, true);
    playDigitalTone('click', soundEnabled);
  }

  function handleSortInventory() {
    const cur = hudAccountRef.current;
    if (cur.inventory.length <= 1) {
      playDigitalTone('click', soundEnabled);
      return;
    }
    const categoryOrder: Record<string, number> = {
      digiegg: 0,
      data: 1,
      consumable: 2,
      equip: 3,
      other: 4,
    };
    const rarityOrder: Record<string, number> = {
      lendario: 0,
      epico: 1,
      raro: 2,
      incomum: 3,
      comum: 4,
    };
    const sorted = [...cur.inventory].sort((a, b) => {
      const catDiff =
        (categoryOrder[a.category] ?? 9) - (categoryOrder[b.category] ?? 9);
      if (catDiff !== 0) return catDiff;
      const rarDiff =
        (rarityOrder[a.rarity ?? 'comum'] ?? 9) -
        (rarityOrder[b.rarity ?? 'comum'] ?? 9);
      if (rarDiff !== 0) return rarDiff;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
    commitHudAccount({ ...cur, inventory: sorted }, true);
    playDigitalTone('confirm', soundEnabled);
  }

  function handleStartWhisperFriend(friendName: string) {
    setChatChannel('global');
    pushChatMessage(
      'system',
      `Chat Global selecionado para conversar com ${friendName}. Você também pode usar /invite ${friendName} para convidá-lo para Party.`,
      { tone: 'info' }
    );
  }

  function handleEquipInventoryItem(item: InventoryItem) {
    const res = equipInventoryItem(hudAccountRef.current, item.id);
    if (res.error || !res.equippedItem) {
      playDigitalTone('error', soundEnabled);
      if (res.error) {
        pushChatMessage('system', res.error, { tone: 'warning' });
      }
      return;
    }
    commitHudAccount(res.next, true);
    playDigitalTone('confirm', soundEnabled);
    const slotLabel = res.equippedItem.equipSlot
      ? EQUIPMENT_SLOT_LABELS[res.equippedItem.equipSlot]
      : 'Equipamento';
    pushChatMessage(
      'system',
      `Equipado: ${res.equippedItem.name} (${slotLabel}). Atributos atualizados.`,
      { tone: 'loot' }
    );
  }

  function handleUnequipSlot(slot: EquipmentSlotId) {
    const res = unequipSlotItem(hudAccountRef.current, slot);
    if (res.error) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage('system', res.error, { tone: 'warning' });
      return;
    }
    if (!res.unequippedItem) return;
    commitHudAccount(res.next, true);
    playDigitalTone('click', soundEnabled);
    pushChatMessage(
      'system',
      `Removido: ${res.unequippedItem.name} devolvido ao Inventário.`,
      { tone: 'info' }
    );
  }

  function handleBuyShopItem(itemKey: string) {
    const tpl = BASIC_BITS_SHOP_ITEMS.find((b) => b.itemKey === itemKey);
    if (!tpl) return;
    const cur = hudAccountRef.current;
    if (cur.bits < tpl.priceBits) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage('system', 'Bits insuficientes para esta compra.', {
        tone: 'warning',
      });
      return;
    }

    const unlockedSlots = getUnlockedInventorySlots(cur);
    const res = addInventoryItem(
      cur.inventory,
      {
        itemKey: tpl.itemKey,
        name: tpl.name,
        category: tpl.category,
        quantity: 1,
        description: tpl.description,
        hpRestore: tpl.hpRestore,
        dsRestore: tpl.dsRestore,
        equipSlot: tpl.equipSlot,
        statBonuses: tpl.statBonuses,
      },
      unlockedSlots
    );

    if (!res.added) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage(
        'system',
        `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots liberados).`,
        {
          tone: 'warning',
        }
      );
      return;
    }

    commitHudAccount(
      {
        ...cur,
        bits: cur.bits - tpl.priceBits,
        inventory: res.next,
      },
      true
    );
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage(
      'system',
      `Comprou ${tpl.name} por ${formatDigitalCurrency(tpl.priceBits)}.`,
      {
        tone: 'loot',
      }
    );
  }

  function handleBuyMudfrigimonConsumable(
    itemKey: string,
    quantity = 1
  ): MudfrigimonPurchaseResult {
    const item = getMudfrigimonConsumableByKey(itemKey);
    if (!item) {
      return { ok: false, message: 'Item não encontrado na loja da MudFrigimon.' };
    }
    const safeQty = Math.max(1, Math.min(999, Math.floor(quantity)));
    const totalPrice = item.priceBits * safeQty;
    const cur = hudAccountRef.current;

    if (cur.bits < totalPrice) {
      playDigitalTone('error', soundEnabled);
      const msg = `Bits insuficientes! Necessário: ${formatDigitalCurrency(totalPrice)}.`;
      pushChatMessage('system', msg, { tone: 'warning' });
      return { ok: false, message: msg };
    }

    const unlockedSlots = getUnlockedInventorySlots(cur);
    const res = addInventoryItem(
      cur.inventory,
      {
        itemKey: item.itemKey,
        name: item.name,
        category: 'consumable',
        quantity: safeQty,
        description: item.description,
        iconUrl: item.iconUrl,
        rarity: item.rarity,
        usageInfo: item.usageInfo,
        hpRestore: item.hpRestore,
        dsRestore: item.dsRestore,
      },
      unlockedSlots
    );

    if (!res.added) {
      playDigitalTone('error', soundEnabled);
      const msg = `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots liberados). Libere espaço antes de comprar.`;
      pushChatMessage('system', msg, { tone: 'warning' });
      return { ok: false, message: msg };
    }

    commitHudAccount(
      {
        ...cur,
        bits: cur.bits - totalPrice,
        inventory: res.next,
      },
      true
    );
    playDigitalTone('confirm', soundEnabled);

    const qtyLabel = safeQty > 1 ? ` x${safeQty}` : '';
    const msg = `Comprou ${item.name}${qtyLabel} por ${formatDigitalCurrency(totalPrice)}! Item enviado ao Inventário.`;
    pushChatMessage('system', `[MudFrigimon] ${msg}`, { tone: 'loot' });
    return { ok: true, message: msg };
  }

  async function handleCreateMarketListing(
    item: InventoryItem,
    quantity: number,
    priceBits: number
  ): Promise<MarketActionResult> {
    if (isItemNonSellable(item)) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: 'Este item é vinculado à conta e não pode ser vendido no Mercado.',
      };
    }

    const cur = hudAccountRef.current;
    const invIdx = cur.inventory.findIndex((i) => i.id === item.id);
    if (invIdx < 0 || cur.inventory[invIdx].quantity < quantity) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: 'Quantidade insuficiente deste item no inventário.',
      };
    }

    const res = await createPlayerMarketListing({
      sellerUid: marketActorUid,
      sellerName: selection.tamerName,
      item: cur.inventory[invIdx],
      quantity,
      priceBits,
    });

    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }

    // Deduct the listed stack from player inventory immediately
    const latest = hudAccountRef.current;
    const latestIdx = latest.inventory.findIndex((i) => i.id === item.id);
    if (latestIdx >= 0) {
      const updatedInv = [...latest.inventory];
      if (updatedInv[latestIdx].quantity > quantity) {
        updatedInv[latestIdx] = {
          ...updatedInv[latestIdx],
          quantity: updatedInv[latestIdx].quantity - quantity,
        };
      } else {
        updatedInv.splice(latestIdx, 1);
      }
      commitHudAccount({ ...latest, inventory: updatedInv }, true);
    }

    playDigitalTone('confirm', soundEnabled);
    const qtyTag = quantity > 1 ? `${quantity}x ` : '';
    const hatchTag =
      item.category === 'digiegg' && (item.eggData?.hatchLevel ?? 0) > 0
        ? ` (${item.eggData?.hatchLevel}/5)`
        : '';
    const announceText = `[MERCADO] ${qtyTag}${item.name}${hatchTag} por ${formatDigitalCurrency(priceBits)} — Vitrine 2:00 no DATS!`;
    pushChatMessage('system', announceText, { tone: 'loot' });
    void sendGlobalChatMessage({
      senderUid: marketActorUid,
      senderName: selection.tamerName,
      isGmSender: isServerGm,
      mapId: simRef.current.mapId,
      text: announceText.slice(0, 140),
    });

    return { ok: true, message: res.message };
  }

  async function handleBuyMarketListing(
    listing: PlayerMarketListingRecord
  ): Promise<MarketActionResult> {
    const cur = hudAccountRef.current;
    if (cur.bits < listing.priceBits) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: `Bits insuficientes! Necessário: ${formatDigitalCurrency(listing.priceBits)}.`,
      };
    }

    const unlockedSlots = getUnlockedInventorySlots(cur);
    const payload = buildInventoryPayloadFromMarketListing(listing);
    const previewAdd = addInventoryItem(cur.inventory, payload, unlockedSlots);
    if (!previewAdd.added) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots). Libere espaço antes de comprar.`,
      };
    }

    const res = await purchasePlayerMarketListing({
      listingId: listing.listingId,
      buyerUid: marketActorUid,
      buyerName: selection.tamerName,
    });

    if (!res.ok || !res.purchasedListing) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }

    const latest = hudAccountRef.current;
    const finalSlots = getUnlockedInventorySlots(latest);
    const finalAdd = addInventoryItem(
      latest.inventory,
      buildInventoryPayloadFromMarketListing(res.purchasedListing),
      finalSlots
    );
    commitHudAccount(
      {
        ...latest,
        bits: Math.max(0, latest.bits - res.purchasedListing.priceBits),
        inventory: finalAdd.added ? finalAdd.next : latest.inventory,
      },
      true
    );

    playDigitalTone('confirm', soundEnabled);
    const qtyTag =
      res.purchasedListing.quantity > 1
        ? ` x${res.purchasedListing.quantity}`
        : '';
    const msg = `Comprou ${res.purchasedListing.itemName}${qtyTag} de ${res.purchasedListing.sellerName} por ${formatDigitalCurrency(res.purchasedListing.priceBits)}!`;
    pushChatMessage('system', `[Mercado] ${msg}`, { tone: 'loot' });
    return { ok: true, message: msg };
  }

  async function handleCancelMarketListing(
    listing: PlayerMarketListingRecord
  ): Promise<MarketActionResult> {
    const cur = hudAccountRef.current;
    const unlockedSlots = getUnlockedInventorySlots(cur);
    const payload = buildInventoryPayloadFromMarketListing(listing);
    const previewAdd = addInventoryItem(cur.inventory, payload, unlockedSlots);
    if (!previewAdd.added) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots). Libere 1 espaço para receber o item de volta.`,
      };
    }

    const res = await cancelPlayerMarketListing({
      listingId: listing.listingId,
      sellerUid: marketActorUid,
    });
    if (!res.ok || !res.cancelledListing) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }

    const latest = hudAccountRef.current;
    const finalAdd = addInventoryItem(
      latest.inventory,
      buildInventoryPayloadFromMarketListing(res.cancelledListing),
      getUnlockedInventorySlots(latest)
    );
    commitHudAccount(
      {
        ...latest,
        inventory: finalAdd.added ? finalAdd.next : latest.inventory,
      },
      true
    );
    playDigitalTone('click', soundEnabled);
    pushChatMessage(
      'system',
      `[Mercado] Anúncio de ${res.cancelledListing.itemName} retirado e devolvido ao inventário.`,
      { tone: 'loot' }
    );
    return { ok: true, message: res.message };
  }

  async function handleClaimMarketPayout(
    listing: PlayerMarketListingRecord
  ): Promise<MarketActionResult> {
    const res = await claimMarketListingPayout({
      listingId: listing.listingId,
      sellerUid: marketActorUid,
    });
    if (!res.ok || !res.priceBits) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }

    const latest = hudAccountRef.current;
    commitHudAccount(
      {
        ...latest,
        bits: latest.bits + res.priceBits,
      },
      true
    );
    playDigitalTone('confirm', soundEnabled);
    const msg = `Resgatou +${formatDigitalCurrency(res.priceBits)} pela venda de ${listing.itemName}!`;
    pushChatMessage('system', `[Mercado] ${msg}`, { tone: 'loot' });
    return { ok: true, message: msg };
  }

  function handleDeductGuildCreationBits(costBits: number): boolean {
    const cur = hudAccountRef.current;
    if (cur.bits < costBits) return false;
    commitHudAccount({
      ...cur,
      bits: cur.bits - costBits,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  function handleBuyDwCoinOffer(offer: DwCoinShopOffer): {
    ok: boolean;
    message: string;
  } {
    const cur = hudAccountRef.current;
    if (cur.dCoin < offer.priceDwCoin) {
      return {
        ok: false,
        message: `Saldo insuficiente. Você precisa de ${offer.priceDwCoin.toLocaleString('pt-BR')} DL Din.`,
      };
    }

    if (offer.reward.kind === 'expand_inventory') {
      const currentSlots = getUnlockedInventorySlots(cur);
      if (currentSlots >= INVENTORY_TOTAL_SLOTS) {
        return { ok: false, message: 'Seu Inventário já atingiu o limite máximo de slots.' };
      }
      const nextSlots = Math.min(INVENTORY_TOTAL_SLOTS, currentSlots + offer.reward.slots);
      const nextDCoin = cur.dCoin - offer.priceDwCoin;
      commitHudAccount(
        {
          ...cur,
          dCoin: nextDCoin,
          unlockedInventorySlots: nextSlots,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      void recordDwCoinSpendTransaction({
        username: selection.accountUsername || actorUid,
        tamerName: selection.tamerName,
        itemKey: offer.id,
        itemName: offer.name,
        category: offer.category,
        dwCoinAmount: offer.priceDwCoin,
        balanceAfter: nextDCoin,
      });
      const msg = `Mochila expandida para ${nextSlots} slots permanentes!`;
      pushNotification('Compra na Loja DL Din', `${offer.name} ativado (${nextSlots} slots).`);
      return { ok: true, message: msg };
    }

    if (offer.reward.kind === 'expand_archive') {
      const currentArch = getUnlockedArchiveSlots(cur);
      if (currentArch >= ARCHIVE_TOTAL_SLOTS) {
        return {
          ok: false,
          message: 'Seu Digimon Archive já atingiu o limite máximo de slots.',
        };
      }
      const nextArch = Math.min(ARCHIVE_TOTAL_SLOTS, currentArch + offer.reward.slots);
      const nextDCoin = cur.dCoin - offer.priceDwCoin;
      commitHudAccount(
        {
          ...cur,
          dCoin: nextDCoin,
          unlockedArchiveSlots: nextArch,
          updatedAt: new Date().toISOString(),
        },
        true
      );
      void recordDwCoinSpendTransaction({
        username: selection.accountUsername || actorUid,
        tamerName: selection.tamerName,
        itemKey: offer.id,
        itemName: offer.name,
        category: offer.category,
        dwCoinAmount: offer.priceDwCoin,
        balanceAfter: nextDCoin,
      });
      const msg = `Digimon Archive expandido para ${nextArch} slots permanentes!`;
      pushNotification('Compra na Loja DL Din', `${offer.name} ativado (${nextArch} slots).`);
      return { ok: true, message: msg };
    }

    const unlockedSlots = getUnlockedInventorySlots(cur);
    let nextInv = cur.inventory;

    if (offer.reward.kind === 'item') {
      let payload = createInventoryPayloadFromCatalog(
        offer.reward.itemKey,
        offer.reward.quantity
      );
      if (!payload) {
        return { ok: false, message: 'Item não encontrado no catálogo.' };
      }
      if (payload.eggData && offer.reward.eggHatchLevel !== undefined) {
        payload = {
          ...payload,
          eggData: {
            ...payload.eggData,
            hatchLevel: Math.max(0, Math.min(5, offer.reward.eggHatchLevel)),
          },
        };
      }
      const addRes = addInventoryItem(nextInv, payload, unlockedSlots);
      if (!addRes.added) {
        return {
          ok: false,
          message: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots). Libere espaço antes de comprar.`,
        };
      }
      nextInv = addRes.next;
    } else if (offer.reward.kind === 'bundle') {
      for (const entry of offer.reward.items) {
        const consumable = getMudfrigimonConsumableByKey(entry.itemKey);
        let payload = consumable
          ? {
              itemKey: consumable.itemKey,
              name: consumable.name,
              category: 'consumable' as const,
              quantity: entry.quantity,
              description: consumable.description,
              iconUrl: consumable.iconUrl,
              rarity: consumable.rarity,
              usageInfo: consumable.usageInfo,
              hpRestore: consumable.hpRestore,
              dsRestore: consumable.dsRestore,
            }
          : createInventoryPayloadFromCatalog(entry.itemKey, entry.quantity);
        if (!payload) continue;
        if (payload.eggData && entry.eggHatchLevel !== undefined) {
          const targetLv = Math.max(0, Math.min(5, entry.eggHatchLevel));
          payload = {
            ...payload,
            eggData: {
              ...payload.eggData,
              hatchLevel: targetLv,
              maxHatchLevel: Math.max(targetLv, payload.eggData.maxHatchLevel ?? 5),
            },
          };
        }
        const addRes = addInventoryItem(nextInv, payload, unlockedSlots);
        if (!addRes.added) {
          return {
            ok: false,
            message: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots). Libere espaço antes de comprar este pacote.`,
          };
        }
        nextInv = addRes.next;
      }
    }

    const nextDCoin = cur.dCoin - offer.priceDwCoin;
    commitHudAccount(
      {
        ...cur,
        dCoin: nextDCoin,
        inventory: nextInv,
        updatedAt: new Date().toISOString(),
      },
      true
    );
    void recordDwCoinSpendTransaction({
      username: selection.accountUsername || actorUid,
      tamerName: selection.tamerName,
      itemKey: offer.id,
      itemName: offer.name,
      category: offer.category,
      dwCoinAmount: offer.priceDwCoin,
      balanceAfter: nextDCoin,
    });
    const msg = `${offer.name} adquirido por ${offer.priceDwCoin.toLocaleString('pt-BR')} DL Din! Itens enviados ao seu Inventário.`;
    pushNotification('Compra na Loja DL Din', `${offer.name} adicionado ao seu Inventário.`);
    return { ok: true, message: msg };
  }

  function handleExecuteDataInject(
    eggItemId: string,
    useHatchBackup = false
  ) {
    const res = executeDataInjection(hudAccountRef.current, eggItemId, {
      useHatchBackup,
    });
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        outcome: res.outcome,
        message: res.message,
      };
    }
    commitHudAccount(res.next, true);
    if (res.outcome === 'success') {
      playIncubatorSuccessSound(soundEnabled);
      pushChatMessage('system', res.message, { tone: 'loot' });
    } else if (res.outcome === 'broken') {
      playIncubatorBrokenAlarmSound(soundEnabled);
      pushChatMessage('system', res.message, { tone: 'warning' });
    } else if (res.usedHatchBackup) {
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage('system', res.message, { tone: 'loot' });
    } else {
      playIncubatorFailCrackSound(soundEnabled);
    }
    return {
      ok: true,
      outcome: res.outcome,
      message: res.message,
      newLevel: res.newLevel,
      brokeEgg: res.brokeEgg,
      usedHatchBackup: res.usedHatchBackup,
      preventedBreak: res.preventedBreak,
      updatedEggId: res.updatedEggId,
    };
  }

  function handleExecuteEggHatch(eggItemId: string) {
    const res = executeDigiEggHatch(hudAccountRef.current, eggItemId);
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }
    commitHudAccount(res.next, true);
    pushChatMessage('system', res.message, { tone: 'loot' });

    if (res.hatchedFormId) {
      const hatchedForm = getDigimonFormProfile(res.hatchedFormId);
      setActiveHudWindow(null);
      setHatchShowcase({
        formId: res.hatchedFormId,
        speciesName: res.hatchedSpecies ?? hatchedForm.name,
        archiveSlotIndex: res.hatchedArchiveSlotIndex,
        grade: res.hatchedGrade ?? 3,
        sizePct: res.hatchedSizePct ?? 100,
        eggIconUrl: res.eggIconUrl,
        eggAccentColor: res.eggAccentColor ?? hatchedForm.theme.accentHex,
      });
    } else {
      playIncubatorSuccessSound(soundEnabled);
    }

    return {
      ok: true,
      message: res.message,
      hatchedSpecies: res.hatchedSpecies,
      hatchedGrade: res.hatchedGrade,
    };
  }

  function handleConfirmHatchNickname(nickname: string) {
    const currentShowcase = hatchShowcase;
    if (
      currentShowcase &&
      typeof currentShowcase.archiveSlotIndex === 'number' &&
      nickname.trim().length > 0
    ) {
      const res = renameArchivedDigimon(
        hudAccountRef.current,
        currentShowcase.archiveSlotIndex,
        nickname
      );
      if (res.ok) {
        commitHudAccount(res.next, true);
        const clean = nickname.trim().slice(0, 16);
        pushChatMessage(
          'system',
          `Seu novo ${currentShowcase.speciesName} foi batizado como "${clean}"!`,
          { tone: 'level' }
        );
      }
    }
    setHatchShowcase(null);
  }

  function handleExecuteEggReinforce(
    eggItemId: string,
    materialItemId: string | null
  ) {
    const res = executeEggReinforce(
      hudAccountRef.current,
      eggItemId,
      materialItemId
    );
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }
    commitHudAccount(res.next, true);
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage('system', res.message, { tone: 'loot' });
    return {
      ok: true,
      message: res.message,
      newReinforceLevel: res.newReinforceLevel,
      updatedEggId: res.updatedEggId,
    };
  }

  function triggerInWorldPartnerSwapFx(
    fromFormId: DigimonFormId,
    toFormId: DigimonFormId,
    toDisplayName?: string
  ) {
    const fromForm = getDigimonFormProfile(fromFormId);
    const toForm = getDigimonFormProfile(toFormId);
    simRef.current.evoAnim = null;
    simRef.current.evoFlashTimer = 0;
    simRef.current.swapAnim = {
      fromFormId: fromForm.id,
      toFormId: toForm.id,
      toName: toDisplayName || toForm.name,
      elapsed: 0,
      duration: 1.35,
      swapPoint: 0.44,
      fromAccentHex: fromForm.theme.accentHex,
      toAccentHex: toForm.theme.accentHex,
    };
    playPartnerSwapSound(soundEnabled);
  }

  function handleSwapArchiveSlot(slotIndex: number) {
    const prevForm = activeFormRef.current;
    const prevFormId = prevForm.id;
    const res = swapActiveDigimonWithArchiveSlot(
      hudAccountRef.current,
      activeStarterIdRef.current,
      slotIndex
    );
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.error ?? 'Não foi possível trocar de Digimon.' };
    }
    const nextFormId = res.next.digimon.activeFormId ?? prevFormId;
    void preloadDigimonPartnerAssets(nextFormId);
    if (res.newStarterId && res.newStarterId !== starterDigimon.digimonId) {
      onAdminSwitchStarter?.(res.newStarterId);
    }
    commitHudAccount(res.next, true);
    setEvolutionUnlockAlert(null);
    simRef.current.partner.special1Cooldown = 0;
    simRef.current.partner.special2Cooldown = 0;
    triggerInWorldPartnerSwapFx(prevFormId, nextFormId, res.activatedName);
    setActiveHudWindow(null);
    const msg = `${res.activatedName} ativado como parceiro! ${res.storedName} foi guardado no Slot #${slotIndex + 1}.`;
    pushChatMessage('system', `[Digimon Archive] ${msg}`, { tone: 'level' });
    return { ok: true, message: msg };
  }

  function handleReleaseArchiveSlot(slotIndex: number) {
    const res = releaseArchivedDigimon(hudAccountRef.current, slotIndex);
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.error ?? 'Não foi possível liberar este slot.' };
    }
    commitHudAccount(res.next, true);
    playDigitalTone('click', soundEnabled);
    const msg = `${res.releasedName ?? 'Digimon'} liberado do Slot #${slotIndex + 1} do Digimon Archive.`;
    pushChatMessage('system', `[Digimon Archive] ${msg}`, { tone: 'info' });
    return { ok: true, message: msg };
  }

  function handleSelectPartyReserve(reserveIndex: 0 | 1) {
    const prevForm = activeFormRef.current;
    const prevFormId = prevForm.id;
    const res = swapActiveDigimonWithPartyReserve(
      hudAccountRef.current,
      activeStarterIdRef.current,
      reserveIndex
    );
    if (!res.ok) {
      playDigitalTone('click', soundEnabled);
      pushChatMessage(
        'system',
        res.error ??
          `Círculo reserva ${reserveIndex + 2} vago — você pode andar com até 3 Digimons.`,
        { tone: 'info' }
      );
      return;
    }
    const nextFormId = res.next.digimon.activeFormId ?? prevFormId;
    void preloadDigimonPartnerAssets(nextFormId);
    if (res.newStarterId && res.newStarterId !== starterDigimon.digimonId) {
      onAdminSwitchStarter?.(res.newStarterId);
    }
    commitHudAccount(res.next, true);
    setEvolutionUnlockAlert(null);
    simRef.current.partner.special1Cooldown = 0;
    simRef.current.partner.special2Cooldown = 0;
    triggerInWorldPartnerSwapFx(prevFormId, nextFormId, res.activatedName);
    pushChatMessage(
      'system',
      `Parceiro trocado! ${res.activatedName} entrou em campo e ${res.storedName} foi para o Círculo Reserva ${reserveIndex + 2}.`,
      { tone: 'level' }
    );
  }

  function handleMoveArchiveToParty(slotIndex: number) {
    const res = moveArchiveSlotToPartyReserve(hudAccountRef.current, slotIndex);
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: res.error ?? 'Não foi possível enviar para a equipe.',
      };
    }
    commitHudAccount(res.next, true);
    playDigitalTone('confirm', soundEnabled);
    const msg = `${res.movedName} enviado para o Círculo Reserva ${res.partySlotNumber} abaixo da foto do Digimon!`;
    pushChatMessage('system', `[Equipe] ${msg}`, { tone: 'level' });
    return { ok: true, message: msg };
  }

  function handleMovePartyToArchive(reserveIndex: 0 | 1) {
    const res = movePartyReserveToArchive(hudAccountRef.current, reserveIndex);
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return {
        ok: false,
        message: res.error ?? 'Não foi possível guardar no Archive.',
      };
    }
    commitHudAccount(res.next, true);
    playDigitalTone('confirm', soundEnabled);
    const msg = `${res.movedName} guardado no Slot #${res.archiveSlotNumber} do Digimon Archive.`;
    pushChatMessage('system', `[Digimon Archive] ${msg}`, { tone: 'info' });
    return { ok: true, message: msg };
  }

  function handleOpenHudWindow(win: Exclude<HudWindowId, null>) {
    if (win === 'admin' && !isGM) return;
    playDigitalTone('click', soundEnabled);
    if (win === 'notifications') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setActiveHudWindow((curr) => (curr === win ? null : win));
  }

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const canEnterDataForest =
    isGM || hudAccount.tamer.level >= 10 || hudAccount.digimon.level >= 10;
  const canEnterDigiMountain =
    isGM || hudAccount.tamer.level >= 20 || hudAccount.digimon.level >= 20;
  const canEnterDigitalDesert =
    isGM || hudAccount.tamer.level >= 30 || hudAccount.digimon.level >= 30;
  const canEnterDataSea =
    isGM || hudAccount.tamer.level >= 40 || hudAccount.digimon.level >= 40;
  const canEnterDigimonIsland =
    isGM || hudAccount.tamer.level >= 50 || hudAccount.digimon.level >= 50;
  const canEnterDarkArea =
    isGM || hudAccount.tamer.level >= 60 || hudAccount.digimon.level >= 60;
  const canEnterVirtualWorld =
    isGM || hudAccount.tamer.level >= 70 || hudAccount.digimon.level >= 70;

  return (
    <section
      aria-label={
        liveSnapshot.mapId === VIRTUAL_WORLD_MAP_ID
          ? 'Mundo Virtual — Região de Caça Nv. 70 a 80'
          : liveSnapshot.mapId === DARK_AREA_MAP_ID
            ? 'Área Sombria — Região de Caça Nv. 60 a 70'
            : liveSnapshot.mapId === DIGIMON_ISLAND_MAP_ID
              ? 'Ilha dos Digimons — Região de Caça Nv. 50 a 60'
              : liveSnapshot.mapId === DATA_SEA_MAP_ID
                ? 'Mar de Dados — Região de Caça Nv. 40 a 50'
                : liveSnapshot.mapId === DIGITAL_DESERT_MAP_ID
                  ? 'Deserto Digital — Região de Caça Nv. 30 a 40'
                  : liveSnapshot.mapId === DIGI_MOUNTAIN_MAP_ID
                    ? 'Montanha Digi — Região de Caça Nv. 20 a 30'
                    : liveSnapshot.mapId === DATA_FOREST_MAP_ID
                      ? 'Floresta de Dados — Área de Caça e Raid Boss'
                      : liveSnapshot.mapId === HUNTING_MAP_ID
                        ? 'Planície Digital — Área de Caça'
                        : liveSnapshot.mapId === D_TERMINAL_MAP_ID
                          ? 'D-Terminal — Estação Trailmon'
                          : 'DATS Center — Praça Inicial'
      }
      className="relative h-dvh w-full overflow-hidden bg-[#030b1f]"
    >
      {/* Fullscreen World Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasTap}
        onPointerMove={handleCanvasPointerMove}
        onPointerLeave={() => {
          if (hoveredNpcIdRef.current !== null) {
            hoveredNpcIdRef.current = null;
            setHoveredNpcId(null);
          }
        }}
        className={`relative z-10 block h-full w-full touch-none ${
          hoveredNpcId ? 'cursor-pointer' : 'cursor-crosshair'
        }`}
      />

      {/* TOP HUD LAYER (Mobile: Left Tamer+Digimon | Right Minimap; Desktop sm+: Left Tamer | Center Digimon+Target | Right Minimap) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-1.5 p-1.5 sm:gap-2 sm:p-3">
        {/* Top-Left Column */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:gap-2">
          <TamerHudPanel
            character={character}
            tamerName={selection.tamerName}
            stats={hudAccount.tamer}
            tamerPhotoUrl={hudAccount.tamerPhotoUrl ?? null}
            inSafeZone={liveSnapshot.inSafeZone}
            isCombatMap={isCombatWorldMap(liveSnapshot.mapId)}
            levelUpPulse={levelUpPulse}
            onOpenCharacter={handleOpenCharacterWindow}
            onUpdateTamerPhoto={handleUpdateTamerPhoto}
          />

          {/* Mobile (<640px): Active Digimon stacked cleanly above switcher so zero overlap */}
          <div className="sm:hidden">
            <ActiveDigimonHudPanel
              digimon={activeFormProfile}
              stats={hudAccount.digimon}
              partnerState={liveSnapshot.partnerState}
              activeSkillBanner={liveSnapshot.activeSkillBanner}
              levelUpPulse={digimonLevelUpPulse}
              partyDigimons={sanitizedPartyDigimons}
              onOpenDigimon={() => handleOpenHudWindow('digimon')}
              onSelectPartyReserve={handleSelectPartyReserve}
            />
          </div>

          <DigimonSwitcherList
            activeDigimon={activeFormProfile}
            stats={hudAccount.digimon}
            partyDigimons={sanitizedPartyDigimons}
            onSelectPartyReserve={handleSelectPartyReserve}
            onSelectActiveDigimon={() => handleOpenHudWindow('digimon')}
            onSelectEmptySlot={(slotNum) => {
              playDigitalTone('click', soundEnabled);
              pushChatMessage(
                'system',
                `Slot ${slotNum} vago: traga Digimons do Digimon Archive ou puxe pelo Painel GM para andar com até 3 parceiros.`,
                { tone: 'info' }
              );
            }}
          />

          <PartyHudPanel
            party={playerParty}
            incomingInvites={incomingPartyInvites}
            incomingGuildInvites={incomingGuildInvites}
            actorUid={actorUid}
            currentMapId={liveSnapshot.mapId}
            currentChannelId={activeChannelId}
            onSwitchChannel={(ch) => handleSwitchChannel(ch)}
            onAcceptInvite={(invite) => handleAcceptPartyInvite(invite)}
            onDeclineInvite={(inviteId) => handleDeclinePartyInvite(inviteId)}
            onAcceptGuildInvite={(invite) => handleAcceptGuildInvite(invite)}
            onDeclineGuildInvite={(inviteId) =>
              handleDeclineGuildInvite(inviteId)
            }
            onLeaveParty={() => void handleLeaveParty()}
            onKickMember={(targetUid) => void handleKickPartyMember(targetUid)}
          />
        </div>

        {/* Top-Center Active Digimon + Battle Target (Desktop sm+ only; hidden on mobile so Minimap sits cleanly beside Tamer & Digimon) */}
        <div className="hidden flex-col items-center gap-1.5 sm:flex">
          <div>
            <ActiveDigimonHudPanel
              digimon={activeFormProfile}
              stats={hudAccount.digimon}
              partnerState={liveSnapshot.partnerState}
              activeSkillBanner={liveSnapshot.activeSkillBanner}
              levelUpPulse={digimonLevelUpPulse}
              partyDigimons={sanitizedPartyDigimons}
              onOpenDigimon={() => handleOpenHudWindow('digimon')}
              onSelectPartyReserve={handleSelectPartyReserve}
            />
          </div>

          {liveSnapshot.targetEnemy && (() => {
            const targetPortraitUrl = getWildDigimonPortraitUrl(
              liveSnapshot.targetEnemy.species
            );
            const isBossTarget = Boolean(liveSnapshot.targetEnemy.isBoss);
            return (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={`Alvo em batalha: ${liveSnapshot.targetEnemy.name}`}
                className={`pointer-events-auto flex w-[198px] items-center gap-2 rounded-xl border px-2 py-1.5 select-none sm:w-[264px] sm:px-2.5 ${
                  isBossTarget
                    ? 'border-amber-300/90 bg-[#1a0714]/94 shadow-[0_0_24px_rgba(239,68,68,0.6)]'
                    : 'border-rose-400/75 bg-[#0a0b24]/92 shadow-[0_0_18px_rgba(244,63,94,0.42)]'
                }`}
              >
                {targetPortraitUrl && (
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 sm:h-11 sm:w-11 ${
                      isBossTarget
                        ? 'border-amber-300/75 bg-gradient-to-b from-[#450a0a] to-[#120408]'
                        : 'border-rose-400/55 bg-gradient-to-b from-[#1e1038] to-[#08071a]'
                    }`}
                  >
                    <img
                      src={targetPortraitUrl}
                      alt={liveSnapshot.targetEnemy.name}
                      className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`flex min-w-0 items-center gap-1 truncate text-[10px] font-black tracking-wide sm:text-[11px] ${
                        isBossTarget ? 'text-amber-200' : 'text-rose-200'
                      }`}
                    >
                      {isBossTarget && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-300" />
                      )}
                      <span className="truncate">
                        {isBossTarget
                          ? `BOSS · ${liveSnapshot.targetEnemy.name}`
                          : liveSnapshot.targetEnemy.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-[9.5px] font-black tabular-nums text-amber-300">
                      Lv.{liveSnapshot.targetEnemy.level}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full border border-rose-400/40 bg-[#020612]">
                    <div
                      className="dmo-hp-fill h-full transition-[width] duration-150"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (liveSnapshot.targetEnemy.hp /
                              Math.max(1, liveSnapshot.targetEnemy.maxHp)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <DigimonClassificationBadges
                      classification={liveSnapshot.targetEnemy.classification}
                      variant="target"
                    />
                    <span className="shrink-0 text-[8.5px] font-bold tabular-nums text-rose-100/90">
                      {Math.max(0, Math.round(liveSnapshot.targetEnemy.hp)).toLocaleString('pt-BR')}/
                      {liveSnapshot.targetEnemy.maxHp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Top-Right Minimap + Boss Portrait */}
        <div className="flex flex-col items-end gap-1.5">
          <MinimapHudPanel
            snapshot={liveSnapshot}
            minimapSize={preferences.minimapSize}
            tamerId={selection.characterId}
            tamerPhotoUrl={hudAccount.tamerPhotoUrl ?? null}
            partnerFormId={activeFormProfile.id}
            onOpenFullMap={() => handleOpenHudWindow('map')}
          />
          {worldBossState && worldBossState.mapId === liveSnapshot.mapId && (
            <WorldBossHudCard
              bossState={worldBossState}
              bossNowMs={bossNowMs}
              currentMapId={liveSnapshot.mapId}
              localTamerName={selection.tamerName}
              rankingDismissed={bossRankingDismissed}
              onDismissRanking={() => setBossRankingDismissed(true)}
              onNavigateToBoss={() => {
                playDigitalTone('click', soundEnabled);
                if (liveSnapshot.mapId === DATA_FOREST_MAP_ID) {
                  simRef.current.tapTarget = {
                    x: DATA_FOREST_BOSS_ARENA.x,
                    y: DATA_FOREST_BOSS_ARENA.y + 84,
                  };
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Global GM Server Announcement & Maintenance Banner */}
      {serverAnnouncement?.active &&
        dismissedAnnouncementId !== serverAnnouncement.announcementId && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            role="status"
            className={`pointer-events-auto absolute left-1/2 top-[68px] z-35 flex w-[min(94vw,480px)] -translate-x-1/2 items-center justify-between gap-2.5 rounded-xl border px-3 py-2 shadow-2xl backdrop-blur-md sm:top-[62px] ${
              serverAnnouncement.maintenanceMode ||
              serverAnnouncement.severity === 'maintenance'
                ? 'border-rose-300/80 bg-[#2a0714]/95 text-rose-50 shadow-[0_0_24px_rgba(244,63,94,0.45)]'
                : serverAnnouncement.severity === 'warning'
                  ? 'border-amber-300/80 bg-[#261805]/95 text-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : serverAnnouncement.severity === 'event'
                    ? 'border-fuchsia-300/80 bg-[#1a0a36]/95 text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                    : 'border-cyan-300/75 bg-[#051844]/95 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/25">
                {serverAnnouncement.maintenanceMode ||
                serverAnnouncement.severity === 'maintenance' ? (
                  <Wrench className="h-3.5 w-3.5 text-rose-300" />
                ) : serverAnnouncement.severity === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                ) : (
                  <Megaphone className="h-3.5 w-3.5 text-cyan-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-wider text-amber-200">
                  {serverAnnouncement.maintenanceMode ? '[MANUTENÇÃO] ' : ''}
                  {serverAnnouncement.title}
                </p>
                <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white/95">
                  {serverAnnouncement.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setDismissedAnnouncementId(serverAnnouncement.announcementId)
              }
              aria-label="Dispensar aviso global"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/20 bg-black/25 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

      {/* Global Raid Boss Spawn / Defeat Screen Announcement */}
      {bossAnnouncement && (
        <WorldBossGlobalBanner
          announcement={bossAnnouncement}
          inDataForest={liveSnapshot.mapId === DATA_FOREST_MAP_ID}
          onGoToTree={() => {
            simRef.current.tapTarget = {
              x: DATA_FOREST_BOSS_ARENA.x,
              y: DATA_FOREST_BOSS_ARENA.y + 84,
            };
            playDigitalTone('click', soundEnabled);
          }}
          onClose={() => setBossAnnouncement(null)}
        />
      )}

      {/* Selected Online Player Inspector Card */}
      {selectedRemotePlayer && (() => {
        const myGuild = playerGuild;
        const canInviteToGuild = Boolean(
          myGuild && canMemberInviteToGuild(myGuild, actorUid)
        );
        const targetAlreadyInMyGuild = Boolean(
          myGuild && myGuild.memberUids.includes(selectedRemotePlayer.uid)
        );
        const targetInAnotherGuild = Boolean(
          selectedRemotePlayer.guildName &&
            (!myGuild || selectedRemotePlayer.guildName !== myGuild.name)
        );
        const myGuildIsFull = Boolean(
          myGuild &&
            myGuild.memberUids.length >=
              getGuildMaxMembersForLevel(myGuild.level)
        );
        const guildInviteDisabled =
          targetAlreadyInMyGuild || targetInAnotherGuild || myGuildIsFull;
        const guildInviteLabel = targetAlreadyInMyGuild
          ? 'Na Guilda'
          : targetInAnotherGuild
            ? 'Outra Guilda'
            : myGuildIsFull
              ? 'Guilda Cheia'
              : 'Convidar Guilda';
        const partyLeaderOnlyBlocked = Boolean(
          playerParty && playerParty.leaderUid !== actorUid
        );

        return (
          <RemotePlayerInspectorCard
            player={selectedRemotePlayer}
            partyMemberUids={playerParty?.memberUids ?? []}
            partyFull={(playerParty?.memberUids.length ?? 0) >= MAX_PARTY_MEMBERS}
            partyLeaderOnlyBlocked={partyLeaderOnlyBlocked}
            onInviteParty={(targetPlayer) =>
              void handleInvitePlayerToParty(
                targetPlayer.uid,
                targetPlayer.tamerName
              )
            }
            canInviteGuild={canInviteToGuild}
            guildInviteDisabled={guildInviteDisabled}
            guildInviteLabel={guildInviteLabel}
            onInviteGuild={(targetPlayer) =>
              void handleInvitePlayerToGuild(
                targetPlayer.uid,
                targetPlayer.tamerName,
                targetPlayer.guildName
              )
            }
            onMeetPlayer={handleMeetPlayer}
            onWaveHello={(targetName) => {
              const greeting = `Olá, ${targetName}! Bora explorar juntos!`;
              localBubbleRef.current = {
                text: greeting,
                expiresAt: Date.now() + 5500,
              };
              pushChatMessage('map', greeting, {
                sender: selection.tamerName,
                isGmSender: isServerGm,
              });
              void broadcastWorldChatBubble(
                greeting,
                buildLocalPresenceSnapshot()
              );
            }}
            onClose={() => setSelectedRemotePlayer(null)}
          />
        );
      })()}

      {/* Special Ready-to-Evolve / Evoluter Unlock Announcement Banner when hitting Lv. 15 / 30 / 50 */}
      {evolutionUnlockAlert && (() => {
        const alertEvoCost = getFormEvoluterCost(
          activeStarterId,
          evolutionUnlockAlert.id
        );
        const alertNeedsEvoluter =
          alertEvoCost > 0 &&
          !isEvolutionSlotUnlockedByEvoluter(
            activeStarterId,
            evolutionUnlockAlert.id,
            hudAccount.digimon
          );
        return (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            role="status"
            className={`animate-dmo-window pointer-events-auto absolute left-1/2 top-[174px] z-35 flex w-[min(92vw,390px)] -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 sm:top-[132px] ${
              alertNeedsEvoluter
                ? 'border-fuchsia-300 bg-[#0b1344]/96 shadow-[0_0_26px_rgba(232,121,249,0.58)]'
                : 'border-amber-300 bg-[#051844]/96 shadow-[0_0_24px_rgba(251,191,36,0.58)]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={evolutionUnlockAlert.portraitUrl}
                alt={evolutionUnlockAlert.name}
                className={`h-9 w-9 shrink-0 rounded-full border bg-[#082463] object-contain p-0.5 ${
                  alertNeedsEvoluter ? 'border-fuchsia-300/80' : 'border-amber-300/70'
                }`}
              />
              <div className="min-w-0">
                <p
                  className={`text-[9.5px] font-black uppercase tracking-wider ${
                    alertNeedsEvoluter ? 'text-fuchsia-200' : 'text-amber-300'
                  }`}
                >
                  {alertNeedsEvoluter
                    ? `Desbloqueio com Evoluter · Nv.${evolutionUnlockAlert.unlockLevel}`
                    : `Evolução Pronta! · Nv.${evolutionUnlockAlert.unlockLevel}`}
                </p>
                <p className="truncate text-[11px] font-extrabold text-white">
                  {alertNeedsEvoluter ? 'Liberar ' : 'Evoluir para '}
                  <span style={{ color: evolutionUnlockAlert.theme.accentHex }}>
                    {evolutionUnlockAlert.name}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {alertNeedsEvoluter ? (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = evolutionUnlockAlert.id;
                    setEvolutionUnlockAlert(null);
                    setEvoluterUnlockFormId(targetId);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-fuchsia-200/90 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-[0_0_14px_rgba(232,121,249,0.5)] hover:brightness-115 active:scale-95"
                >
                  <img
                    src={EVOLUTER_ICON_URL}
                    alt=""
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-[3px] object-cover"
                  />
                  <span>×{alertEvoCost}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTriggerEvolution(evolutionUnlockAlert)}
                  className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                >
                  Evoluir
                </button>
              )}
              <button
                type="button"
                onClick={() => setEvolutionUnlockAlert(null)}
                aria-label="Dispensar aviso de evolução"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/35 bg-[#072154] text-cyan-200 hover:bg-sky-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Rare DigiEgg Drop Announcement Banner (Top-Center) */}
      <DigiEggDropAlertBanner alert={eggDropAlert} />

      {/* Visual Item Drop Reward Toasts (DATA, DigiEggs, Consumables) */}
      <DropRewardToastStack toasts={dropToasts} />

      {/* Clean Mobile-First Inventory Window with Tap-to-Inspect & Attached Trash Mode */}
      {inventoryOpen && (
        <InventoryHudWindow
          open={inventoryOpen}
          items={hudAccount.inventory}
          unlockedSlots={getUnlockedInventorySlots(hudAccount)}
          bits={hudAccount.bits}
          dCoin={hudAccount.dCoin}
          onClose={() => setInventoryOpen(false)}
          onUseItem={handleUseInventoryItem}
          onEquipItem={handleEquipInventoryItem}
          onDiscardItem={handleDiscardInventoryItem}
          onDiscardItems={handleDiscardInventoryItems}
          onSortInventory={handleSortInventory}
          foodSlotItemKey={quickSlots.foodItemKey}
          vitaminSlotItemKey={quickSlots.vitaminItemKey}
          onAssignQuickSlot={(slot, itemKey) =>
            handleAssignQuickSlot(slot, itemKey)
          }
        />
      )}

      {/* LOWER HUD LAYER: Bottom-Left Chat (above GM on mobile so it clears CH without touching Party) + GM Button + Mobile Joystick */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-25 flex items-end justify-between gap-2 px-1.5 sm:bottom-3 sm:px-3">
        {/* Bottom-Left Corner: On mobile -> [Chat] slightly above [GM] above [Joystick]; on desktop -> [GM] above [Chat] */}
        <div className="flex flex-col items-start gap-1.5 sm:gap-2">
          {isGM && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => handleOpenHudWindow('admin')}
              aria-label="Abrir Painel GM"
              aria-pressed={activeHudWindow === 'admin'}
              title="Painel GM (F9)"
              className={`pointer-events-auto order-2 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black tracking-wide transition active:scale-95 md:order-1 ${
                activeHudWindow === 'admin'
                  ? 'border-amber-200 bg-gradient-to-b from-[#7c3f08] via-[#4a2304] to-[#291102] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.72)]'
                  : 'border-amber-300/85 bg-gradient-to-b from-[#4a2605]/95 via-[#2a1503]/95 to-[#160a02]/95 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.45)] hover:border-amber-200 hover:brightness-110'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-300" />
              <span>GM</span>
            </button>
          )}
          <div
            className={`order-1 md:order-2 ${
              isGM ? 'mb-1 md:mb-0' : 'mb-8 md:mb-0'
            }`}
          >
          <ChatHudPanel
            messages={chatMessages}
            activeChannel={chatChannel}
            onChangeChannel={setChatChannel}
            onSendMessage={(text) => {
              const trimmed = text.trim();
              const normalizeLookup = (val: string) =>
                val
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase()
                  .trim();

              const findOnlinePlayerByName = (rawName: string) => {
                const targetNorm = normalizeLookup(rawName);
                if (!targetNorm) return null;
                return (
                  remotePlayers.find(
                    (p) => normalizeLookup(p.tamerName) === targetNorm
                  ) ??
                  remotePlayers.find((p) =>
                    normalizeLookup(p.tamerName).startsWith(targetNorm)
                  ) ??
                  remotePlayers.find((p) =>
                    normalizeLookup(p.tamerName).includes(targetNorm)
                  ) ??
                  null
                );
              };

              // Party invite command: /invite Nome, /invite+Nome, or /convidar Nome
              if (/^\/(?:invite|convidar)(?:$|\s|\+)/i.test(trimmed)) {
                const inviteMatch = /^\/(?:invite|convidar)(?:\+|\s+)(.+)$/i.exec(
                  trimmed
                );
                if (!inviteMatch || !inviteMatch[1].trim()) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    '[Party] Uso: digite /invite NomeDoJogador para enviar um convite de Party.',
                    { tone: 'warning' }
                  );
                  return;
                }
                const rawTarget = inviteMatch[1].trim();
                const matched = findOnlinePlayerByName(rawTarget);
                if (!matched) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    `[Party] Jogador "${rawTarget}" não encontrado online no servidor.`,
                    { tone: 'warning' }
                  );
                  return;
                }
                void handleInvitePlayerToParty(matched.uid, matched.tamerName);
                return;
              }

              // Guild invite command: /ginvite Nome (Leader & Sub-Leader only)
              if (/^\/ginvite(?:$|\s|\+)/i.test(trimmed)) {
                const guildInviteMatch = /^\/ginvite(?:\+|\s+)(.+)$/i.exec(
                  trimmed
                );
                if (!guildInviteMatch || !guildInviteMatch[1].trim()) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    '[Guilda] Uso: digite /ginvite NomeDoJogador para convidar para sua Guilda.',
                    { tone: 'warning' }
                  );
                  return;
                }
                const rawTarget = guildInviteMatch[1].trim();
                const matched = findOnlinePlayerByName(rawTarget);
                if (!matched) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    `[Guilda] Jogador "${rawTarget}" não encontrado online no servidor.`,
                    { tone: 'warning' }
                  );
                  return;
                }
                void handleInvitePlayerToGuild(
                  matched.uid,
                  matched.tamerName,
                  matched.guildName
                );
                return;
              }

              // Strict Party-only chat
              if (chatChannel === 'party') {
                const activeParty = playerPartyRef.current;
                if (!activeParty) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    '[Party] Você não está em uma Party. Clique em um jogador ou digite /invite Nome para convidar.',
                    { tone: 'warning' }
                  );
                  return;
                }
                void sendPartyChatMessage({
                  partyId: activeParty.partyId,
                  senderUid: actorUid,
                  senderName: selection.tamerName,
                  isGmSender: isServerGm,
                  text: trimmed,
                }).then((sentOk) => {
                  if (!sentOk) {
                    playDigitalTone('error', soundEnabled);
                    pushChatMessage(
                      'party',
                      'Não foi possível enviar no chat da Party agora. Tente novamente.',
                      { tone: 'warning' }
                    );
                  }
                });
                return;
              }

              // Strict Guild-only chat
              if (chatChannel === 'guild') {
                const activeGuild = playerGuildRef.current;
                if (!activeGuild) {
                  playDigitalTone('error', soundEnabled);
                  pushChatMessage(
                    'system',
                    '[Guilda] Você precisa entrar ou criar uma Guilda para falar neste canal.',
                    { tone: 'warning' }
                  );
                  return;
                }
                void sendGuildChatMessage({
                  guildId: activeGuild.guildId,
                  actorUid,
                  tamerName: selection.tamerName,
                  text: trimmed,
                });
                return;
              }

              // Global cross-map server chat (also used automatically if player sends while on Sistema tab)
              if (chatChannel === 'global' || chatChannel === 'system') {
                if (chatChannel === 'system') {
                  setChatChannel('global');
                }
                void sendGlobalChatMessage({
                  senderUid: actorUid,
                  senderName: selection.tamerName,
                  isGmSender: isServerGm,
                  mapId: simRef.current.mapId,
                  text: trimmed,
                }).then((sentOk) => {
                  if (!sentOk) {
                    playDigitalTone('error', soundEnabled);
                    pushChatMessage(
                      'global',
                      'Não foi possível enviar no Global agora. Verifique sua conexão ou regras do Firestore.',
                      { tone: 'warning' }
                    );
                  }
                });
                return;
              }

              // Local Map proximity chat (only players nearby on the SAME map receive it)
              if (chatChannel === 'map') {
                pushChatMessage('map', trimmed, {
                  sender: selection.tamerName,
                  isGmSender: isServerGm,
                });
                localBubbleRef.current = {
                  text: trimmed,
                  expiresAt: Date.now() + 5500,
                };
                void broadcastWorldChatBubble(
                  trimmed,
                  buildLocalPresenceSnapshot()
                );
                return;
              }
            }}
            onChatFocusChange={(focused) => {
              isChatFocusedRef.current = focused;
            }}
          />
          </div>

          {/* Mobile Touch Virtual Joystick (bottom-left corner directly under GM & Chat) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto order-3 md:hidden"
          >
            <div
              ref={joystickBaseRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!joystickActiveRef.current) return;
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerUp={resetJoystick}
              onPointerCancel={resetJoystick}
              aria-label="Controle virtual de 4 direções"
              className="relative flex h-[84px] w-[84px] touch-none items-center justify-center rounded-full border-2 border-cyan-400/60 bg-[#041232]/82 shadow-[0_0_18px_rgba(0,180,255,0.32)]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-14 w-[1px] bg-cyan-300/25"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-[1px] w-14 bg-cyan-300/25"
              />
              <div
                ref={joystickKnobElRef}
                className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/85 bg-gradient-to-b from-[#38e8ff] to-[#0066e6] shadow-[0_0_12px_rgba(0,212,255,0.7)] will-change-transform"
                style={{
                  transform: 'translate3d(0px, 0px, 0)',
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white/85" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-CENTER DIGIMON ACTION DOCK: [F1] above Rookie · [F2] above Champion · [Food] above Ultimate · [Vitamin] above Mega */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-[28] -translate-x-1/2 sm:bottom-3 md:left-[calc(50%+86px)] xl:left-1/2">
        <DigimonBottomActionDock
          digimon={activeFormProfile}
          starterId={activeStarterId}
          stats={hudAccount.digimon}
          snapshot={liveSnapshot}
          ownedEvoluters={getOwnedEvoluterCount(hudAccount.inventory)}
          inventory={hudAccount.inventory}
          foodSlotItemKey={quickSlots.foodItemKey}
          vitaminSlotItemKey={quickSlots.vitaminItemKey}
          onTriggerSkill={handleTriggerManualSkill}
          onEvolveForm={handleTriggerEvolution}
          onRequestUnlockForm={(formId) => {
            playDigitalTone('click', soundEnabled);
            setEvoluterUnlockFormId(formId);
          }}
          onUseQuickSlot={(slot) => handleUseQuickSlot(slot)}
          onAssignQuickSlot={handleAssignQuickSlot}
        />
      </div>

      {/* COMPACT PROFESSIONAL "MENU" BASE BUTTON + SERVER EXP BADGE + DMO 5-CHANNEL SELECTOR */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[38]">
        <BottomHudDock
          activeWindow={activeHudWindow}
          inventoryOpen={inventoryOpen}
          unreadNotifications={unreadNotifs}
          eggCollectedPulse={eggCollectedPulse}
          autoHuntEnabled={autoHuntConfig.enabled}
          autoHuntTargetsCount={autoHuntConfig.targetSpecies.length}
          serverExpRatePct={serverExpRatePct}
          guildExpBonusPct={guildDailyEventXpPct}
          xpBoostUntilMs={hudAccount.xpBoostUntilMs ?? null}
          isGM={isGM}
          currentMapId={liveSnapshot.mapId}
          currentChannelId={activeChannelId}
          channelCounts={channelCounts}
          partyChannelCounts={partyChannelCounts}
          partyLeaderChannelId={partyLeaderChannelId}
          channelSwitching={channelSwitching}
          onSelectChannel={(ch) => handleSwitchChannel(ch)}
          onAdminChangeExpRate={isGM ? handleAdminSetServerExpRate : undefined}
          onToggleInventory={() => {
            playDigitalTone('click', soundEnabled);
            setInventoryOpen((o) => !o);
          }}
          onOpenWindow={handleOpenHudWindow}
        />
      </div>

      {/* Station / D-Terminal Trailmon Conductor Modal */}
      {activeStationModal && (
        <div
          onClick={() => setActiveStationModal(null)}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/68 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-dmo-window w-full max-w-[404px] rounded-2xl border-2 border-cyan-300/75 bg-gradient-to-b from-[#071d4d] via-[#041130] to-[#030b20] p-4 text-white shadow-[0_0_32px_rgba(0,190,255,0.45)]"
          >
            <div className="flex items-start justify-between gap-2 border-b border-cyan-400/25 pb-2.5">
              <div className="flex items-center gap-2.5">
                {activeStationModal.id === D_TERMINAL_CONDUCTOR_NPC.id ? (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/65 bg-gradient-to-b from-[#0b3b36] to-[#051822] p-0.5 shadow-[0_0_12px_rgba(52,211,153,0.35)]">
                    <img
                      src={PAWNCHESSMON_BLACK_SPRITE_URL}
                      alt="PawnChessmon (Black)"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/50 bg-[#07265c]">
                    {renderInteractionIcon(activeStationModal.kind)}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {activeStationModal.badge}
                  </p>
                  <h2 className="text-sm font-black tracking-wide text-white">
                    {activeStationModal.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStationModal(null)}
                aria-label="Fechar janela de interação"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#082256] text-cyan-200 hover:bg-sky-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-sky-100/90">
              {activeStationModal.description}
            </p>

            {activeStationModal.id === D_TERMINAL_CONDUCTOR_NPC.id ? (
              <div className="mt-3.5 flex max-h-[54vh] flex-col gap-2 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => travelToMap(HUNTING_MAP_ID)}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-300/70 bg-gradient-to-r from-[#0b3b82] to-[#08285c] px-3 py-2.5 text-left transition hover:brightness-110 active:scale-[0.98]"
                >
                  <div>
                    <p className="text-xs font-black text-white">
                      Planície Digital
                    </p>
                    <p className="text-[10px] font-semibold text-cyan-200/85">
                      Área de Caça Inicial · Digimons Nv. 1–10
                    </p>
                  </div>
                  <span className="rounded-md bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-200">
                    Embarcar
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDataForest}
                  onClick={() => {
                    if (canEnterDataForest) {
                      travelToMap(DATA_FOREST_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDataForest
                      ? 'border-emerald-300/70 bg-gradient-to-r from-[#0c4a38] to-[#062922] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-white">
                      Floresta de Dados
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-200/85">
                      {canEnterDataForest
                        ? 'Área Avançada & Raid Kuwagamon · Nv. 10–20'
                        : 'Requer Tamer ou Digimon Nv. 10+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDataForest
                        ? 'bg-emerald-400/20 text-emerald-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDataForest ? 'Embarcar' : 'Nv.10+'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDigiMountain}
                  onClick={() => {
                    if (canEnterDigiMountain) {
                      travelToMap(DIGI_MOUNTAIN_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDigiMountain
                      ? 'border-violet-300/75 bg-gradient-to-r from-[#241c64] via-[#10306d] to-[#0b234d] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Mountain className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Montanha Digi</span>
                    </p>
                    <p className="text-[10px] font-semibold text-violet-200/90">
                      {canEnterDigiMountain
                        ? 'Área de Caça · Champions Nv. 20–30'
                        : 'Requer Tamer ou Digimon Nv. 20+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDigiMountain
                        ? 'bg-violet-400/25 text-cyan-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDigiMountain ? 'Embarcar' : 'Nv.20+'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDigitalDesert}
                  onClick={() => {
                    if (canEnterDigitalDesert) {
                      travelToMap(DIGITAL_DESERT_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDigitalDesert
                      ? 'border-amber-300/75 bg-gradient-to-r from-[#5c3008] via-[#452006] to-[#291305] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Sun className="h-3.5 w-3.5 text-amber-300" />
                      <span>Deserto Digital</span>
                    </p>
                    <p className="text-[10px] font-semibold text-amber-200/90">
                      {canEnterDigitalDesert
                        ? 'Área de Caça · Ultimates Nv. 30–40'
                        : 'Requer Tamer ou Digimon Nv. 30+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDigitalDesert
                        ? 'bg-amber-400/25 text-amber-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDigitalDesert ? 'Embarcar' : 'Nv.30+'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDataSea}
                  onClick={() => {
                    if (canEnterDataSea) {
                      travelToMap(DATA_SEA_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDataSea
                      ? 'border-cyan-300/75 bg-gradient-to-r from-[#0a3c6b] via-[#075985] to-[#082f49] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Mar de Dados</span>
                    </p>
                    <p className="text-[10px] font-semibold text-cyan-200/90">
                      {canEnterDataSea
                        ? 'Área de Caça · Ultimates Nv. 40–50'
                        : 'Requer Tamer ou Digimon Nv. 40+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDataSea
                        ? 'bg-cyan-400/25 text-cyan-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDataSea ? 'Embarcar' : 'Nv.40+'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDigimonIsland}
                  onClick={() => {
                    if (canEnterDigimonIsland) {
                      travelToMap(DIGIMON_ISLAND_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDigimonIsland
                      ? 'border-sky-300/80 bg-gradient-to-r from-[#0b4f8c] via-[#1d4ed8] to-[#0c295c] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                      <span>Ilha dos Digimons</span>
                    </p>
                    <p className="text-[10px] font-semibold text-sky-200/90">
                      {canEnterDigimonIsland
                        ? 'Área de Caça · Megas Nv. 50–60'
                        : 'Requer Tamer ou Digimon Nv. 50+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDigimonIsland
                        ? 'bg-sky-400/25 text-sky-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDigimonIsland ? 'Embarcar' : 'Nv.50+'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDarkArea}
                  onClick={() => {
                    if (canEnterDarkArea) {
                      travelToMap(DARK_AREA_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDarkArea
                      ? 'border-purple-300/80 bg-gradient-to-r from-[#2e1065] via-[#6d28d9] to-[#1e1b4b] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                      <span>Área Sombria</span>
                    </p>
                    <p className="text-[10px] font-semibold text-purple-200/90">
                      {canEnterDarkArea
                        ? 'Área de Caça · Megas Nv. 60–70'
                        : 'Requer Tamer ou Digimon Nv. 60+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDarkArea
                        ? 'bg-purple-400/25 text-purple-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDarkArea ? 'Embarcar' : 'Nv.60+'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (canEnterVirtualWorld) {
                      travelToMap(VIRTUAL_WORLD_MAP_ID);
                    } else {
                      playDigitalTone('error', soundEnabled);
                      pushChatMessage(
                        'system',
                        'O Mundo Virtual exige Tamer ou Digimon nível 70+.',
                        { tone: 'warning' }
                      );
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterVirtualWorld
                      ? 'border-sky-300/65 bg-sky-500/20 hover:bg-sky-500/35'
                      : 'border-slate-500/40 bg-slate-900/60 opacity-75'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-black text-white">
                      <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                      <span>Mundo Virtual</span>
                    </p>
                    <p className="text-[10px] font-semibold text-sky-200/90">
                      {canEnterVirtualWorld
                        ? 'Área de Caça · Megas Nv. 70–80'
                        : 'Requer Tamer ou Digimon Nv. 70+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterVirtualWorld
                        ? 'bg-sky-400/25 text-sky-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterVirtualWorld ? 'Embarcar' : 'Nv.70+'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-cyan-400/25 bg-[#051840]/85 px-3 py-2">
                <span className="text-[11px] font-semibold text-cyan-200/90">
                  Módulo: {activeStationModal.futureModule}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStationModal(null)}
                  className="rounded-lg border border-cyan-300/60 bg-cyan-500/20 px-3 py-1 text-[11px] font-black uppercase text-cyan-100 hover:bg-cyan-500/35"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portal Travel Confirmation Modal (Sim / Não) */}
      {pendingPortalConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/62 p-4 backdrop-blur-[2px]"
          onPointerDown={(e) => {
            e.stopPropagation();
            playDigitalTone('click', soundEnabled);
            setPendingPortalConfirm(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-confirm-title"
            className="w-full max-w-[380px] rounded-2xl border border-cyan-400/50 bg-[#071a3e]/98 p-5 text-sky-100 shadow-[0_24px_60px_rgba(0,0,0,0.82)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                  Atravessar Portal
                </p>
                <h3
                  id="portal-confirm-title"
                  className="mt-0.5 text-base font-black text-white"
                >
                  {pendingPortalConfirm.title}
                </h3>
                {pendingPortalConfirm.subtitle && (
                  <p className="mt-0.5 text-xs text-sky-200/80">
                    {pendingPortalConfirm.subtitle}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm font-medium leading-relaxed text-sky-100">
              Deseja ir para{' '}
              <span className="font-black text-white">
                {pendingPortalConfirm.title}
              </span>
              ?
            </p>
            {pendingPortalConfirm.minLevel > 1 && (
              <p className="mt-1 text-xs text-cyan-200/80">
                Requisito mínimo: Tamer ou Digimon Nv.{' '}
                {pendingPortalConfirm.minLevel}+
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  setPendingPortalConfirm(null);
                }}
                className="min-h-[44px] rounded-xl border border-slate-500/50 bg-slate-800/85 px-4 py-2.5 text-sm font-black text-slate-100 transition hover:bg-slate-700/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetPortal = pendingPortalConfirm;
                  setPendingPortalConfirm(null);
                  travelToMap(targetPortal.targetMapId);
                }}
                className="min-h-[44px] rounded-xl border border-cyan-300/70 bg-gradient-to-b from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_6px_20px_rgba(6,182,212,0.35)] transition hover:from-cyan-400 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed DATS NPC Dialogue Modal (Richard Sampson & Field NPCs) */}
      {activeNpcDialogue && (
        <NpcDialogueModal
          npc={activeNpcDialogue}
          tamerName={selection.tamerName}
          onStartTutorial={() => {
            playDigitalTone('confirm', soundEnabled);
            setBeginnerTutorialGmPreview(false);
            setBeginnerTutorialOpen(true);
          }}
          onClose={() => setActiveNpcDialogue(null)}
        />
      )}

      {/* MudFrigimon Consumables Shop Modal (DATS Center) */}
      <MudfrigimonShopModal
        open={mudfrigimonShopOpen}
        bits={hudAccount.bits}
        inventory={hudAccount.inventory}
        unlockedSlots={getUnlockedInventorySlots(hudAccount)}
        onClose={() => setMudfrigimonShopOpen(false)}
        onBuyConsumable={handleBuyMudfrigimonConsumable}
      />

      {/* Miki Player-to-Player Market Modal (DATS Center) */}
      <PlayerMarketModal
        open={playerMarketOpen}
        currentUid={marketActorUid}
        bits={hudAccount.bits}
        inventory={hudAccount.inventory}
        unlockedSlots={getUnlockedInventorySlots(hudAccount)}
        globalListings={marketGlobalListings}
        sellerListings={marketSellerListings}
        onClose={() => setPlayerMarketOpen(false)}
        onCreateListing={handleCreateMarketListing}
        onBuyListing={handleBuyMarketListing}
        onCancelListing={handleCancelMarketListing}
        onClaimPayout={handleClaimMarketPayout}
      />

      {/* Modal Overlay for Bottom Dock Windows, Incubadora, Shop & Exit Confirmation */}
      <HudWindowsOverlay
        activeWindow={activeHudWindow}
        hudAccount={hudAccount}
        character={character}
        tamerName={selection.tamerName}
        tamerStats={hudAccount.tamer}
        equippedItems={hudAccount.equippedItems}
        inventory={hudAccount.inventory}
        guildName={hudAccount.guildName}
        digimon={activeFormProfile}
        activeStarterId={activeStarterId}
        digimonStats={hudAccount.digimon}
        snapshot={liveSnapshot}
        bits={hudAccount.bits}
        dCoin={hudAccount.dCoin}
        defeatedTotal={hudAccount.defeatedEnemiesTotal}
        notifications={notifications}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
        onEquipItem={handleEquipInventoryItem}
        onUnequipSlot={handleUnequipSlot}
        onUpdateTamerPhoto={handleUpdateTamerPhoto}
        onUpdateTamerCover={handleUpdateTamerCover}
        onBuyShopItem={handleBuyShopItem}
        onEvolveDigimon={handleTriggerEvolution}
        onRequestUnlockEvolution={(formId) => {
          playDigitalTone('click', soundEnabled);
          setEvoluterUnlockFormId(formId);
        }}
        onExecuteDataInject={handleExecuteDataInject}
        onExecuteEggHatch={handleExecuteEggHatch}
        onExecuteEggReinforce={handleExecuteEggReinforce}
        onSwapArchiveSlot={handleSwapArchiveSlot}
        onMoveArchiveToParty={handleMoveArchiveToParty}
        onMovePartyToArchive={handleMovePartyToArchive}
        onReleaseArchiveSlot={handleReleaseArchiveSlot}
        onPlayTone={(tone) => playDigitalTone(tone, soundEnabled)}
        onAdminSetDigimonLevel={handleAdminSetDigimonLevel}
        onAdminAddDigimonExp={handleAdminAddDigimonExp}
        onAdminPullAnyDigimon={handleAdminPullAnyDigimon}
        onAdminAddDigimonToParty={handleAdminAddDigimonToParty}
        onAdminAddDigimonToArchive={handleAdminAddDigimonToArchive}
        onAdminUnlockArchiveSlots={handleAdminUnlockArchiveSlots}
        onAdminSimulateEggDrop={handleAdminSimulateEggDrop}
        onAdminSetHatchGrade={handleAdminSetHatchGrade}
        onAdminGrantItem={handleAdminGrantItem}
        onAdminGrantAllDatas={handleAdminGrantAllDatas}
        onAdminGrantAllEggs={handleAdminGrantAllEggs}
        onAdminGrantCurrency={handleAdminGrantCurrency}
        gmInfiniteDCoin={gmInfiniteDCoin}
        onAdminToggleInfiniteDCoin={handleToggleGmInfiniteDCoin}
        onAdminClearInventory={handleAdminClearInventory}
        onAdminSwitchTamer={onAdminSwitchTamer}
        onOpenSelectionFlow={onOpenSelectionFlow}
        onAdminRestoreVitals={handleAdminRestoreVitals}
        onTravelToMap={travelToMap}
        onAdminOpenTutorial={() => {
          playDigitalTone('confirm', soundEnabled);
          setBeginnerTutorialGmPreview(true);
          setBeginnerTutorialOpen(true);
        }}
        onAdminResetTutorial={() => {
          try {
            window.localStorage.removeItem(tutorialStorageKey);
            window.localStorage.removeItem(tutorialRewardsStorageKey);
          } catch {
            // Ignore storage restrictions
          }
          const resetRewards = { supplies: false, eggPack: false };
          persistTutorialRewardsState(resetRewards);
          commitHudAccount(
            {
              ...hudAccountRef.current,
              tutorialRewardsClaimed: resetRewards,
            },
            true
          );
          tutorialAutoTriggeredRef.current = false;
          playDigitalTone('confirm', soundEnabled);
          pushChatMessage(
            'system',
            '[GM] Status de iniciante e presentes do tutorial resetados! Novos logins no DATS abrirão o Tutorial do Richard Sampson automaticamente.',
            { tone: 'info' }
          );
        }}
        serverExpRatePct={serverExpRatePct}
        onAdminSetServerExpRate={isGM ? handleAdminSetServerExpRate : undefined}
        playerGuild={playerGuild}
        actorUid={actorUid}
        accountKey={selection.accountUsername || actorUid}
        remotePlayers={remotePlayers}
        onStartWhisper={handleStartWhisperFriend}
        onlinePlayerUids={onlinePlayerUids}
        onlineDigimonByUid={onlineDigimonByUid}
        onlineCharacterByUid={onlineCharacterByUid}
        onDeductGuildCreationBits={handleDeductGuildCreationBits}
        onNotifyImportantEvent={pushNotification}
        onBuyDwCoinOffer={handleBuyDwCoinOffer}
        onClearNotifications={() => setNotifications([])}
        autoHuntConfig={autoHuntConfig}
        onUpdateAutoHuntConfig={handleUpdateAutoHuntConfig}
        onUnlockAutoFarmVip={handleUnlockAutoFarmVip}
        onOpenDwCoinShop={() => setActiveHudWindow('shop')}
        isGM={isGM}
        cloudIsGm={isServerGm}
        onConfirmExit={() => {
          persistProgress();
          void markLocalWorldPresenceOffline();
          playDigitalTone('click', soundEnabled);
          setActiveHudWindow(null);
          onExitToLogin();
        }}
        onClose={() => setActiveHudWindow(null)}
      />

      {/* DMO-Style Full-Screen Digimon Hatch Presentation + Evolution Showcase + Optional Rename */}
      {hatchShowcase && (
        <DigimonHatchShowcaseModal
          showcase={hatchShowcase}
          soundEnabled={soundEnabled}
          onConfirmName={handleConfirmHatchNickname}
        />
      )}

      {/* Official Evoluter Evolution Unlock Modal */}
      {evoluterUnlockFormId && (
        <EvoluterUnlockModal
          starterId={activeStarterId}
          targetFormId={evoluterUnlockFormId}
          digimonStats={hudAccount.digimon}
          ownedEvoluters={getOwnedEvoluterCount(hudAccount.inventory)}
          onConfirmUnlock={handleConfirmUnlockEvolution}
          onEvolveNow={handleTriggerEvolution}
          onClose={() => setEvoluterUnlockFormId(null)}
        />
      )}

      {/* Commander Richard Sampson Beginner Tutorial Modal (DATS) */}
      {beginnerTutorialOpen && (
        <RichardSampsonTutorialModal
          tamerName={selection.tamerName}
          digimonName={
            hudAccount.digimon.nickname?.trim() || activeFormProfile.name
          }
          isPreviewFromGm={beginnerTutorialGmPreview}
          suppliesClaimed={tutorialRewardsClaimed.supplies}
          eggPackClaimed={tutorialRewardsClaimed.eggPack}
          onClaimSuppliesReward={handleClaimTutorialSupplies}
          onClaimEggReward={handleClaimTutorialEggPack}
          onComplete={() => {
            if (!beginnerTutorialGmPreview) {
              try {
                window.localStorage.setItem(tutorialStorageKey, '1');
              } catch {
                // Ignore storage restrictions
              }
              pushChatMessage(
                'system',
                `[DATS · Richard Sampson] Guia concluído, ${selection.tamerName}! Choque seu DemiMeramon 3/5 na Incubadora e siga pelo Portal Sul até o D-Terminal para embarcar rumo à Planície Digital!`,
                { tone: 'level' }
              );
            }
            playDigitalTone('confirm', soundEnabled);
            setBeginnerTutorialOpen(false);
          }}
          onClose={() => {
            if (!beginnerTutorialGmPreview) {
              try {
                window.localStorage.setItem(tutorialStorageKey, '1');
              } catch {
                // Ignore storage restrictions
              }
            }
            playDigitalTone('click', soundEnabled);
            setBeginnerTutorialOpen(false);
          }}
        />
      )}
      {/* Mid-session Ban Enforcement Overlay */}
      {activeBanNotice && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          className="pointer-events-auto fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-400/80 bg-[#140712] p-5 text-center shadow-[0_0_40px_rgba(244,63,94,0.45)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/50 bg-rose-500/20 text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-black uppercase tracking-wider text-rose-200">
              Conexão Encerrada pela Administração
            </h2>
            <p className="mt-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-rose-100">
              {activeBanNotice}
            </p>
            <button
              type="button"
              onClick={onExitToLogin}
              className="mt-4 w-full rounded-xl border border-rose-300/60 bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-500 active:scale-95"
            >
              Voltar para a Tela de Login
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
