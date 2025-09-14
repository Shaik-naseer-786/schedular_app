import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "scheduler-app";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Database Models
export interface User {
  _id?: string;
  email: string;
  name: string;
  image?: string;
  role: "seller" | "buyer";
  googleAccessToken?: string;
  googleRefreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Seller {
  _id?: string;
  userId: string;
  businessName?: string;
  description?: string;
  availability?: {
    monday: { start: string; end: string; available: boolean }[];
    tuesday: { start: string; end: string; available: boolean }[];
    wednesday: { start: string; end: string; available: boolean }[];
    thursday: { start: string; end: string; available: boolean }[];
    friday: { start: string; end: string; available: boolean }[];
    saturday: { start: string; end: string; available: boolean }[];
    sunday: { start: string; end: string; available: boolean }[];
  };
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  _id?: string;
  sellerId: string;
  buyerId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "completed" | "cancelled";
  googleEventId?: string;
  meetLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  var mongo: {
    conn: { client: MongoClient; db: Db } | null;
    promise: Promise<{ client: MongoClient; db: Db }> | null;
  };
}
