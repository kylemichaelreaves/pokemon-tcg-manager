import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { success, error } from '../middleware/response';
import { getPool } from '../utils/db';

export async function handler(): Promise<APIGatewayProxyResultV2> {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');

    return success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Health check failed';
    return error(message, 503);
  }
}
