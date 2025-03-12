
interface Window {
  featureCache?: Map<string, boolean>;
  projectLimitCache?: Map<string, number>;
  auth?: {
    user?: {
      id: string;
    };
  };
}
