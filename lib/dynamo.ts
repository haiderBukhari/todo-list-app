import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMO_DB_ENDPOINT || "http://localhost:8000",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey",
  },
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function ensureTableExists() {
  try {
    const command = new CreateTableCommand({
      TableName: 'Todos',
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });

    await client.send(command);
    console.log('✅ Todos table created successfully!');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ Todos table already exists!');
    } else {
      console.error('❌ Error creating table:', error.message);
    }
  }
}