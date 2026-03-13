/**
 * MarketStateSerializer - Handles Map<string, ItemMarketStats> serialization
 */

import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import type { VersionedComponent } from '../types.js';

interface ItemMarketStats {
  itemId: string;
  totalSupply: number;
  recentSales: number;
  recentPurchases: number;
  averagePrice: number;
  priceHistory: number[];
  lastUpdated: number;
}

interface MarketStateComponent {
  type: 'market_state';
  itemStats: Map<string, ItemMarketStats>;
  totalCurrency: number;
  dailyTransactionVolume: number;
  weeklyTransactionVolume: number;
  inflationRate: number;
  lastDayProcessed: number;
}

interface SerializedMarketState {
  itemStats: [string, ItemMarketStats][];
  totalCurrency: number;
  dailyTransactionVolume: number;
  weeklyTransactionVolume: number;
  inflationRate: number;
  lastDayProcessed: number;
}

export class MarketStateSerializer extends BaseComponentSerializer<MarketStateComponent> {
  constructor() {
    super('market_state', 1);
  }

  protected serializeData(component: MarketStateComponent): SerializedMarketState {
    return {
      itemStats: Array.from(component.itemStats.entries()),
      totalCurrency: component.totalCurrency,
      dailyTransactionVolume: component.dailyTransactionVolume,
      weeklyTransactionVolume: component.weeklyTransactionVolume,
      inflationRate: component.inflationRate,
      lastDayProcessed: component.lastDayProcessed,
    };
  }

  protected deserializeData(data: unknown): MarketStateComponent {
    const d = data as SerializedMarketState;
    return {
      type: 'market_state',
      itemStats: new Map(d.itemStats ?? []),
      totalCurrency: d.totalCurrency,
      dailyTransactionVolume: d.dailyTransactionVolume,
      weeklyTransactionVolume: d.weeklyTransactionVolume,
      inflationRate: d.inflationRate,
      lastDayProcessed: d.lastDayProcessed,
    };
  }

  validate(data: unknown): data is MarketStateComponent {
    const d = data as SerializedMarketState;
    if (!Array.isArray(d?.itemStats)) {
      throw new Error('[MarketStateSerializer] Missing or invalid itemStats array');
    }
    return true;
  }

  deserialize(data: VersionedComponent): MarketStateComponent {
    return this.deserializeData(data.data);
  }
}
