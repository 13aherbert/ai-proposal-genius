import { Star } from "lucide-react";

export function Testimonial() {
  return (
    <div className="bg-[#181818]/90 rounded-lg p-8 backdrop-blur-sm shadow-2xl max-w-3xl mx-auto mb-16 text-center animate-fade-up">
      <div className="flex justify-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="text-lg md:text-xl text-gray-200 italic leading-relaxed mb-6">
        "OptiRFP cut our proposal time from 40 hours to 3 hours. We went from dreading RFPs to actually enjoying them."
      </blockquote>
      <div>
        <p className="font-semibold text-gray-100">Sarah Chen</p>
        <p className="text-sm text-gray-400">VP of Business Development, Meridian Consulting</p>
      </div>
    </div>
  );
}
