import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
export declare function success<T>(data: T, statusCode?: number): APIGatewayProxyResultV2;
export declare function error(message: string, statusCode?: number): APIGatewayProxyResultV2;
export declare function parseBody<T>(event: APIGatewayProxyEventV2): T;
export declare function getPathParam(event: APIGatewayProxyEventV2, param: string): string;
export declare function getQueryParams(event: APIGatewayProxyEventV2): Record<string, string | undefined>;
//# sourceMappingURL=response.d.ts.map