"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Appointment {
  _id: string;
  sellerId: string;
  buyerId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  googleEventId?: string;
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface Seller {
  _id: string;
  userId: string;
  businessName?: string;
  description?: string;
  timezone: string;
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session) {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [appointmentsResponse, sellersResponse, usersResponse] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/sellers"),
        fetch("/api/users"),
      ]);

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        console.log("Fetched appointments:", appointmentsData);
        setAppointments(appointmentsData);
      } else {
        console.error("Failed to fetch appointments:", appointmentsResponse.status);
      }

      if (sellersResponse.ok) {
        const sellersData = await sellersResponse.json();
        setSellers(sellersData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSellerInfo = (sellerId: string) => {
    return sellers.find(seller => seller._id === sellerId);
  };

  const getUserInfo = (email: string) => {
    return users.find(user => user.email === email);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isAppointmentExpired = (endTime: string) => {
    return new Date(endTime) <= new Date();
  };

  const isAppointmentExpiringSoon = (endTime: string) => {
    const appointmentEnd = new Date(endTime);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return appointmentEnd <= oneHourFromNow && appointmentEnd > now;
  };

  if (status === "loading" || loading) {
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
              <h1 className="text-xl font-semibold text-gray-900">My Appointments</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/buyer/booking"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Book Appointment
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
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active appointments</h3>
              <p className="mt-1 text-sm text-gray-500">All appointments have ended or no appointments have been booked yet.</p>
              <div className="mt-6">
                <Link
                  href="/buyer/booking"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {appointments.map((appointment) => {
                  const seller = getSellerInfo(appointment.sellerId);
                  const isSeller = session.user?.email === seller?.userId;
                  const buyerUser = getUserInfo(appointment.buyerId);
                  const otherParty = isSeller 
                    ? { name: buyerUser?.name || "Buyer", email: appointment.buyerId }
                    : { name: seller?.businessName || seller?.userId || "Seller", email: seller?.userId };

                  return (
                    <li key={appointment._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {otherParty.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">
                                  {appointment.title}
                                </p>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                                {isAppointmentExpiringSoon(appointment.endTime) && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-500">
                                  with {otherParty.name}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(appointment.startTime)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </p>
                            </div>
                            {appointment.meetLink && (
                              <a
                                href={appointment.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                Join Meeting
                              </a>
                            )}
                          </div>
                        </div>
                        {appointment.description && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">{appointment.description}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
