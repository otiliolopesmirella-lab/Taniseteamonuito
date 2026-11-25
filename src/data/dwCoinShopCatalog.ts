import {
  EVOLUTER_ICON_URL,
  EVOLUTER_ITEM_KEY,
  HATCH_BACKUP_ICON_URL,
  HATCH_BACKUP_ITEM_KEY,
  XP_BOOST_1H_ICON_URL,
  XP_BOOST_1H_ITEM_KEY,
  XP_BOOST_2H_ICON_URL,
  XP_BOOST_2H_ITEM_KEY,
  XP_BOOST_3H_ICON_URL,
  XP_BOOST_3H_ITEM_KEY,
  XP_BOOST_4H_ICON_URL,
  XP_BOOST_4H_ITEM_KEY,
} from './itemsCatalog';

export type DwCoinShopCategory =
  | 'promocoes'
  | 'boosts'
  | 'incubacao'
  | 'evolucao'
  | 'expansao'
  | 'digieggs'
  | 'kits';

export interface DwCoinShopOffer {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: DwCoinShopCategory;
  priceDwCoin: number;
  iconUrl?: string;
  bannerImageUrl?: string;
  highlight?: string;
  reward:
    | { kind: 'item'; itemKey: string; quantity: number; eggHatchLevel?: number }
    | {
        kind: 'bundle';
        items: ReadonlyArray<{
          itemKey: string;
          quantity: number;
          eggHatchLevel?: number;
        }>;
      }
    | { kind: 'expand_inventory'; slots: number }
    | { kind: 'expand_archive'; slots: number };
}

export interface DwCoinRechargePack {
  id: string;
  dwCoinAmount: number;
  priceCents: number;
  priceBrlLabel: string;
  originalPriceBrlLabel?: string;
  discountLabel?: string;
  /** Exact percentage hotspot on the 1024x1536 (2:3) DWcoin shop artwork */
  hotspot: {
    leftPct: number;
    topPct: number;
    widthPct: number;
    heightPct: number;
  };
}

export const DWCOIN_PURCHASE_TERMS_VERSION = 'v1.0' as const;

export const DWCOIN_PURCHASE_TERMS_ITEMS: readonly string[] = [
  'DL Din é a moeda da loja do jogo. Ela não pode ser sacada, convertida em dinheiro real ou vendida por dinheiro real.',
  'Após a compra, os DL Din ficam disponíveis na conta do jogador de acordo com o processamento do pagamento.',
  'O jogador pode solicitar cancelamento dentro do prazo aplicável, desde que os DL Din comprados ainda não tenham sido utilizados, observadas as regras e a legislação aplicável.',
  'Itens adquiridos com DL Din, como Eggs, VIP, Passes, boosts, pacotes, roletas e outros conteúdos, podem ser entregues imediatamente e, quando já utilizados ou consumidos, podem não ser elegíveis para reembolso, conforme os Termos de Uso e a legislação aplicável.',
  'Não faça contestação indevida do pagamento, como chargeback, disputa ou MED no Pix. Em caso de problema com uma compra, o jogador deve entrar em contato com o suporte do jogo antes de contestar o pagamento.',
];

export const DWCOIN_SHOP_ARTWORK_URL =
  '/assets/aistudio/file_000000006d04820e87eafab8bd82356c_06707c7f.webp';

export const VEEMON_PROMO_BANNER_URL =
  '/assets/aistudio/file_00000000b300820e8f5f746961f4f58d_9332b011.webp';

export const DWCOIN_PROMO_OFFER: DwCoinShopOffer = {
  id: 'promo_comece_na_frente_veemon_5_5',
  name: 'Pack Comece na Frente · Veemon 5/5 + 12 Evoluters',
  subtitle: 'Egg do Veemon 5/5 (Nv. 1 · Sem DATA!) + 12 Evoluters',
  description:
    'Receba 1 DigiEgg do Veemon 5/5 (não precisa de DATA — basta colocar na Incubadora DATS e chocar seu Veemon Nv. 1 para jogar na hora!) + 12 Evoluters no seu Inventário.',
  category: 'promocoes',
  priceDwCoin: 25,
  iconUrl: '/assets/items/digieggs/egg_veemon.png',
  bannerImageUrl: VEEMON_PROMO_BANNER_URL,
  highlight: 'PROMOÇÃO',
  reward: {
    kind: 'bundle',
    items: [
      { itemKey: 'digiegg_veemon', quantity: 1, eggHatchLevel: 5 },
      { itemKey: 'evoluter', quantity: 12 },
    ],
  },
};

export const HATCH_BACKUP_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_hatch_backup_1',
  name: 'Hatch Backup',
  subtitle: 'Proteção Anti-Quebra · Incubadora',
  description:
    'Protege o seu DigiEgg ao ser chocado na Incubadora DATS para não quebrar caso a inserção de DATA falhe.',
  category: 'incubacao',
  priceDwCoin: 5,
  iconUrl: HATCH_BACKUP_ICON_URL,
  highlight: 'PROTEÇÃO',
  reward: {
    kind: 'item',
    itemKey: HATCH_BACKUP_ITEM_KEY,
    quantity: 1,
  },
};

