import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Appointments API is working",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || "3001"
  });
}
