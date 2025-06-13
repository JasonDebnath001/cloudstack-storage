import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Poppins } from "next/font/google";

const PoppinsConfig = {
  Subsets: ["Latin"],
  Weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
};

export const metadata: Metadata = {
  title: "CloudStack",
  description: "CloudStack - The only cloud solution you need",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${PoppinsConfig.variable} font-poppins antialiased`}>
        {children}
      </body>
    </html>
  );
}
