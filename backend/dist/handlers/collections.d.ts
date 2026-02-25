import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
export declare function getCollection(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
export declare function getCollectionEntry(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
export declare function addToCollection(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
export declare function updateCollectionEntry(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
export declare function removeFromCollection(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
export declare function getCompletionSummary(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
//# sourceMappingURL=collections.d.ts.map