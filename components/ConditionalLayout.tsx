"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

  if (isAuthPage) {
    // Render just the children for auth pages
    return <>{children}</>;
  }

  // Render the full layout with header and sidebar for other pages
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex min-h-screen">
        {/* sidebar */}
        <Sidebar />
        <div className="flex-1 p-4 bg-background transition-colors overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
