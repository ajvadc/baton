import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baton | Knowledge Handover with Verifiable Evidence",
  description: "Turns scattered project activity into a reviewed, role-appropriate handover when a team member leaves.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
