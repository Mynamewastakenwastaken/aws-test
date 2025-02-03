import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CloudWatchSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the CloudWatch role for API Gateway
    const role = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
      roleName: 'APIGatewayCloudWatchRole',
    });

    // Update API Gateway account settings to use this role
    const apiGatewayAccount = new cdk.aws_apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: role.roleArn,
    });

    // Output the role ARN
    new cdk.CfnOutput(this, 'CloudWatchRoleArn', {
      value: role.roleArn,
      description: 'ARN of the CloudWatch role for API Gateway',
    });
  }
}
