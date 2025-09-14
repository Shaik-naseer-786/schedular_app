"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Seller {
  _id: string;
  userId: string;
  businessName?: string;
  description?: string;
  timezone: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export default function BuyerBooking() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?role=buyer");
      return;
    }

    if (session) {
      fetchSellers();
    }
  }, [session, status, router]);

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/sellers");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched sellers:", data);
        
        // If no sellers exist, create a demo seller
        if (data.length === 0) {
          console.log("No sellers found, creating demo seller...");
          const demoResponse = await fetch("/api/demo/setup", { method: "POST" });
          if (demoResponse.ok) {
            // Fetch sellers again after creating demo
            const newResponse = await fetch("/api/sellers");
            if (newResponse.ok) {
              const newData = await newResponse.json();
              setSellers(newData);
            }
          }
        } else {
          setSellers(data);
        }
      } else {
        console.error("Failed to fetch sellers:", response.status);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchAvailableSlots = async (sellerId: string, date: string) => {
    setLoading(true);
    try {
      console.log("Fetching availability for seller:", sellerId, "date:", date);
      const response = await fetch(`/api/sellers/${sellerId}/availability?date=${date}`);
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Time slots data:", data);
        // Convert string dates back to Date objects
        const timeSlotsWithDates = data.map((slot: any) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        setTimeSlots(timeSlotsWithDates);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch availability:", response.status, errorText);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerSelect = (seller: Seller) => {
    setSelectedSeller(seller);
    fetchAvailableSlots(seller._id, selectedDate);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedSeller) {
      fetchAvailableSlots(selectedSeller._id, date);
    }
  };

  const handleBookAppointment = async (slot: TimeSlot) => {
    if (!selectedSeller) return;

    setBookingLoading(true);
    try {
      const url = "/api/appointments";
      console.log("Making POST request to:", url);
      console.log("Current window location:", window.location.href);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: selectedSeller._id,
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
          title: `Appointment with ${selectedSeller.businessName || selectedSeller.userId}`,
        }),
      });

      if (response.ok) {
        alert("Appointment booked successfully!");
        router.push("/appointments");
      } else {
        alert("Failed to book appointment. Please try again.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
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
              <h1 className="text-xl font-semibold text-gray-900">Book Appointment</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/appointments"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Appointments
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seller Selection */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Select a Seller
                  </h2>
                  <button
                    onClick={fetchSellers}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {sellers.map((seller) => (
                    <div
                      key={seller._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSeller?._id === seller._id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleSellerSelect(seller)}
                    >
                      <h3 className="font-medium text-gray-900">
                        {seller.businessName || seller.userId}
                      </h3>
                      {seller.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {seller.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Timezone: {seller.timezone}
                      </p>
                    </div>
                  ))}
                </div>
                {sellers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sellers available at the moment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Select Date & Time
                </h2>
                
                {selectedSeller ? (
                  <>
                    <div className="mb-4">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900"
                      />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots
                      </h3>
                      {loading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        </div>
                      ) : timeSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => handleBookAppointment(slot)}
                              disabled={!slot.available || bookingLoading}
                              className={`p-3 text-sm rounded-md border transition-colors ${
                                slot.available
                                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                  : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {slot.start.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No time slots available for this date.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Please select a seller to view available time slots.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
