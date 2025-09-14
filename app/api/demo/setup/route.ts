import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    
    // Create a demo seller for testing
    const demoSeller = {
      userId: "demo@seller.com",
      businessName: "Demo Seller",
      description: "This is a demo seller for testing purposes",
      timezone: "America/New_York",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if demo seller already exists
    const existingSeller = await db.collection("sellers").findOne({ userId: "demo@seller.com" });
    
    if (!existingSeller) {
      const result = await db.collection("sellers").insertOne(demoSeller);
      return NextResponse.json({
        message: "Demo seller created successfully",
        sellerId: result.insertedId
      });
    } else {
      return NextResponse.json({
        message: "Demo seller already exists",
        sellerId: existingSeller._id
      });
    }
  } catch (error) {
    console.error("Error creating demo seller:", error);
    return NextResponse.json({ 
      error: "Failed to create demo seller",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
