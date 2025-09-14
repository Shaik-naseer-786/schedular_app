"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface ApiTimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function SellerAvailability() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?role=seller");
      return;
    }

    if (session) {
      fetchAvailability();
    }
  }, [session, status, router, selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seller/availability?date=${selectedDate}`);
      if (response.ok) {
        const data: ApiTimeSlot[] = await response.json();
        // Convert string dates back to Date objects
        const timeSlotsWithDates = data.map((slot: ApiTimeSlot) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        setTimeSlots(timeSlotsWithDates);
      } else {
        console.error("Failed to fetch availability:", response.status);
        // Fallback to generating default slots
        generateDefaultSlots();
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      // Fallback to generating default slots
      generateDefaultSlots();
    } finally {
      setLoading(false);
    }
  };

  

  const generateDefaultSlots = () => {
    const startTime = new Date(selectedDate + "T09:00:00");
    const endTime = new Date(selectedDate + "T17:00:00");
    
    const slots: TimeSlot[] = [];
    const current = new Date(startTime);
    
    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes
      
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: false, // Start with all slots busy
      });
      
      current.setTime(current.getTime() + 30 * 60000);
    }
    
    setTimeSlots(slots);
  };

  const toggleSlotAvailability = (index: number) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, available: !slot.available } : slot
    ));
  };

  const saveAvailability = async () => {
    try {
      const response = await fetch("/api/seller/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          slots: timeSlots.map(slot => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            available: slot.available,
          })),
        }),
      });

      if (response.ok) {
        alert("Availability saved successfully!");
      } else {
        alert("Failed to save availability. Please try again.");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("An error occurred while saving availability.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Manage Availability</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/seller/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/appointments"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Appointments
              </Link>
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || ""}
                  alt={session.user?.name || ""}
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Manage Your Availability
              </h2>
              <p className="text-gray-600 mb-8">
                Set your available time slots for each day. Your Google Calendar will be automatically synced.
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Time Slots for {new Date(selectedDate).toLocaleDateString()}
                  </h3>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => toggleSlotAvailability(index)}
                          className={`p-3 text-sm rounded-md border transition-colors ${
                            slot.available
                              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <div className="font-medium">
                            {slot.start.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="text-xs opacity-75">
                            {slot.available ? "Available" : "Busy"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    <p>• Green slots are available for booking</p>
                    <p>• Red slots are marked as busy</p>
                    <p>• Click any slot to toggle availability</p>
                    <p>• All slots start as busy - click to make them available</p>
                  </div>
                  <button
                    onClick={saveAvailability}
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
