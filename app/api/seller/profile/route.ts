import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, Seller } from "@/lib/database";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const seller = await db.collection("sellers").findOne({ userId: session.user.email });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    return NextResponse.json(seller);
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, description, timezone } = body;

    const { db } = await connectToDatabase();
    
    // Check if seller profile already exists
    const existingSeller = await db.collection("sellers").findOne({ userId: session.user.email });
    
    if (existingSeller) {
      // Update existing seller
      const updatedSeller = await db.collection("sellers").findOneAndUpdate(
        { userId: session.user.email },
        {
          $set: {
            businessName,
            description,
            timezone,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
      
      return NextResponse.json(updatedSeller.value);
    } else {
      // Create new seller profile
      const newSeller: Omit<Seller, "_id"> = {
        userId: session.user.email,
        businessName,
        description,
        timezone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("sellers").insertOne(newSeller);
      const seller = await db.collection("sellers").findOne({ _id: result.insertedId });

      return NextResponse.json(seller);
    }
  } catch (error) {
    console.error("Error creating/updating seller profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
