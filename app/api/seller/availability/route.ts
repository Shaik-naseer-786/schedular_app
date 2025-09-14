import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Get seller information
    const seller = await db.collection("sellers").findOne({ userId: session.user.email });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get availability for the specific date
    const availability = await db.collection("availability").findOne({
      sellerId: seller._id,
      date: new Date(date)
    });

    if (!availability) {
      // Generate default time slots (all busy)
      const startTime = new Date(date + "T09:00:00");
      const endTime = new Date(date + "T17:00:00");
      
      const slots = [];
      const current = new Date(startTime);
      
      while (current < endTime) {
        const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes
        
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          available: false, // Start with all slots busy
        });
        
        current.setTime(current.getTime() + 30 * 60000);
      }
      
      return NextResponse.json(slots);
    }

    return NextResponse.json(availability.slots);
  } catch (error) {
    console.error("Error fetching availability:", error);
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
    const { date, slots } = body;

    if (!date || !slots) {
      return NextResponse.json({ error: "Date and slots are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Get seller information
    const seller = await db.collection("sellers").findOne({ userId: session.user.email });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Save availability
    await db.collection("availability").updateOne(
      { sellerId: seller._id, date: new Date(date) },
      { 
        $set: { 
          sellerId: seller._id, 
          date: new Date(date), 
          slots,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ message: "Availability saved successfully" });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


