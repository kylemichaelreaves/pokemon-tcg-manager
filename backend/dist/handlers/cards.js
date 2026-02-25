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
exports.getCards = getCards;
exports.getCardById = getCardById;
exports.getSets = getSets;
const response_1 = require("../middleware/response");
const cardService = __importStar(require("../services/cardService"));
const schemas_1 = require("../models/schemas");
async function getCards(event) {
    try {
        const queryParams = (0, response_1.getQueryParams)(event);
        const pagination = schemas_1.paginationSchema.parse(queryParams);
        const filters = schemas_1.cardFilterSchema.parse(queryParams);
        const result = await cardService.getCards(pagination, filters);
        return (0, response_1.success)(result);
    }
    catch (err) {
        if (err instanceof Error && err.name === 'ZodError') {
            return (0, response_1.error)(`Validation error: ${err.message}`, 422);
        }
        const message = err instanceof Error ? err.message : 'Failed to fetch cards';
        return (0, response_1.error)(message, 500);
    }
}
async function getCardById(event) {
    try {
        const id = parseInt((0, response_1.getPathParam)(event, 'id'), 10);
        if (isNaN(id))
            return (0, response_1.error)('Invalid card ID', 400);
        const card = await cardService.getCardById(id);
        if (!card)
            return (0, response_1.error)('Card not found', 404);
        return (0, response_1.success)(card);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch card';
        return (0, response_1.error)(message, 500);
    }
}
async function getSets(_event) {
    try {
        const sets = await cardService.getSets();
        return (0, response_1.success)(sets);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch sets';
        return (0, response_1.error)(message, 500);
    }
}
//# sourceMappingURL=cards.js.map