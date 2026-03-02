import { Shield, Lock, EyeOff } from "lucide-react";

const badges = [
  { icon: Shield, label: "SOC 2 Type II Certified" },
  { icon: Lock, label: "AES-256 Encryption" },
  { icon: EyeOff, label: "Your data never trains our AI" },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-4">
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
          <badge.icon className="h-4 w-4" />
          <span className="text-xs">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
