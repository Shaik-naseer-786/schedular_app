import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Now accepts Promise
) {
  try {
    const resolvedParams = await params; // ✅ Await the params promise
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const { id } = resolvedParams; // ✅ Use the resolved params

    let seller = null;

    // ✅ Try ObjectId
    if (ObjectId.isValid(id)) {
      seller = await db.collection("sellers").findOne({
        _id: new ObjectId(id),
      });
    }

    // ✅ If not found, try string id (only if your _id is stored as string in DB)
    if (!seller) {
      seller = await db.collection("sellers").findOne({
        _id: id as unknown as ObjectId,
      });
    }

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // ✅ Fetch availability
    const availability = await db.collection("availability").findOne({
      sellerId: seller._id,
      date: new Date(date),
    });

    if (availability?.slots) {
      return NextResponse.json(availability.slots);
    }

    // ✅ Default time slots
    const startTime = new Date(`${date}T09:00:00`);
    const endTime = new Date(`${date}T17:00:00`);
    const timeSlots = [];
    const current = new Date(startTime);

    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 min
      timeSlots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: false,
      });
      current.setTime(current.getTime() + 30 * 60000);
    }

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}