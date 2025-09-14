import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Test database connection
    const sellers = await db.collection("sellers").find({}).toArray();
    const users = await db.collection("users").find({}).toArray();
    
    return NextResponse.json({
      message: "Database connection successful",
      sellersCount: sellers.length,
      usersCount: users.length,
      sellers: sellers,
      users: users
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
