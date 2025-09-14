import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const sellers = await db.collection("sellers").find({}).toArray();
    
    console.log("Found sellers:", sellers.length);
    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
