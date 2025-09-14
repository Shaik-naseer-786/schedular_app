import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { GoogleCalendarService, generateTimeSlots } from "@/lib/google-calendar";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const { id } = await params;
    
    let seller;
    
    // Check if id is a valid ObjectId first
    if (ObjectId.isValid(id)) {
      seller = await db.collection("sellers").findOne({ 
        _id: new ObjectId(id) 
      });
    }
    
    // If not found with ObjectId or id is not a valid ObjectId, try as string
    // Use type assertion to handle the string case
    if (!seller) {
      seller = await db.collection("sellers").findOne({ 
        _id: id as any  // Type assertion to fix the TypeScript error
      });
    }
    
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get seller's availability for the specific date
    const availability = await db.collection("availability").findOne({
      sellerId: seller._id,
      date: new Date(date)
    });

    if (availability && availability.slots) {
      // Return the seller's saved availability
      return NextResponse.json(availability.slots);
    }

    // If no availability set, generate default slots (all busy)
    const startTime = new Date(date + "T09:00:00");
    const endTime = new Date(date + "T17:00:00");
    
    const timeSlots = [];
    const current = new Date(startTime);
    
    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes
      
      timeSlots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: false, // All slots start as busy
      });
      
      current.setTime(current.getTime() + 30 * 60000);
    }

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}