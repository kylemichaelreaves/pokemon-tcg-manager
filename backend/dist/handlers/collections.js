"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollection = getCollection;
exports.getCollectionEntry = getCollectionEntry;
exports.addToCollection = addToCollection;
exports.updateCollectionEntry = updateCollectionEntry;
exports.removeFromCollection = removeFromCollection;
exports.getCompletionSummary = getCompletionSummary;
const response_1 = require("../middleware/response");
const collectionService = __importStar(require("../services/collectionService"));
const schemas_1 = require("../models/schemas");
async function getCollection(_event) {
    try {
        const entries = await collectionService.getCollection();
        return (0, response_1.success)(entries);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch collection';
        return (0, response_1.error)(message, 500);
    }
}
async function getCollectionEntry(event) {
    try {
        const id = parseInt((0, response_1.getPathParam)(event, 'id'), 10);
        if (isNaN(id))
            return (0, response_1.error)('Invalid collection entry ID', 400);
        const entry = await collectionService.getCollectionEntryById(id);
        if (!entry)
            return (0, response_1.error)('Collection entry not found', 404);
        return (0, response_1.success)(entry);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch collection entry';
        return (0, response_1.error)(message, 500);
    }
}
async function addToCollection(event) {
    try {
        const body = (0, response_1.parseBody)(event);
        const input = schemas_1.addToCollectionSchema.parse(body);
        const entry = await collectionService.addToCollection(input);
        return (0, response_1.success)(entry, 201);
    }
    catch (err) {
        if (err instanceof Error && err.name === 'ZodError') {
            return (0, response_1.error)(`Validation error: ${err.message}`, 422);
        }
        if (err instanceof Error && err.message.includes('duplicate key')) {
            return (0, response_1.error)('This card variant is already in your collection', 409);
        }
        if (err instanceof Error && err.message.includes('violates foreign key')) {
            return (0, response_1.error)('Card not found', 404);
        }
        const message = err instanceof Error ? err.message : 'Failed to add to collection';
        return (0, response_1.error)(message, 500);
    }
}
async function updateCollectionEntry(event) {
    try {
        const id = parseInt((0, response_1.getPathParam)(event, 'id'), 10);
        if (isNaN(id))
            return (0, response_1.error)('Invalid collection entry ID', 400);
        const body = (0, response_1.parseBody)(event);
        const input = schemas_1.updateCollectionSchema.parse(body);
        const entry = await collectionService.updateCollectionEntry(id, input);
        if (!entry)
            return (0, response_1.error)('Collection entry not found', 404);
        return (0, response_1.success)(entry);
    }
    catch (err) {
        if (err instanceof Error && err.name === 'ZodError') {
            return (0, response_1.error)(`Validation error: ${err.message}`, 422);
        }
        const message = err instanceof Error ? err.message : 'Failed to update collection entry';
        return (0, response_1.error)(message, 500);
    }
}
async function removeFromCollection(event) {
    try {
        const id = parseInt((0, response_1.getPathParam)(event, 'id'), 10);
        if (isNaN(id))
            return (0, response_1.error)('Invalid collection entry ID', 400);
        const removed = await collectionService.removeFromCollection(id);
        if (!removed)
            return (0, response_1.error)('Collection entry not found', 404);
        return (0, response_1.success)({ message: 'Removed from collection' });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove from collection';
        return (0, response_1.error)(message, 500);
    }
}
async function getCompletionSummary(_event) {
    try {
        const summary = await collectionService.getCompletionSummary();
        return (0, response_1.success)(summary);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch completion summary';
        return (0, response_1.error)(message, 500);
    }
}
//# sourceMappingURL=collections.js.map