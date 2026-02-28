import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../handlers/health';
import * as db from '../utils/db';

jest.mock('../utils/db');

const mockDb = db as jest.Mocked<typeof db>;

describe('Health Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy when database is connected', async () => {
    const mockPool = { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) };
    mockDb.getPool.mockReturnValue(mockPool as never);

    const result = (await handler()) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.database).toBe('connected');
    expect(body.data.timestamp).toBeDefined();
  });

  it('should return 503 when database is unavailable', async () => {
    const mockPool = { query: jest.fn().mockRejectedValue(new Error('Connection refused')) };
    mockDb.getPool.mockReturnValue(mockPool as never);

    const result = (await handler()) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(503);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Connection refused');
  });

  it('should handle non-Error throws', async () => {
    const mockPool = { query: jest.fn().mockRejectedValue('unknown error') };
    mockDb.getPool.mockReturnValue(mockPool as never);

    const result = (await handler()) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(503);
    const body = JSON.parse(result.body as string);
    expect(body.error).toBe('Health check failed');
  });
});
