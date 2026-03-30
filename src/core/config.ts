export interface AuthConfig {
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn?: string;
  refreshSecret?: string;
}
let config: AuthConfig;

export const setConfig = (cfg: AuthConfig) => {
  config = cfg;
};

export const getConfig = () => {
  if (!config) throw new Error("Auth SDK not initialized");
  return config;
};