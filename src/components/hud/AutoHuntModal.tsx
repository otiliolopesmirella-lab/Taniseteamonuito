import { useState } from 'react';
import {
  Check,
  Clock,
  Coins,
  Crosshair,
  Crown,
  Heart,
  Lock,
  Pause,
  Play,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import {
  AUTO_FARM_VIP_COST_DWCOIN,
  AUTO_FARM_VIP_DURATION_DAYS,
  AUTO_FARM_VIP_XP_BONUS_PCT,
  AUTO_HUNT_MAP_GROUPS,
  AUTO_HUNT_THRESHOLD_PRESETS,
  clampThresholdPct,
  countRecoveryItems,
  formatAutoFarmVipExpiryDate,
  formatAutoFarmVipRemaining,
  type AutoHuntConfig,
} from '../../services/autoHuntService';
import type { WildMonsterSpecies } from '../../maps/huntingFieldMap';
import type { InventoryItem } from '../../types/hud';

const AUTO_ICON_SRC =
  '/assets/aistudio/file_00000000f148820e85b0f0989e0b8608_ae46689e.png';

interface AutoHuntModalProps {
  config: AutoHuntConfig;
  currentMapId: PlayableMapId;
  digimonName: string;
  digimonHp: number;
  digimonMaxHp: number;
  digimonDs: number;
  digimonMaxDs: number;
  inventory: readonly InventoryItem[];
  autoFarmVipUnlocked: boolean;
  autoFarmVipUntilMs?: number | null;
  isGM?: boolean;
  dCoinBalance: number;
  onUnlockAutoFarmVip?: () => { ok: boolean; message: string };
  onOpenDwCoinShop?: () => void;
  onUpdateConfig: (next: AutoHuntConfig) => void;
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

export function AutoHuntModal({
  config,
  currentMapId,
  digimonName,
  digimonHp,
  digimonMaxHp,
  digimonDs,
  digimonMaxDs,
  inventory,
  autoFarmVipUnlocked,
  autoFarmVipUntilMs = null,
  isGM = false,
  dCoinBalance,
  onUnlockAutoFarmVip,
  onOpenDwCoinShop,
  onUpdateConfig,
  onPlayTone,
  onClose,
}: AutoHuntModalProps) {
  const initialTab =
    AUTO_HUNT_MAP_GROUPS.find((g) => g.mapId === currentMapId)?.mapId ??
    AUTO_HUNT_MAP_GROUPS[0].mapId;

  const [selectedMapTab, setSelectedMapTab] =
    useState<(typeof AUTO_HUNT_MAP_GROUPS)[number]['mapId']>(initialTab);
  const [vipFeedback, setVipFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeGroup =
    AUTO_HUNT_MAP_GROUPS.find((g) => g.mapId === selectedMapTab) ??
    AUTO_HUNT_MAP_GROUPS[0];

  const hpItemsCount = countRecoveryItems(inventory, 'hp');
  const dsItemsCount = countRecoveryItems(inventory, 'ds');
  const liveHpPct =
    digimonMaxHp > 0 ? Math.max(0, Math.min(100, Math.round((digimonHp / digimonMaxHp) * 100))) : 100;
  const liveDsPct =
    digimonMaxDs > 0 ? Math.max(0, Math.min(100, Math.round((digimonDs / digimonMaxDs) * 100))) : 100;

  const toggleSpecies = (species: WildMonsterSpecies) => {
    onPlayTone('click');
    const exists = config.targetSpecies.includes(species);
    const nextTargets = exists
      ? config.targetSpecies.filter((s) => s !== species)
      : [...config.targetSpecies, species];
    onUpdateConfig({ ...config, targetSpecies: nextTargets });
  };

  const selectAllInCurrentMap = () => {
    onPlayTone('confirm');
    const merged = new Set<WildMonsterSpecies>(config.targetSpecies);
    for (const mob of activeGroup.mobs) {
      merged.add(mob.species);
    }
    onUpdateConfig({ ...config, targetSpecies: Array.from(merged) });
  };

  const clearTargets = () => {
    onPlayTone('click');
    onUpdateConfig({ ...config, targetSpecies: [] });
  };

  const handleUnlockVip = () => {
    if (!onUnlockAutoFarmVip) return;
    const res = onUnlockAutoFarmVip();
    onPlayTone(res.ok ? 'confirm' : 'error');
    setVipFeedback({
      tone: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleToggleMaster = () => {
    if (!autoFarmVipUnlocked) {
      handleUnlockVip();
      return;
    }
    const nextEnabled = !config.enabled;
    onPlayTone(nextEnabled ? 'confirm' : 'click');
    onUpdateConfig({ ...config, enabled: nextEnabled });
  };

  const hasEnoughDwCoin = dCoinBalance >= AUTO_FARM_VIP_COST_DWCOIN;
  const isVipBonusActive = autoFarmVipUnlocked && config.enabled;
  const vipRemainingLabel = formatAutoFarmVipRemaining(autoFarmVipUntilMs);
  const vipExpiryDateLabel = formatAutoFarmVipExpiryDate(autoFarmVipUntilMs);
  const hasPreviousExpiredVip =
    !autoFarmVipUnlocked &&
    typeof autoFarmVipUntilMs === 'number' &&
    autoFarmVipUntilMs > 0;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configuração de Auto-Ataque e Cura"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/82 p-2.5 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window flex max-h-[86dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_40px_rgba(0,174,255,0.52)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cyan-400/35 bg-[#07266b] px-3.5 py-2.5 sm:px-4">
          <div className="flex items-center gap-2.5">
            <img
              src={AUTO_ICON_SRC}
              alt="Auto"
              draggable={false}
              className="h-9 w-9 shrink-0 rounded-xl border border-cyan-300/65 bg-[#04143a] object-cover shadow-[0_0_12px_rgba(56,214,255,0.45)]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white">
                  VIP AUTO FARM &amp; SUPORTE
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/75 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-200">
                  <Crown className="h-2.5 w-2.5" />
                  +{AUTO_FARM_VIP_XP_BONUS_PCT}% EXP
                </span>
              </div>
              <p className="text-[10.5px] font-bold text-cyan-200/85">
                {isVipBonusActive ? (
                  <span className="text-emerald-300">
                    ATIVO (+{AUTO_FARM_VIP_XP_BONUS_PCT}% EXP)
                    {!isGM && vipRemainingLabel ? ` · ${vipRemainingLabel} restantes` : ''} · {config.targetSpecies.length} alvo(s)
                  </span>
                ) : autoFarmVipUnlocked ? (
                  <span>
                    PAUSADO ·{' '}
                    {isGM
                      ? 'Acesso GM'
                      : vipRemainingLabel
                        ? `${vipRemainingLabel} restantes`
                        : `${AUTO_FARM_VIP_DURATION_DAYS} dias ativos`}
                  </span>
                ) : (
                  <span className="text-amber-200">
                    {hasPreviousExpiredVip ? 'EXPIRADO' : 'BLOQUEADO'} · {AUTO_FARM_VIP_COST_DWCOIN} DL Din ({AUTO_FARM_VIP_DURATION_DAYS} dias)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Auto-Ataque"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/50 bg-[#04163e] text-cyan-100 transition hover:bg-sky-700 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-3.5 text-xs text-sky-100 sm:p-4">
          {/* Master Auto Control / VIP Unlock Gate */}
          {!autoFarmVipUnlocked ? (
            <div className="space-y-2.5 rounded-xl border-2 border-amber-300/75 bg-gradient-to-br from-[#2a1a05]/95 via-[#18163a]/95 to-[#06183b]/95 p-3.5 shadow-[0_0_24px_rgba(251,191,36,0.22)]">
              <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Crown className="h-4 w-4 shrink-0 text-amber-300" />
                    <span className="text-xs font-black tracking-wide text-amber-200">
                      VIP AUTO FARM · {AUTO_FARM_VIP_DURATION_DAYS} DIAS ({AUTO_FARM_VIP_COST_DWCOIN} DL Din)
                    </span>
                  </div>
                  {hasPreviousExpiredVip && (
                    <p className="text-[11px] font-extrabold text-rose-300">
                      Seu plano de {AUTO_FARM_VIP_DURATION_DAYS} dias expirou. Renove por {AUTO_FARM_VIP_COST_DWCOIN} DL Din para liberar mais {AUTO_FARM_VIP_DURATION_DAYS} dias!
                    </p>
                  )}
                  <p className="text-[11.5px] leading-snug text-slate-200">
                    Ative o Auto Farm por{' '}
                    <strong className="text-amber-200">
                      {AUTO_FARM_VIP_COST_DWCOIN} DL Din (R$ {AUTO_FARM_VIP_COST_DWCOIN})
                    </strong>{' '}
                    com duração de{' '}
                    <strong className="text-white">{AUTO_FARM_VIP_DURATION_DAYS} dias</strong> e ganhe{' '}
                    <strong className="text-emerald-300">
                      +{AUTO_FARM_VIP_XP_BONUS_PCT}% de EXP extra
                    </strong>{' '}
                    sempre que o Auto Farm estiver <strong>ATIVADO</strong>!
                  </p>
                  <p className="text-[10.5px] font-bold text-cyan-200/85">
                    Após os {AUTO_FARM_VIP_DURATION_DAYS} dias, basta comprar novamente para continuar usando.
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/60 bg-amber-500/20 text-amber-200">
                  <Lock className="h-4 w-4" />
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/30 bg-[#04102a]/85 px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black">
                  <Coins className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-slate-300">Seu saldo:</span>
                  <span className={hasEnoughDwCoin ? 'text-emerald-300' : 'text-rose-300'}>
                    {dCoinBalance.toLocaleString('pt-BR')} DL Din
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!hasEnoughDwCoin && onOpenDwCoinShop && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        onOpenDwCoinShop();
                      }}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-cyan-300/75 bg-gradient-to-b from-sky-500 to-blue-700 px-3 text-[11px] font-black text-white shadow-[0_0_12px_rgba(56,189,248,0.35)] transition hover:brightness-110 active:scale-95"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>COMPRAR DL DIN</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleUnlockVip}
                    className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 text-[11px] font-black tracking-wide transition active:scale-95 ${
                      hasEnoughDwCoin
                        ? 'border-amber-200 bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.45)] hover:brightness-110'
                        : 'border-amber-400/45 bg-amber-950/60 text-amber-200/80 hover:bg-amber-900/60'
                    }`}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>
                      {hasPreviousExpiredVip ? 'RENOVAR' : 'ATIVAR'} {AUTO_FARM_VIP_DURATION_DAYS}D ({AUTO_FARM_VIP_COST_DWCOIN} DL Din)
                    </span>
                  </button>
                </div>
              </div>

              {vipFeedback && (
                <p
                  className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold ${
                    vipFeedback.tone === 'success'
                      ? 'border-emerald-300/60 bg-emerald-950/70 text-emerald-200'
                      : 'border-rose-400/60 bg-rose-950/70 text-rose-200'
                  }`}
                >
                  {vipFeedback.text}
                </p>
              )}
            </div>
          ) : (
            <div
              className={`flex flex-col gap-2.5 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
                config.enabled
                  ? 'border-emerald-300/75 bg-gradient-to-r from-[#06382d]/90 to-[#041d38]/90 shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                  : 'border-cyan-400/35 bg-[#041335]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Crosshair
                    className={`h-4 w-4 ${
                      config.enabled ? 'text-emerald-300' : 'text-cyan-300'
                    }`}
                  />
                  <span className="text-xs font-black tracking-wide text-white">
                    {config.enabled ? 'VIP Auto Farm Ativado' : 'VIP Auto Farm Desligado'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-black ${
                      config.enabled
                        ? 'border-amber-300/80 bg-amber-400/20 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                        : 'border-slate-500/60 bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <Crown className="h-2.5 w-2.5" />
                    {config.enabled
                      ? `+${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP ATIVO`
                      : `+${AUTO_FARM_VIP_XP_BONUS_PCT}% EXP PAUSADO`}
                  </span>
                </div>

                {/* Live 30-Day Subscription Remaining Time */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-cyan-200">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  {isGM ? (
                    <span className="text-amber-200">Acesso GM Ilimitado</span>
                  ) : vipRemainingLabel ? (
                    <span>
                      Restam <strong className="text-amber-200 tabular-nums">{vipRemainingLabel}</strong>
                      {vipExpiryDateLabel ? ` (válido até ${vipExpiryDateLabel})` : ''}
                    </span>
                  ) : (
                    <span>Plano de {AUTO_FARM_VIP_DURATION_DAYS} dias ativo</span>
                  )}
                </div>

                <p className="text-[10.5px] leading-snug text-slate-300">
                  {currentMapId === 'dats-center' || currentMapId === 'd-terminal'
                    ? 'Você está em uma zona segura. Ao entrar em um mapa de caça, o Auto Farm e o bônus de +50% EXP começarão automaticamente.'
                    : config.targetSpecies.length === 0
                      ? 'Selecione ao menos 1 Digimon abaixo para seu parceiro caçar automaticamente no mapa.'
                      : config.enabled
                        ? `Seu parceiro está caçando automaticamente com +${AUTO_FARM_VIP_XP_BONUS_PCT}% de EXP ativo!`
                        : `Ative o Auto Farm para caçar automaticamente e receber +${AUTO_FARM_VIP_XP_BONUS_PCT}% de EXP.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleMaster}
                className={`flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black tracking-wide transition active:scale-95 ${
                  config.enabled
                    ? 'border-rose-300/80 bg-gradient-to-b from-rose-600 to-rose-800 text-white shadow-[0_0_14px_rgba(244,63,94,0.4)] hover:brightness-110'
                    : 'border-emerald-300/85 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-[0_0_16px_rgba(16,185,129,0.45)] hover:brightness-110'
                }`}
              >
                {config.enabled ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>PAUSAR AUTO</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>ATIVAR AUTO</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 1. Target Digimons Selector */}
          <section className="rounded-xl border border-cyan-400/30 bg-[#041232] p-3">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-200">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Digimons Alvo ({config.targetSpecies.length} selecionados)</span>
                </h3>
                <p className="text-[10.5px] text-slate-300">
                  Toque nos Digimons dos mapas que você deseja atacar no Auto.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllInCurrentMap}
                  className="min-h-[32px] rounded-lg border border-cyan-300/50 bg-[#08296a] px-2.5 text-[10px] font-extrabold text-cyan-100 hover:bg-[#0c378a]"
                >
                  Marcar Mapa
                </button>
                {config.targetSpecies.length > 0 && (
                  <button
                    type="button"
                    onClick={clearTargets}
                    className="flex min-h-[32px] items-center gap-1 rounded-lg border border-rose-400/45 bg-rose-950/60 px-2.5 text-[10px] font-extrabold text-rose-200 hover:bg-rose-900/75"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Map Filter Tabs */}
            <div className="mb-2.5 grid grid-cols-3 gap-1.5">
              {AUTO_HUNT_MAP_GROUPS.map((group) => {
                const isSelectedTab = group.mapId === activeGroup.mapId;
                const countInMap = group.mobs.filter((m) =>
                  config.targetSpecies.includes(m.species)
                ).length;
                return (
                  <button
                    key={group.mapId}
                    type="button"
                    onClick={() => {
                      onPlayTone('click');
                      setSelectedMapTab(group.mapId);
                    }}
                    className={`flex min-h-[40px] flex-col items-center justify-center rounded-xl border px-1.5 py-1 text-center transition ${
                      isSelectedTab
                        ? 'border-amber-300/85 bg-[#0c3582] text-white shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                        : 'border-cyan-400/25 bg-[#061b48] text-cyan-200/80 hover:border-cyan-300/55'
                    }`}
                  >
                    <span className="truncate text-[10.5px] font-black leading-tight">
                      {group.mapName}
                    </span>
                    <span className="text-[9px] font-bold text-cyan-200/75">
                      {group.levelRangeLabel}
                      {countInMap > 0 ? ` · ${countInMap} ✓` : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Wild Digimon Species Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeGroup.mobs.map((mob) => {
                const selected = config.targetSpecies.includes(mob.species);
                return (
                  <button
                    key={mob.species}
                    type="button"
                    onClick={() => toggleSpecies(mob.species)}
                    aria-pressed={selected}
                    className={`group relative flex items-center gap-2 rounded-xl border p-2 text-left transition active:scale-[0.98] ${
                      selected
                        ? mob.isBoss
                          ? 'border-amber-300 bg-gradient-to-br from-amber-500/25 to-orange-900/40 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                          : 'border-emerald-300/90 bg-gradient-to-br from-emerald-500/20 to-[#08305a] shadow-[0_0_12px_rgba(52,211,153,0.28)]'
                        : 'border-cyan-400/25 bg-[#071c4a]/80 hover:border-cyan-300/60 hover:bg-[#0a2763]'
                    }`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-cyan-300/40 bg-[#030e27]">
                      <img
                        src={mob.portraitUrl}
                        alt={mob.displayName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-black text-white">
                        {mob.displayName}
                      </p>
                      <p
                        className={`text-[9.5px] font-bold ${
                          mob.isBoss ? 'text-amber-300' : 'text-cyan-200/80'
                        }`}
                      >
                        {mob.levelLabel}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        selected
                          ? 'border-emerald-200 bg-emerald-500 text-white'
                          : 'border-cyan-400/35 bg-[#041232] text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Auto HP Threshold Slider Bar */}
          <section className="rounded-xl border border-emerald-400/35 bg-[#041432] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-300/60 bg-emerald-500/20 text-emerald-300">
                  <Heart className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black text-white">Auto HP (Comida)</p>
                  <p className="text-[10px] font-bold text-emerald-200/80 tabular-nums">
                    HP atual: {liveHpPct}% · Estoque: {hpItemsCount} un.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  onUpdateConfig({
                    ...config,
                    autoHpEnabled: !config.autoHpEnabled,
                  });
                }}
                className={`min-h-[34px] min-w-[82px] rounded-lg border px-2.5 text-[10.5px] font-black transition ${
                  config.autoHpEnabled
                    ? 'border-emerald-300 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-600 bg-slate-800 text-slate-300'
                }`}
              >
                {config.autoHpEnabled ? 'ATIVADO' : 'DESLIGADO'}
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-emerald-400/20 bg-[#030d24] p-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-200">
                  Usar comida quando HP chegar em:
                </span>
                <span className="rounded-md border border-emerald-300/60 bg-emerald-500/20 px-2 py-0.5 font-black tabular-nums text-emerald-200">
                  {config.hpThresholdPct}% HP
                </span>
              </div>

              {/* Styled Visual HP Bar + Interactive Range Slider */}
              <div className="relative flex h-8 items-center">
                <div className="pointer-events-none relative h-4 w-full overflow-hidden rounded-full border border-emerald-400/40 bg-[#06152f]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-[width] duration-100"
                    style={{ width: `${config.hpThresholdPct}%` }}
                  />
                  <span
                    className="absolute inset-y-0 w-0.5 bg-white/80"
                    style={{ left: `${config.hpThresholdPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={config.hpThresholdPct}
                  aria-label="Porcentagem de HP para cura automática"
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      hpThresholdPct: clampThresholdPct(e.target.value, 70),
                    })
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {AUTO_HUNT_THRESHOLD_PRESETS.map((pct) => {
                  const active = config.hpThresholdPct === pct;
                  return (
                    <button
                      key={`hp-${pct}`}
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        onUpdateConfig({ ...config, hpThresholdPct: pct });
                      }}
                      className={`min-h-[30px] flex-1 rounded-lg border text-[10px] font-black tabular-nums transition ${
                        active
                          ? 'border-emerald-300 bg-emerald-500/30 text-white shadow-[0_0_8px_rgba(52,211,153,0.35)]'
                          : 'border-cyan-400/25 bg-[#071c48] text-slate-300 hover:border-emerald-300/60'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Auto DS Threshold Slider Bar */}
          <section className="rounded-xl border border-cyan-400/35 bg-[#041432] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/60 bg-cyan-500/20 text-cyan-300">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black text-white">Auto DS (Vitamina)</p>
                  <p className="text-[10px] font-bold text-cyan-200/80 tabular-nums">
                    DS atual: {liveDsPct}% · Estoque: {dsItemsCount} un.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  onUpdateConfig({
                    ...config,
                    autoDsEnabled: !config.autoDsEnabled,
                  });
                }}
                className={`min-h-[34px] min-w-[82px] rounded-lg border px-2.5 text-[10.5px] font-black transition ${
                  config.autoDsEnabled
                    ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100'
                    : 'border-slate-600 bg-slate-800 text-slate-300'
                }`}
              >
                {config.autoDsEnabled ? 'ATIVADO' : 'DESLIGADO'}
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-cyan-400/20 bg-[#030d24] p-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-200">
                  Usar vitamina quando DS chegar em:
                </span>
                <span className="rounded-md border border-cyan-300/60 bg-cyan-500/20 px-2 py-0.5 font-black tabular-nums text-cyan-200">
                  {config.dsThresholdPct}% DS
                </span>
              </div>

              {/* Styled Visual DS Bar + Interactive Range Slider */}
              <div className="relative flex h-8 items-center">
                <div className="pointer-events-none relative h-4 w-full overflow-hidden rounded-full border border-cyan-400/40 bg-[#06152f]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-300 transition-[width] duration-100"
                    style={{ width: `${config.dsThresholdPct}%` }}
                  />
                  <span
                    className="absolute inset-y-0 w-0.5 bg-white/80"
                    style={{ left: `${config.dsThresholdPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={config.dsThresholdPct}
                  aria-label="Porcentagem de DS para recarga automática"
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      dsThresholdPct: clampThresholdPct(e.target.value, 35),
                    })
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {AUTO_HUNT_THRESHOLD_PRESETS.map((pct) => {
                  const active = config.dsThresholdPct === pct;
                  return (
                    <button
                      key={`ds-${pct}`}
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        onUpdateConfig({ ...config, dsThresholdPct: pct });
                      }}
                      className={`min-h-[30px] flex-1 rounded-lg border text-[10px] font-black tabular-nums transition ${
                        active
                          ? 'border-cyan-300 bg-cyan-500/30 text-white shadow-[0_0_8px_rgba(56,214,255,0.35)]'
                          : 'border-cyan-400/25 bg-[#071c48] text-slate-300 hover:border-cyan-300/60'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
