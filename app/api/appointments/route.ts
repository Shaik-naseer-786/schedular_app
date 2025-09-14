import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, Appointment } from "@/lib/database";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get seller IDs for the current user
    const sellerRecords = await db.collection("sellers").find({ userId: session.user.email }).toArray();
    const sellerIds = sellerRecords.map(seller => seller._id);
    
    console.log("Current user email:", session.user.email);
    console.log("Found seller records:", sellerRecords.length);
    console.log("Seller records:", sellerRecords);
    console.log("Seller IDs:", sellerIds);
    
    // Also check all sellers in database for debugging
    const allSellers = await db.collection("sellers").find({}).toArray();
    console.log("All sellers in database:", allSellers.map(s => ({ id: s._id, userId: s.userId })));
    
    // Convert sellerIds to strings for comparison
    const sellerIdStrings = sellerIds.map(id => id.toString());
    
    console.log("Seller IDs as ObjectIds:", sellerIds);
    console.log("Seller IDs as strings:", sellerIdStrings);
    
    const currentTime = new Date();
    
    const appointments = await db.collection("appointments").find({
      $and: [
        {
          $or: [
            { buyerId: session.user.email },
            { sellerId: { $in: sellerIds } }, // ObjectId comparison
            { sellerId: { $in: sellerIdStrings } } // String comparison
          ]
        },
        {
          endTime: { $gt: currentTime } // Only show appointments that haven't ended yet
        }
      ]
    }).sort({ startTime: 1 }).toArray();
    
    console.log("Current time:", currentTime.toISOString());
    console.log("Found active appointments:", appointments.length);
    console.log("Appointments data:", appointments.map(a => ({ 
      id: a._id, 
      sellerId: a.sellerId, 
      buyerId: a.buyerId, 
      title: a.title,
      endTime: a.endTime
    })));
    
    // Also check ALL appointments in database to see what exists
    const allAppointments = await db.collection("appointments").find({}).toArray();
    const expiredAppointments = allAppointments.filter(apt => new Date(apt.endTime) <= currentTime);
    console.log("Total appointments in database:", allAppointments.length);
    console.log("Expired appointments (filtered out):", expiredAppointments.length);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Appointments API POST called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Session found for user:", session.user.email);

    const body = await request.json();
    const { sellerId, startTime, endTime, title, description } = body;

    console.log("Request body:", body);

    const { db } = await connectToDatabase();
    console.log("Database connected successfully");
    
    // Get seller information
    console.log("Looking for seller with ID:", sellerId);
    let seller;
    try {
      // Try as ObjectId first
      seller = await db.collection("sellers").findOne({ _id: new ObjectId(sellerId) });
      console.log("Seller found with ObjectId:", seller ? "Yes" : "No");
    } catch (error) {
      // If ObjectId fails, try as string
      console.log("ObjectId failed, trying as string");
      seller = await db.collection("sellers").findOne({ _id: sellerId });
      console.log("Seller found with string ID:", seller ? "Yes" : "No");
    }
    
    console.log("Seller found:", seller);
    if (!seller) {
      console.log("Seller not found in database");
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get seller's access token (optional for Google Calendar integration)
    console.log("Looking for seller user with email:", seller.userId);
    const sellerUser = await db.collection("users").findOne({ email: seller.userId });
    console.log("Seller user found:", sellerUser ? "Yes" : "No");
    console.log("Seller has access token:", sellerUser?.accessToken ? "Yes" : "No");

    // Get buyer's access token (optional for Google Calendar integration)
    console.log("Looking for buyer user with email:", session.user.email);
    const buyerUser = await db.collection("users").findOne({ email: session.user.email });
    console.log("Buyer user found:", buyerUser ? "Yes" : "No");
    console.log("Buyer has access token:", buyerUser?.accessToken ? "Yes" : "No");

    // Create appointment in database
    const appointment: Omit<Appointment, "_id"> = {
      sellerId,
      buyerId: session.user.email,
      title: title || `Appointment with ${seller.businessName || seller.userId}`,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating appointment in database...");
    const result = await db.collection("appointments").insertOne(appointment);
    console.log("Appointment created with ID:", result.insertedId);
    const createdAppointment = await db.collection("appointments").findOne({ _id: result.insertedId });
    console.log("Retrieved created appointment:", createdAppointment ? "Success" : "Failed");

    // Create Google Calendar events for both seller and buyer (if tokens are available)
    try {
      if (sellerUser.accessToken && buyerUser.accessToken) {
        console.log("Creating Google Calendar events...");
        
        // Create event for seller
        const sellerCalendarService = new GoogleCalendarService(sellerUser.accessToken, sellerUser.refreshToken);
        const sellerEvent = await sellerCalendarService.createEvent({
          summary: title || `Appointment with ${session.user.name}`,
          description: description || `Appointment with ${session.user.name}`,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: seller.timezone,
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: seller.timezone,
          },
          attendees: [
            { email: session.user.email },
            { email: seller.userId },
          ],
          conferenceData: {
            createRequest: {
              requestId: `meet-${result.insertedId}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        });

        // Create event for buyer
        const buyerCalendarService = new GoogleCalendarService(buyerUser.accessToken, buyerUser.refreshToken);
        const buyerEvent = await buyerCalendarService.createEvent({
          summary: title || `Appointment with ${seller.businessName || seller.userId}`,
          description: description || `Appointment with ${seller.businessName || seller.userId}`,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: seller.timezone,
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: seller.timezone,
          },
          attendees: [
            { email: session.user.email },
            { email: seller.userId },
          ],
          conferenceData: {
            createRequest: {
              requestId: `meet-${result.insertedId}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        });

        // Update appointment with Google event IDs and meet link
        await db.collection("appointments").updateOne(
          { _id: result.insertedId },
          {
            $set: {
              googleEventId: sellerEvent.id,
              meetLink: sellerEvent.conferenceData?.entryPoints?.[0]?.uri,
              updatedAt: new Date(),
            },
          }
        );
        
        console.log("Google Calendar events created successfully");
      } else {
        console.log("Skipping Google Calendar integration - tokens not available");
      }

    } catch (calendarError) {
      console.error("Error creating calendar events:", calendarError);
      console.log("Continuing without Google Calendar integration...");
      // Don't fail the appointment creation if calendar sync fails
    }

    console.log("Appointment creation completed successfully");
    return NextResponse.json(createdAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
