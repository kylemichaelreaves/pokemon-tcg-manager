// Type definitions for the TCGdex API (https://tcgdex.dev)
// Base URL: https://api.tcgdex.net/v2/en/

/** Set summary from GET /v2/en/sets */
export interface TcgdexSetSummary {
  id: string; // "sv03.5", "base1", "swsh1"
  name: string;
  logo?: string; // URL
  symbol?: string; // URL
  cardCount: {
    total: number;
    official: number;
  };
}

/** Set detail from GET /v2/en/sets/{id} */
export interface TcgdexSetDetail extends TcgdexSetSummary {
  serie: { id: string; name: string }; // e.g. { id: "sv", name: "Scarlet & Violet" }
  releaseDate?: string; // "2023-09-22"
  cards: TcgdexCardSummary[];
  cardCount: {
    total: number;
    official: number;
    holo: number;
    reverse: number;
    normal: number;
    firstEd: number;
  };
}

/** Card summary embedded in set detail response */
export interface TcgdexCardSummary {
  id: string; // "sv03.5-001"
  localId: string; // "001"
  name: string;
  image?: string; // URL (base, no extension)
}

/** Full card from GET /v2/en/cards/{id} */
export interface TcgdexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category: string; // "Pokemon" | "Trainer" | "Energy"
  rarity?: string;
  illustrator?: string;
  hp?: number;
  types?: string[];
  stage?: string; // "Basic", "Stage1", "Stage2", "VMAX", etc.
  dexId?: number[];
  variants?: {
    firstEdition: boolean;
    holo: boolean;
    normal: boolean;
    reverse: boolean;
    wPromo: boolean;
  };
  set: {
    id: string;
    name: string;
    cardCount: { official: number; total: number };
  };
}
