import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const timestamp = new Date().toISOString();
  const requestId = event.requestContext.requestId;

  console.log(JSON.stringify({
    timestamp,
    requestId,
    method: 'GET',
    path: '/news',
    queryParams: event.queryStringParameters,
    sourceIp: event.requestContext.identity.sourceIp,
    userAgent: event.requestContext.identity.userAgent
  }));
  
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });

    console.log(JSON.stringify({
      timestamp,
      requestId,
      message: 'Executing DynamoDB scan',
      tableName: TABLE_NAME
    }));

    const result = await docClient.send(command);

    console.log(JSON.stringify({
      timestamp,
      requestId,
      message: 'Scan completed',
      itemCount: result.Items?.length || 0
    }));

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(result.Items || [])
    };

    return response;
  } catch (error) {
    console.error(JSON.stringify({
      timestamp,
      requestId,
      message: 'Error executing scan',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
