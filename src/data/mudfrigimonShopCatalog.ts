import type { ItemRarity } from '../types/hud';

export type MudfrigimonShopCategory = 'hp-food' | 'ds-vitamin';

export interface MudfrigimonConsumableItem {
  itemKey: string;
  name: string;
  shopCategory: MudfrigimonShopCategory;
  iconUrl: string;
  hpRestore?: number;
  dsRestore?: number;
  priceBits: number;
  rarity: ItemRarity;
  description: string;
  usageInfo: string;
}

/**
 * 9 Comidas de HP oficiais da Loja de Consumíveis da NPC MudFrigimon (DATS Center).
 * Valores de recuperação e preços exatos conforme tabela oficial.
 */
export const MUDFRIGIMON_HP_FOODS: readonly MudfrigimonConsumableItem[] = [
  {
    itemKey: 'food_stick_bread',
    name: 'Stick Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/stick_bread.png',
    hpRestore: 235,
    priceBits: 25,
    rarity: 'comum',
    description: 'Pão crocante que recupera +235 de HP do Digimon ativo.',
    usageInfo: 'Use no Inventário para restaurar 235 de HP instantaneamente.',
  },
  {
    itemKey: 'food_red_bean_bread',
    name: 'Red Bean Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/red_bean_bread.png',
    hpRestore: 330,
    priceBits: 30,
    rarity: 'comum',
    description: 'Pão recheado com feijão doce que recupera +330 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 330 de HP instantaneamente.',
  },
  {
    itemKey: 'food_cream_bread',
    name: 'Cream Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/cream_bread.png',
    hpRestore: 420,
    priceBits: 60,
    rarity: 'comum',
    description: 'Pão macio recheado com creme que recupera +420 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 420 de HP instantaneamente.',
  },
  {
    itemKey: 'food_butter_bread',
    name: 'Butter Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/butter_bread.png',
    hpRestore: 550,
    priceBits: 105,
    rarity: 'incomum',
    description: 'Pão amanteigado dourado que recupera +550 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 550 de HP instantaneamente.',
  },
  {
    itemKey: 'food_milk_bread',
    name: 'Milk Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/milk_bread.png',
    hpRestore: 750,
    priceBits: 150,
    rarity: 'incomum',
    description: 'Pão de leite nutritivo que recupera +750 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 750 de HP instantaneamente.',
  },
  {
    itemKey: 'food_toasted_bread',
    name: 'Toasted Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/toasted_bread.png',
    hpRestore: 900,
    priceBits: 240,
    rarity: 'incomum',
    description: 'Fatia de pão tostado que recupera +900 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 900 de HP instantaneamente.',
  },
  {
    itemKey: 'food_corn_bread',
    name: 'Corn Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/corn_bread.png',
    hpRestore: 1200,
    priceBits: 330,
    rarity: 'raro',
    description: 'Pão especial de milho que recupera +1.200 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 1.200 de HP instantaneamente.',
  },
  {
    itemKey: 'food_multi_grain_bread',
    name: 'Multi Grain Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/multi_grain_bread.png',
    hpRestore: 1350,
    priceBits: 450,
    rarity: 'raro',
    description: 'Pão multigrãos reforçado que recupera +1.350 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 1.350 de HP instantaneamente.',
  },
  {
    itemKey: 'food_premium_bread',
    name: 'Premium Bread',
    shopCategory: 'hp-food',
    iconUrl: '/assets/items/consumables/premium_bread.png',
    hpRestore: 1600,
    priceBits: 600,
    rarity: 'epico',
    description: 'Pão premium de alta qualidade que recupera +1.600 de HP do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 1.600 de HP instantaneamente.',
  },
] as const;

/**
 * 8 Vitaminas de DS oficiais da Loja de Consumíveis da NPC MudFrigimon (DATS Center).
 * Valores de recuperação e preços exatos conforme tabela oficial.
 */
export const MUDFRIGIMON_DS_VITAMINS: readonly MudfrigimonConsumableItem[] = [
  {
    itemKey: 'vitamin_small_a',
    name: 'Small Vitamin A',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/small_vitamin_a.png',
    dsRestore: 85,
    priceBits: 45,
    rarity: 'comum',
    description: 'Frasco de vitamina A pequeno que recupera +85 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 85 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_small_b',
    name: 'Small Vitamin B',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/small_vitamin_b.png',
    dsRestore: 120,
    priceBits: 83,
    rarity: 'comum',
    description: 'Frasco de vitamina B pequeno que recupera +120 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 120 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_small_c',
    name: 'Small Vitamin C',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/small_vitamin_c.png',
    dsRestore: 150,
    priceBits: 164,
    rarity: 'comum',
    description: 'Frasco de vitamina C pequeno que recupera +150 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 150 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_medium_a',
    name: 'Medium Vitamin A',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/medium_vitamin_a.png',
    dsRestore: 250,
    priceBits: 315,
    rarity: 'incomum',
    description: 'Frasco de vitamina A médio que recupera +250 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 250 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_medium_b',
    name: 'Medium Vitamin B',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/medium_vitamin_b.png',
    dsRestore: 375,
    priceBits: 475,
    rarity: 'incomum',
    description: 'Frasco de vitamina B médio que recupera +375 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 375 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_medium_c',
    name: 'Medium Vitamin C',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/medium_vitamin_c.png',
    dsRestore: 450,
    priceBits: 663,
    rarity: 'raro',
    description: 'Frasco de vitamina C médio que recupera +450 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 450 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_high_a',
    name: 'High Vitamin A',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/high_vitamin_a.png',
    dsRestore: 675,
    priceBits: 710,
    rarity: 'raro',
    description: 'Frasco concentrado de vitamina A que recupera +675 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 675 de DS instantaneamente.',
  },
  {
    itemKey: 'vitamin_high_b',
    name: 'High Vitamin B',
    shopCategory: 'ds-vitamin',
    iconUrl: '/assets/items/consumables/high_vitamin_b.png',
    dsRestore: 800,
    priceBits: 1104,
    rarity: 'epico',
    description: 'Frasco concentrado de vitamina B que recupera +800 de DS do Digimon.',
    usageInfo: 'Use no Inventário para restaurar 800 de DS instantaneamente.',
  },
] as const;

export const MUDFRIGIMON_CONSUMABLES: readonly MudfrigimonConsumableItem[] = [
  ...MUDFRIGIMON_HP_FOODS,
  ...MUDFRIGIMON_DS_VITAMINS,
] as const;

const MUDFRIGIMON_CONSUMABLE_MAP = new Map<string, MudfrigimonConsumableItem>(
  MUDFRIGIMON_CONSUMABLES.map((item) => [item.itemKey, item])
);

export function getMudfrigimonConsumableByKey(
  itemKey: string
): MudfrigimonConsumableItem | undefined {
  return MUDFRIGIMON_CONSUMABLE_MAP.get(itemKey);
}
