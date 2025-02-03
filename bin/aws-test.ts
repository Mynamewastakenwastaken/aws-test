#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from '../lib/dynamo';
import { ApiStack } from '../lib/api';
import { FrontendStack } from '../lib/frontend-stack';
import { GithubOidcStack } from '../lib/github-oidc-stack';

const app = new cdk.App();

// Define your AWS environment
const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID, 
  region: process.env.CDK_DEFAULT_REGION || 'eu-west-1'
};

// Create GitHub OIDC stack for CI/CD
const githubOidcStack = new GithubOidcStack(app, 'GithubOidcStack', { env });

// Create application stacks
const dynamoStack = new DynamoDBStack(app, 'DynamoDBStack', { env });
const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  table: dynamoStack.table
});
const frontendStack = new FrontendStack(app, 'FrontendStack', { env });