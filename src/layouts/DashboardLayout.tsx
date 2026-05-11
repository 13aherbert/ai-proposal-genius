import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";
import { Footer } from "../components/navigation/Footer";
import { SkipToContent } from "@/components/accessibility/SkipToContent";

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