export const EVOLUTER_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_evoluter_1',
  name: 'Evoluter',
  subtitle: 'Desbloqueio de Evolução · Ultimate / Mega',
  description:
    'Núcleo energético necessário para desbloquear evoluções Ultimate e Mega dos seus Digimons Mercenários.',
  category: 'evolucao',
  priceDwCoin: 2,
  iconUrl: EVOLUTER_ICON_URL,
  highlight: 'EVOLUÇÃO',
  reward: {
    kind: 'item',
    itemKey: EVOLUTER_ITEM_KEY,
    quantity: 1,
  },
};

export const XP_BOOST_1H_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_xp_boost_1h',
  name: '⚡ 1H XP BOOST',
  subtitle: '+100% de EXP · Duração: 1 Hora',
  description:
    'Ative no Inventário para receber +100% de EXP (2x) para Tamer e Digimon durante 1 hora.',
  category: 'boosts',
  priceDwCoin: 4,
  iconUrl: XP_BOOST_1H_ICON_URL,
  highlight: '+100% XP',
  reward: {
    kind: 'item',
    itemKey: XP_BOOST_1H_ITEM_KEY,
    quantity: 1,
  },
};

export const XP_BOOST_2H_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_xp_boost_2h',
  name: '⚡ 2H XP BOOST',
  subtitle: '+100% de EXP · Duração: 2 Horas',
  description:
    'Ative no Inventário para receber +100% de EXP (2x) para Tamer e Digimon durante 2 horas.',
  category: 'boosts',
  priceDwCoin: 6,
  iconUrl: XP_BOOST_2H_ICON_URL,
  highlight: '+100% XP',
  reward: {
    kind: 'item',
    itemKey: XP_BOOST_2H_ITEM_KEY,
    quantity: 1,
  },
};

export const XP_BOOST_3H_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_xp_boost_3h',
  name: '⚡ 3H XP BOOST',
  subtitle: '+100% de EXP · Duração: 3 Horas',
  description:
    'Ative no Inventário para receber +100% de EXP (2x) para Tamer e Digimon durante 3 horas.',
  category: 'boosts',
  priceDwCoin: 8,
  iconUrl: XP_BOOST_3H_ICON_URL,
  highlight: '+100% XP',
  reward: {
    kind: 'item',
    itemKey: XP_BOOST_3H_ITEM_KEY,
    quantity: 1,
  },
};

export const XP_BOOST_4H_SHOP_OFFER: DwCoinShopOffer = {
  id: 'item_xp_boost_4h',
  name: '👑 4H XP BOOST',
  subtitle: '+100% de EXP · Duração: 4 Horas',
  description:
    'Ative no Inventário para receber +100% de EXP (2x) para Tamer e Digimon durante 4 horas.',
  category: 'boosts',
  priceDwCoin: 10,
  iconUrl: XP_BOOST_4H_ICON_URL,
  highlight: '+100% XP',
  reward: {
    kind: 'item',
    itemKey: XP_BOOST_4H_ITEM_KEY,
    quantity: 1,
  },
};

export const DWCOIN_SHOP_OFFERS: readonly DwCoinShopOffer[] = [
  XP_BOOST_1H_SHOP_OFFER,
  XP_BOOST_2H_SHOP_OFFER,
  XP_BOOST_3H_SHOP_OFFER,
  XP_BOOST_4H_SHOP_OFFER,
  EVOLUTER_SHOP_OFFER,
  HATCH_BACKUP_SHOP_OFFER,
  DWCOIN_PROMO_OFFER,
];

export const DWCOIN_RECHARGE_PACKS: readonly DwCoinRechargePack[] = [
  {
    id: 'pack_10',
    dwCoinAmount: 10,
    priceCents: 1000,
    priceBrlLabel: 'R$ 10,00',
    hotspot: {
      leftPct: 1.6,
      topPct: 23.8,
      widthPct: 47.6,
      heightPct: 20.8,
    },
  },
  {
    id: 'pack_30',
    dwCoinAmount: 30,
    priceCents: 2850,
    originalPriceBrlLabel: 'R$ 30,00',
    priceBrlLabel: 'R$ 28,50',
    discountLabel: '5% OFF',
    hotspot: {
      leftPct: 50.6,
      topPct: 23.8,
      widthPct: 47.8,
      heightPct: 20.8,
    },
  },
  {
    id: 'pack_60',
    dwCoinAmount: 60,
    priceCents: 5400,
    originalPriceBrlLabel: 'R$ 60,00',
    priceBrlLabel: 'R$ 54,00',
    discountLabel: '10% OFF',
    hotspot: {
      leftPct: 1.6,
      topPct: 45.2,
      widthPct: 47.6,
      heightPct: 22.3,
    },
  },
  {
    id: 'pack_100',
    dwCoinAmount: 100,
    priceCents: 8500,
    originalPriceBrlLabel: 'R$ 100,00',
    priceBrlLabel: 'R$ 85,00',
    discountLabel: '15% OFF',
    hotspot: {
      leftPct: 50.6,
      topPct: 45.2,
      widthPct: 47.8,
      heightPct: 22.3,
    },
  },
  {
    id: 'pack_200',
    dwCoinAmount: 200,
    priceCents: 16000,
    originalPriceBrlLabel: 'R$ 200,00',
    priceBrlLabel: 'R$ 160,00',
    discountLabel: '20% OFF',
    hotspot: {
      leftPct: 1.6,
      topPct: 68.3,
      widthPct: 96.8,
      heightPct: 20.6,
    },
  },
];

export function getDwCoinRechargePackById(
  packId: string
): DwCoinRechargePack | undefined {
  return DWCOIN_RECHARGE_PACKS.find((p) => p.id === packId);
}
