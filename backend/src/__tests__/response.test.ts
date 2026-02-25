import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { success, error, parseBody, getPathParam, getQueryParams } from '../../middleware/response';

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /test',
    rawPath: '/test',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    ...overrides,
  };
}

describe('Response Middleware', () => {
  describe('success', () => {
    it('should return a success response with default 200 status', () => {
      const result = success({ message: 'ok' });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('ok');
    });

    it('should accept custom status code', () => {
      const result = success({ id: '1' }, 201);
      expect(result.statusCode).toBe(201);
    });
  });

  describe('error', () => {
    it('should return an error response', () => {
      const result = error('Something went wrong', 500);
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Something went wrong');
    });

    it('should default to 400 status', () => {
      const result = error('Bad request');
      expect(result.statusCode).toBe(400);
    });
  });

  describe('parseBody', () => {
    it('should parse valid JSON body', () => {
      const event = makeEvent({ body: JSON.stringify({ name: 'test' }) });
      const result = parseBody<{ name: string }>(event);
      expect(result.name).toBe('test');
    });

    it('should throw on missing body', () => {
      const event = makeEvent({ body: undefined });
      expect(() => parseBody(event)).toThrow('Request body is required');
    });

    it('should throw on invalid JSON', () => {
      const event = makeEvent({ body: 'not json' });
      expect(() => parseBody(event)).toThrow('Invalid JSON in request body');
    });
  });

  describe('getPathParam', () => {
    it('should return path parameter value', () => {
      const event = makeEvent({ pathParameters: { id: '123' } });
      expect(getPathParam(event, 'id')).toBe('123');
    });

    it('should throw on missing parameter', () => {
      const event = makeEvent({});
      expect(() => getPathParam(event, 'id')).toThrow('Missing path parameter: id');
    });
  });

  describe('getQueryParams', () => {
    it('should return query parameters', () => {
      const event = makeEvent({ queryStringParameters: { page: '1' } });
      expect(getQueryParams(event)).toEqual({ page: '1' });
    });

    it('should return empty object when no params', () => {
      const event = makeEvent({});
      expect(getQueryParams(event)).toEqual({});
    });
  });
});
