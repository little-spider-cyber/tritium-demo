export interface TokenInfo {
  twitter: string;
  website: string;
  telegram: string;
}

export interface TokenData {
  baseDecimals: number;
  baseName: string;
  baseSupply: number;
  baseSymbol: string;
  baseToken: string;
  buyCount24h: number;
  chainId: string;
  count24h: number;
  dex: string;
  info: string | TokenInfo; // It comes as string in JSON, might need parsing
  liquidity: number;
  marketCap: number;
  pair: string;
  price: number;
  priceChange1h: number;
  priceChange1m: number; // Added
  priceChange5m: number; // Added
  priceChange24h: number;
  priceNative: number;
  priceUsd: number;
  quoteName: string;
  quoteSymbol: string;
  quoteToken: string;
  sellCount24h: number;
  timeDiff: string;
  volumeUsd24h: number;
}

export type WebSocketMessage = {
  msg?: string;
  code?: string;
  t?: number;
  data?: TokenData[];
  chainId?: string;
  topic?: string;
  interval?: string;
  compression?: number;
  event?: string;
  pair?: string;
  pong?: string; // For pong messages
} | {
  ping?: string; // For ping messages
}

