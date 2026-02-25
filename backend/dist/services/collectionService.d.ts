import { CollectionEntry, CollectionRow, AddToCollectionInput, UpdateCollectionInput, CompletionSummary } from '../types';
export declare function getCollection(): Promise<CollectionEntry[]>;
export declare function getCollectionEntryById(id: number): Promise<CollectionEntry | null>;
export declare function addToCollection(input: AddToCollectionInput): Promise<CollectionRow>;
export declare function updateCollectionEntry(id: number, input: UpdateCollectionInput): Promise<CollectionRow | null>;
export declare function removeFromCollection(id: number): Promise<boolean>;
export declare function getCompletionSummary(): Promise<CompletionSummary[]>;
//# sourceMappingURL=collectionService.d.ts.map