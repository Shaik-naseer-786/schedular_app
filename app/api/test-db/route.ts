import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Test database connection
    const result = await db.collection("test").insertOne({ test: "connection", timestamp: new Date() });
    
    return NextResponse.json({ 
      message: "Database connection successful", 
      result: result.insertedId 
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      error: "Database connection failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}


