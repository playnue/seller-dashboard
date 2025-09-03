"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { nhost } from "../../lib/nhost";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthenticationStatus } from "@nhost/nextjs";
import React, { Suspense } from "react";

const getValidRedirectUrl = (returnUrl: string | null) => {
  if (!returnUrl) return null;

  try {
    const decodedUrl = decodeURIComponent(returnUrl);
    const url = new URL(decodedUrl, window.location.origin);
    return url.pathname;
  } catch (error) {
    console.error("Error processing redirect URL:", error);
    return null;
  }
};

export const useAuth = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const returnUrl = searchParams.get("returnUrl");
      const options = {
        "redirectTo": process.env.NEXT_PUBLIC_DOMAIN
      }
      const redirectPath = getValidRedirectUrl(returnUrl);
      console.log(options);

      const result = await nhost.auth.signIn({
        provider: "google",
        options
      });

      if (result?.error) {
        console.error("Google login error:", result.error);
        toast.error("Google login failed: " + result.error.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("An error occurred during Google login", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleSuccessfulLogin = () => {
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl);
      router.push(decodedUrl.startsWith("/") ? decodedUrl : `/${decodedUrl}`);
    } else {
      router.push("/");
    }
  };

  return {
    handleGoogleLogin,
    handleSuccessfulLogin,
  };
};

function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const { handleGoogleLogin } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const returnUrl = searchParams.get("returnUrl");
      console.log(returnUrl);
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, searchParams, router]);

  const handleRedirectAfterLogin = () => {
    const returnUrl = searchParams.get("returnUrl");
    const origin = window.location.origin;

    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl);
      const validUrl = decodedUrl.startsWith("/")
        ? decodedUrl
        : `/${decodedUrl}`;
      console.log(validUrl);
      const fullUrl = `${origin}${validUrl}`;

      if (fullUrl.startsWith(origin)) {
        window.location.href = validUrl;
      } else {
        window.location.href = "/";
      }
    } else {
      window.location.href = "/";
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await nhost.auth.signIn({
        email: email,
        password: password,
      });

      const user = result?.session;
      localStorage.setItem("user", JSON.stringify(user));

      if (result?.error) {
        toast.error("Invalid credentials", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.success("Login successful", {
          position: "top-right",
          autoClose: 2000,
        });
        handleRedirectAfterLogin();
      }
    } catch (error) {
      toast.error("An error occurred during login", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="h-screen w-screen fixed inset-0 overflow-hidden">
      <ToastContainer />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated shapes */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Seller Portal</h1>
            <p className="text-gray-300">Grow your business with us</p>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in to access your seller dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Google Login Button */}
              <Button
                variant="outline"
                className="w-full h-12 font-semibold bg-white hover:bg-gray-100 text-gray-900 border-0 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-4 text-gray-400 font-medium">Or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seller@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-white font-medium">
                      Password
                    </Label>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                >
                  Sign In to Dashboard
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-white/20">
                <p className="text-gray-300">
                  New to our platform?{" "}
                  <Link
                    href="/signup"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Create seller account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-gray-400 text-sm">
            <p>© 2025 Seller Portal. Empowering businesses worldwide.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}