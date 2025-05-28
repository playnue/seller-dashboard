"use client";
import { useState, useEffect } from "react";
// import { signIn } from "next-auth/react";
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
  // If no returnUrl is provided, return null to let Nhost use its default redirect
  if (!returnUrl) return null;

  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(returnUrl);

    // Only use the pathname without any query parameters
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
      const options={
        "redirectTo": process.env.NEXT_PUBLIC_DOMAIN
      }
      const redirectPath = getValidRedirectUrl(returnUrl);
      // console.log(returnUrl)
      // console.log(redirectPath)
      // if (redirectPath) {
      //   // Only set redirectTo if we have a valid path
      //   options.redirectTo = process.env.NEXT_PUBLIC_DOMAIN;
      
      // }
      console.log(options);

      // process.env.url + "/" + returnUrl

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
      // Decode the URL and ensure it starts with a forward slash
      const decodedUrl = decodeURIComponent(returnUrl);
      const validUrl = decodedUrl.startsWith("/")
        ? decodedUrl
        : `/${decodedUrl}`;
      console.log(validUrl);
      // Construct full URL with origin
      const fullUrl = `${origin}${validUrl}`;

      // Validate that the URL belongs to your domain
      if (fullUrl.startsWith(origin)) {
        window.location.href = validUrl;
      } else {
        window.location.href = "/";
      }
    } else {
      window.location.href = "/";
    }
  };

  // Update Google login handler to preserve returnUrl
  // const handleGoogleLogin = async () => {
  //   try {
  //     const returnUrl = searchParams.get("returnUrl");

  //     const result = await nhost.auth.signIn({
  //       provider: 'google',
  //       options: {
  //         // Pass the returnUrl as state parameter
  //         redirectTo: returnUrl ?
  //           `${window.location.origin}${decodeURIComponent(returnUrl)}` :
  //           window.location.origin
  //       }
  //     });

  //     if (result?.error) {
  //       toast.error("Google login failed", {
  //         position: "top-right",
  //         autoClose: 3000,
  //       });
  //     }
  //   } catch (error) {
  //     toast.error("An error occurred during Google login", {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });
  //   }
  // };

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
    <>
      <ToastContainer />
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
          </div>
          <form onSubmit={handleCredentialsLogin}>
            <div className="grid gap-4">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
