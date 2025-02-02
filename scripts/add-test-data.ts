import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

const tableName = "NewsItems";

const testData = [
  {
    title: "AWS Launches New Service",
    date: "2025-02-01",
    description:
      "Amazon Web Services announces a revolutionary new service for cloud computing.",
  },
  {
    title: "Tech Innovation Award",
    date: "2025-02-02",
    description:
      "Leading tech companies receive recognition for innovative solutions.",
  },
  {
    title: "Future of AI",
    date: "2025-01-30",
    description:
      "Experts discuss the future implications of artificial intelligence.",
  },
];

async function insertData() {
  for (const item of testData) {
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await docClient.send(command);
      console.log(`Inserted: ${item.title}`);
    } catch (error) {
      console.error(`Error inserting ${item.title}:`, error);
    }
  }
}

insertData().then(() => console.log("Data insertion complete."));
