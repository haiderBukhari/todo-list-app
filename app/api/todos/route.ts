import { NextResponse } from "next/server";
import { PutCommand, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, ensureTableExists } from "@/lib/dynamo";
import { v4 as uuidv4 } from "uuid";

// Ensure table exists on first API call
let tableInitialized = false;
async function initializeTable() {
  if (!tableInitialized) {
    await ensureTableExists();
    tableInitialized = true;
  }
}

// GET all todos
export async function GET() {
  try {
    await initializeTable();
    const result = await ddbDocClient.send(new ScanCommand({ TableName: "Todos" }));
    return NextResponse.json(result.Items || []);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// POST new todo
export async function POST(req: Request) {
  try {
    await initializeTable();
    const data = await req.json();
    
    if (!data.text || data.text.trim() === "") {
      return NextResponse.json({ error: "Todo text is required" }, { status: 400 });
    }

    const newTodo = {
      id: uuidv4(),
      text: data.text.trim(),
      completed: false,
      priority: data.priority || "medium",
      createdAt: new Date().toISOString(),
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: "Todos",
        Item: newTodo,
      })
    );

    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}

// PUT update todo
export async function PUT(req: Request) {
  try {
    await initializeTable();
    const data = await req.json();
    const { id, text, completed, priority } = data;

    if (!id) {
      return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    }

    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (text !== undefined) {
      updateExpression.push("#text = :text");
      expressionAttributeNames["#text"] = "text";
      expressionAttributeValues[":text"] = text.trim();
    }

    if (completed !== undefined) {
      updateExpression.push("#completed = :completed");
      expressionAttributeNames["#completed"] = "completed";
      expressionAttributeValues[":completed"] = completed;
    }

    if (priority !== undefined) {
      updateExpression.push("#priority = :priority");
      expressionAttributeNames["#priority"] = "priority";
      expressionAttributeValues[":priority"] = priority;
    }

    if (updateExpression.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: "Todos",
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    // Fetch and return the updated todo
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: "Todos",
        Key: { id },
      })
    );

    return NextResponse.json(result.Item);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

// DELETE a todo by id
export async function DELETE(req: Request) {
  try {
    await initializeTable();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    }

    await ddbDocClient.send(
      new DeleteCommand({
        TableName: "Todos",
        Key: { id },
      })
    );

    return NextResponse.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}