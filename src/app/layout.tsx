"use client"
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// import AuthProvider from "./context/AuthProvider";
// import Navbar from "./components/Navbar";
import logo from "../../public/logo.png";
import Head from "next/head";
import { NhostProvider } from "@nhost/nextjs";
import { VenueProvider } from './context/VenueContext';
import { nhost } from "../lib/nhost"
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// export const metadata: Metadata = {
//   title: "Playnue",
//   description: "Welcome to Playnue",
//   icons: {
//     icon: "/logo.png", // Point to the favicon image in the public folder
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
       <NhostProvider nhost={nhost}>
          <VenueProvider>
            {children}
          </VenueProvider>
        </NhostProvider>
      </body>
    </html>
  );
}
