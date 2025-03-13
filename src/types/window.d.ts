
interface Auth {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Window {
  auth?: Auth;
  featureCache?: Map<string, boolean>;
  projectLimitCache?: Map<string, number>;
  [key: string]: any;
}
