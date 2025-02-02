import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create Lambda functions
    const getNewsFunction = new nodejs.NodejsFunction(this, 'GetNewsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-news.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    const postNewsFunction = new nodejs.NodejsFunction(this, 'PostNewsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/post-news.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    // Grant permissions
    props.table.grantReadData(getNewsFunction);
    props.table.grantWriteData(postNewsFunction);

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create REST API with logging enabled
    const api = new apigateway.RestApi(this, 'NewsApi', {
      restApiName: 'News Service',
      description: 'This is a simple API Gateway with Lambda integration',
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    // Create news resource and methods
    const news = api.root.addResource('news');
    news.addMethod('GET', new apigateway.LambdaIntegration(getNewsFunction));

    // Add POST endpoint for creating news items
    const newsItem = api.root.addResource('newsitem');
    newsItem.addMethod('POST', new apigateway.LambdaIntegration(postNewsFunction));

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    // Output the CloudWatch log group name
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
    });
  }
}