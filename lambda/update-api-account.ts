import { APIGatewayClient, GetAccountCommand, UpdateAccountCommand } from '@aws-sdk/client-api-gateway';
import { CloudFormationCustomResourceEvent } from 'aws-lambda';

const apigateway = new APIGatewayClient({});

export async function handler(event: CloudFormationCustomResourceEvent) {
  try {
    const roleArn = event.ResourceProperties.CloudWatchRoleArn;

    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      // Get current account settings
      const getAccountResponse = await apigateway.send(new GetAccountCommand({}));
      
      if (getAccountResponse.cloudwatchRoleArn !== roleArn) {
        // Update account settings with new role ARN
        await apigateway.send(new UpdateAccountCommand({
          patchOperations: [{
            op: 'replace',
            path: '/cloudwatchRoleArn',
            value: roleArn
          }]
        }));
      }
    }

    return {
      PhysicalResourceId: 'APIGatewayAccountSettings',
      Status: 'SUCCESS'
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
