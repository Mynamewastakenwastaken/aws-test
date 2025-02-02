import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DynamoDBStack } from '../lib/dynamo';
import { ApiStack } from '../lib/api';
import { FrontendStack } from '../lib/frontend-stack';

describe('News API Infrastructure', () => {
  const app = new cdk.App();
  
  // Create the DynamoDB stack
  const dynamoStack = new DynamoDBStack(app, 'TestDynamoStack');
  
  // Create the API stack
  const apiStack = new ApiStack(app, 'TestApiStack', {
    table: dynamoStack.table
  });

  // Create the Frontend stack
  const frontendStack = new FrontendStack(app, 'TestFrontendStack');

  // Get the CloudFormation template
  const dynamoTemplate = Template.fromStack(dynamoStack);
  const apiTemplate = Template.fromStack(apiStack);
  const frontendTemplate = Template.fromStack(frontendStack);

  // DynamoDB Stack Tests
  describe('DynamoDB Stack', () => {
    test('Creates DynamoDB table', () => {
      dynamoTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'title',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'date',
            KeyType: 'RANGE'
          }
        ]
      });
    });
  });

  // API Stack Tests
  describe('API Stack', () => {
    test('Creates API Gateway REST API', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'News Service'
      });
    });

    test('Creates GET Lambda function', () => {
      apiTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue()
          }
        }
      });
    });

    test('Creates POST Lambda function', () => {
      apiTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue()
          }
        }
      });
    });

    test('Creates CloudWatch Log Group', () => {
      apiTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('Configures CORS', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          RequestTemplates: {
            'application/json': '{ statusCode: 200 }'
          }
        }
      });
    });
  });

  // Frontend Stack Tests
  describe('Frontend Stack', () => {
    test('Creates S3 bucket for website hosting', () => {
      frontendTemplate.hasResourceProperties('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'index.html'
        }
      });
    });

    test('Creates CloudFront distribution', () => {
      frontendTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultRootObject: 'index.html',
          Enabled: true,
          HttpVersion: 'http2'
        }
      });
    });
  });
});

// Lambda Function Tests
describe('Lambda Functions', () => {
  const mockEvent = {
    requestContext: {
      requestId: 'test-request-id',
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'jest-test'
      }
    }
  };

  beforeEach(() => {
    // Reset environment for each test
    process.env.TABLE_NAME = 'TestNewsItems';
    
    // Clear all mocks
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('GET /news Lambda', () => {
    test('Returns 200 with empty array when no items exist', async () => {
      // Mock DynamoDB client
      jest.mock('@aws-sdk/client-dynamodb', () => ({
        DynamoDBClient: jest.fn().mockImplementation(() => ({
          send: jest.fn().mockResolvedValue({ Items: [] })
        }))
      }));

      jest.mock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockResolvedValue({ Items: [] })
          }))
        },
        ScanCommand: jest.fn()
      }));

      const { handler } = require('../lambda/get-news');
      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([]);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('POST /newsitem Lambda', () => {
    beforeEach(() => {
      // Mock DynamoDB client for each test
      jest.mock('@aws-sdk/client-dynamodb', () => ({
        DynamoDBClient: jest.fn().mockImplementation(() => ({
          send: jest.fn().mockResolvedValue({})
        }))
      }));

      jest.mock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockResolvedValue({})
          }))
        },
        PutCommand: jest.fn()
      }));
    });

    test('Returns 400 when body is missing', async () => {
      const { handler } = require('../lambda/post-news');
      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Request body is missing'
      });
    });

    test('Returns 400 when required fields are missing', async () => {
      const { handler } = require('../lambda/post-news');
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          title: 'Test Title'
          // Missing date and description
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing required fields: title, date, and description are required'
      });
    });

    test('Returns 201 when item is created successfully', async () => {
      const { handler } = require('../lambda/post-news');
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          title: 'Test Title',
          date: '2025-02-02',
          description: 'Test Description'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        message: 'News item created successfully',
        item: {
          title: 'Test Title',
          date: '2025-02-02',
          description: 'Test Description'
        }
      });
    });
  });
});
