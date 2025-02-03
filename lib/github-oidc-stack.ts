import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class GithubOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the OIDC Provider for GitHub
    const provider = new iam.OpenIdConnectProvider(this, 'GithubProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // Create a role that can be assumed by GitHub Actions
    const role = new iam.Role(this, 'GithubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringLike: {
          'token.actions.githubusercontent.com:sub': 'repo:*',
        },
      }),
      description: 'Role assumed by GitHub Actions for CDK deployments',
      roleName: 'GithubActionsCdkDeployRole',
    });

    // Add permissions needed for CDK deployments
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudformation:*',
        's3:*',
        'iam:*',
        'lambda:*',
        'apigateway:*',
        'dynamodb:*',
        'logs:*',
        'cloudfront:*',
      ],
      resources: ['*'],
    }));

    // Output the role ARN
    new cdk.CfnOutput(this, 'RoleArn', {
      value: role.roleArn,
      description: 'ARN of the role to be assumed by GitHub Actions',
    });
  }
}
