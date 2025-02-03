import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CloudWatchSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the CloudWatch Logs service role
    const logsRole = new iam.Role(this, 'CloudWatchLogsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'APIGatewayCloudWatchLogsRole',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    // Create a custom resource to update the API Gateway account settings
    const updateAccountSettings = new cdk.CustomResource(this, 'UpdateAPIGatewayAccountSettings', {
      serviceToken: cdk.CustomResourceProvider.getOrCreate(this, 'CustomResourceProvider', {
        codeDirectory: cdk.FileSystem.tmpdir,
        runtime: cdk.CustomResourceProviderRuntime.NODEJS_18_X,
        policyStatements: [{
          Effect: 'Allow',
          Action: ['apigateway:PATCH', 'apigateway:GET'],
          Resource: `arn:aws:apigateway:${this.region}::/account`
        }],
        timeout: cdk.Duration.minutes(5)
      }),
      properties: {
        CloudWatchRoleArn: logsRole.roleArn
      }
    });

    // Output the role ARN
    new cdk.CfnOutput(this, 'CloudWatchLogsRoleArn', {
      value: logsRole.roleArn,
      description: 'ARN of the CloudWatch Logs role for API Gateway'
    });
  }
}
