"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
exports.parseBody = parseBody;
exports.getPathParam = getPathParam;
exports.getQueryParams = getQueryParams;
function success(data, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data }),
    };
}
function error(message, statusCode = 400) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: message }),
    };
}
function parseBody(event) {
    if (!event.body) {
        throw new Error('Request body is required');
    }
    try {
        return JSON.parse(event.body);
    }
    catch {
        throw new Error('Invalid JSON in request body');
    }
}
function getPathParam(event, param) {
    const value = event.pathParameters?.[param];
    if (!value) {
        throw new Error(`Missing path parameter: ${param}`);
    }
    return value;
}
function getQueryParams(event) {
    return event.queryStringParameters || {};
}
//# sourceMappingURL=response.js.map