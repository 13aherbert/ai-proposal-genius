import { Outlet } from "react-router-dom";
import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/navigation/Footer";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { HelpFeedbackLauncher } from "@/components/feedback/HelpFeedbackLauncher";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipToContent />
      <PublicNavbar />
      <main id="main-content" className="flex-1" role="main">
        <Outlet />
      </main>
      <Footer />
      <HelpFeedbackLauncher publicMode />
    </div>
  );
}
