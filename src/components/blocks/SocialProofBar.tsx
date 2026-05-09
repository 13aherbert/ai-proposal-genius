import { Zap, DollarSign } from "lucide-react";

const stats = [
  { icon: Zap, value: "93%", label: "93% faster proposal creation" },
  { icon: DollarSign, value: "$20K+", label: "Average yearly savings" },
];

export function SocialProofBar() {
  return (
    <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 mb-12 animate-fade-up max-w-3xl mx-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#181818]/90 rounded-lg p-5 backdrop-blur-sm shadow-lg flex items-center gap-4 flex-1 md:max-w-xs"
        >
          <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
            <stat.icon className="h-5 w-5 text-brand-green" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-100">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
