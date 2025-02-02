import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const timestamp = new Date().toISOString();
  const requestId = event.requestContext.requestId;

  console.log(JSON.stringify({
    timestamp,
    requestId,
    method: 'POST',
    path: '/newsitem',
    sourceIp: event.requestContext.identity.sourceIp,
    userAgent: event.requestContext.identity.userAgent
  }));

  try {
    if (!event.body) {
      console.warn(JSON.stringify({
        timestamp,
        requestId,
        message: 'Missing request body'
      }));

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ message: 'Request body is missing' })
      };
    }

    const item = JSON.parse(event.body);
    
    console.log(JSON.stringify({
      timestamp,
      requestId,
      message: 'Received item',
      item
    }));

    // Validate required fields
    if (!item.title || !item.date || !item.description) {
      console.warn(JSON.stringify({
        timestamp,
        requestId,
        message: 'Missing required fields',
        item
      }));

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ message: 'Missing required fields: title, date, and description are required' })
      };
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        title: item.title,
        date: item.date,
        description: item.description
      }
    });

    console.log(JSON.stringify({
      timestamp,
      requestId,
      message: 'Executing DynamoDB put',
      tableName: TABLE_NAME,
      item: {
        title: item.title,
        date: item.date
      }
    }));

    await docClient.send(command);

    console.log(JSON.stringify({
      timestamp,
      requestId,
      message: 'Item created successfully',
      itemTitle: item.title
    }));

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: 'News item created successfully',
        item: item
      })
    };
  } catch (error) {
    console.error(JSON.stringify({
      timestamp,
      requestId,
      message: 'Error creating item',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
