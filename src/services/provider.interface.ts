export type OAuthProvider = "google" | "github";

export interface OAuthProviderHandler {
  getAuthUrl(): string;
  getUser(code: string): Promise<{ email: string; name?: string; avatar?: string }>;
}