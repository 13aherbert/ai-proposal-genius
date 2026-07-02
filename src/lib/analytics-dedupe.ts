// Shared state so useSEO and useAnalytics can coordinate GA4 pageviews:
// useSEO fires the pageview with the correct title as soon as it writes
// <title>; useAnalytics's route-change fallback skips paths already tracked.
export const seoTracking = {
  lastTrackedPath: "" as string,
};
