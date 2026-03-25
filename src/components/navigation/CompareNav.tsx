import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const competitors = [
  { label: "Loopio", to: "/compare/loopio" },
  { label: "AutoRFP", to: "/compare/autorfp" },
  { label: "Responsive", to: "/compare/responsive" },
  { label: "Proposify", to: "/compare/proposify" },
  { label: "Qvidian", to: "/compare/qvidian" },
  { label: "PandaDoc", to: "/compare/pandadoc" },
];

export function CompareNav() {
  const { pathname } = useLocation();

  return (
    <nav className="border-b bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-2">
            Compare:
          </span>
          {competitors.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                pathname === c.to
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
