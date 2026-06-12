import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Document Builder",
  description: "Write, format, and export documents to PDF online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
