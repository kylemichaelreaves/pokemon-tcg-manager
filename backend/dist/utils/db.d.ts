import { Pool } from 'pg';
export declare function getPool(): Pool;
export declare function query<T>(text: string, params?: unknown[]): Promise<T[]>;
export declare function queryOne<T>(text: string, params?: unknown[]): Promise<T | null>;
export declare function closePool(): Promise<void>;
//# sourceMappingURL=db.d.ts.map