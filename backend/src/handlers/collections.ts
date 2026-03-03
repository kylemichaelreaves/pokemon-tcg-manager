import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { success, error, parseBody, getPathParam } from '../middleware/response';
import * as collectionService from '../services/collectionService';
import { addToCollectionSchema, updateCollectionSchema } from '../models/schemas';

export async function getCollection(
  _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const entries = await collectionService.getCollection();
    return success(entries);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch collection';
    return error(message, 500);
  }
}

export async function getCollectionEntry(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const id = Number.parseInt(getPathParam(event, 'id'), 10);
    if (Number.isNaN(id)) return error('Invalid collection entry ID', 400);

    const entry = await collectionService.getCollectionEntryById(id);
    if (!entry) return error('Collection entry not found', 404);

    return success(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch collection entry';
    return error(message, 500);
  }
}

export async function addToCollection(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const body = parseBody(event);
    const input = addToCollectionSchema.parse(body);
    const entry = await collectionService.addToCollection(input);
    return success(entry, 201);
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return error(`Validation error: ${err.message}`, 422);
    }
    if (err instanceof Error && err.message.includes('duplicate key')) {
      return error('This card variant is already in your collection', 409);
    }
    if (err instanceof Error && err.message.includes('violates foreign key')) {
      return error('Card not found', 404);
    }
    const message = err instanceof Error ? err.message : 'Failed to add to collection';
    return error(message, 500);
  }
}

export async function updateCollectionEntry(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const id = Number.parseInt(getPathParam(event, 'id'), 10);
    if (Number.isNaN(id)) return error('Invalid collection entry ID', 400);

    const body = parseBody(event);
    const input = updateCollectionSchema.parse(body);
    const entry = await collectionService.updateCollectionEntry(id, input);
    if (!entry) return error('Collection entry not found', 404);

    return success(entry);
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return error(`Validation error: ${err.message}`, 422);
    }
    const message = err instanceof Error ? err.message : 'Failed to update collection entry';
    return error(message, 500);
  }
}

export async function removeFromCollection(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const id = Number.parseInt(getPathParam(event, 'id'), 10);
    if (Number.isNaN(id)) return error('Invalid collection entry ID', 400);

    const removed = await collectionService.removeFromCollection(id);
    if (!removed) return error('Collection entry not found', 404);

    return success({ message: 'Removed from collection' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove from collection';
    return error(message, 500);
  }
}

export async function getCompletionSummary(
  _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    const summary = await collectionService.getCompletionSummary();
    return success(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch completion summary';
    return error(message, 500);
  }
}
