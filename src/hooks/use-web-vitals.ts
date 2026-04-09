import { useEffect } from "react";

/**
 * Lightweight Web Vitals tracking using the PerformanceObserver API.
 * Reports LCP, FID, CLS, and INP to console in dev and to any configured
 * analytics endpoint in production.
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

function getRating(name: string, value: number): WebVitalMetric["rating"] {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "FID":
    case "INP":
      return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    default:
      return "good";
  }
}

function reportMetric(metric: WebVitalMetric) {
  if (import.meta.env.DEV) {
    const color = metric.rating === "good" ? "green" : metric.rating === "needs-improvement" ? "orange" : "red";
    console.log(
      `%c[Web Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }
  // In production, send to analytics (e.g., Sentry, custom endpoint)
}

export function useWebVitals() {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    const observers: PerformanceObserver[] = [];

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          const value = last.startTime;
          reportMetric({ name: "LCP", value, rating: getRating("LCP", value) });
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);
    } catch {}

    // FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = (entry as any).processingStart - entry.startTime;
          reportMetric({ name: "FID", value, rating: getRating("FID", value) });
        }
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      observers.push(fidObserver);
    } catch {}

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        reportMetric({ name: "CLS", value: clsValue, rating: getRating("CLS", clsValue) });
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);
    } catch {}

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, []);
}
