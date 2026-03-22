import { Outlet } from "react-router-dom";
import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/navigation/Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
