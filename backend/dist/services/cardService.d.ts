import { Card, CardSet, PaginatedResponse, PaginationParams, CardFilters } from '../types';
export declare function getCards(pagination: PaginationParams, filters: CardFilters): Promise<PaginatedResponse<Card>>;
export declare function getCardById(id: number): Promise<Card | null>;
export declare function getSets(): Promise<CardSet[]>;
//# sourceMappingURL=cardService.d.ts.map