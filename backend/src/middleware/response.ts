import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, data }),
  };
}

export function error(message: string, statusCode = 400): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: message }),
  };
}

export function parseBody<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) {
    throw new Error('Request body is required');
  }
  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new Error('Invalid JSON in request body');
  }
}

export function getPathParam(event: APIGatewayProxyEventV2, param: string): string {
  const value = event.pathParameters?.[param];
  if (!value) {
    throw new Error(`Missing path parameter: ${param}`);
  }
  return value;
}

export function getQueryParams(event: APIGatewayProxyEventV2): Record<string, string | undefined> {
  return event.queryStringParameters || {};
}
