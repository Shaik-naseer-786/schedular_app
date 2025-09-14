"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const role = searchParams.get("role");

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        // Redirect based on role
        if (role === "seller") {
          router.push("/seller/dashboard");
        } else if (role === "buyer") {
          router.push("/buyer/booking");
        } else {
          router.push(callbackUrl);
        }
      }
    };
    checkSession();
  }, [router, callbackUrl, role]);

  const handleGoogleSignIn = async (role: "seller" | "buyer") => {
    setIsLoading(true);
    setUserRole(role);
    
    try {
      const result = await signIn("google", {
        callbackUrl: `/auth/signin?role=${role}`,
        redirect: false,
      });

      if (result?.ok) {
        // Redirect based on role after successful sign in
        if (role === "seller") {
          router.push("/seller/dashboard");
        } else if (role === "buyer") {
          router.push("/buyer/booking");
        }
      } else {
        console.error("Sign in failed:", result?.error);
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Scheduler App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your role and sign in with Google
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">I&rsquo;m a Seller</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect your Google Calendar to manage your availability and accept appointments.
            </p>
            <button
              onClick={() => handleGoogleSignIn("seller")}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && userRole === "seller" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Sign in as Seller
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">I&rsquo;m a Buyer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sign in to book appointments with sellers and manage your schedule.
            </p>
            <button
              onClick={() => handleGoogleSignIn("buyer")}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && userRole === "buyer" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Sign in as Buyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}