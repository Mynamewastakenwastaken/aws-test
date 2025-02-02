#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from '../lib/dynamo';
import { ApiStack } from '../lib/api';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const dynamoStack = new DynamoDBStack(app, 'DynamoDBStack', {
});

const apiStack = new ApiStack(app, 'ApiStack', {
  table: dynamoStack.table
});

const frontendStack = new FrontendStack(app, 'FrontendStack');