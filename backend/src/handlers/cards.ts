import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { success, error, getPathParam, getQueryParams } from '../middleware/response';
import * as cardService from '../services/cardService';
import { paginationSchema, cardFilterSchema } from '../models/schemas';

export async function getCards(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const queryParams = getQueryParams(event);
    const pagination = paginationSchema.parse(queryParams);
    const filters = cardFilterSchema.parse(queryParams);
    const result = await cardService.getCards(pagination, filters);
    return success(result);
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return error(`Validation error: ${err.message}`, 422);
    }
    const message = err instanceof Error ? err.message : 'Failed to fetch cards';
    return error(message, 500);
  }
}

export async function getCardById(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const id = parseInt(getPathParam(event, 'id'), 10);
    if (isNaN(id)) return error('Invalid card ID', 400);

    const card = await cardService.getCardById(id);
    if (!card) return error('Card not found', 404);

    return success(card);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch card';
    return error(message, 500);
  }
}

export async function getSets(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const sets = await cardService.getSets();
    return success(sets);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sets';
    return error(message, 500);
  }
}
