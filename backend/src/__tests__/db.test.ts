const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPoolInstance = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
  end: jest.fn().mockResolvedValue(undefined),
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPoolInstance),
}));

import { getPool, query, queryOne, closePool } from '../utils/db';

describe('DB Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPool', () => {
    it('should create and return a pool', () => {
      const pool = getPool();
      expect(pool).toBeDefined();
    });

    it('should return the same pool instance (singleton)', () => {
      const pool1 = getPool();
      const pool2 = getPool();
      expect(pool1).toBe(pool2);
    });
  });

  describe('query', () => {
    it('should execute query and return rows', async () => {
      mockClient.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await query('SELECT * FROM test');

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should pass params to query', async () => {
      mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await query('SELECT * FROM test WHERE id = $1', [1]);

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(query('BAD SQL')).rejects.toThrow('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('queryOne', () => {
    it('should return first row', async () => {
      mockClient.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await queryOne('SELECT * FROM test LIMIT 1');

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when no rows', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await queryOne('SELECT * FROM test WHERE id = $1', [999]);

      expect(result).toBeNull();
    });
  });

  describe('closePool', () => {
    it('should close the pool when it exists', async () => {
      getPool(); // ensure pool is created
      await closePool();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });
  });
});
