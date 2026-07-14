export interface UserAdapter {
  findById(id: string): Promise<any>;
  findByEmail(email: string, tenantId: string): Promise<any>;
  create(user: Partial<{
    email: string;
    password: string;
    tenantId: string;
    verified: boolean;
    provider: string;
  }>): Promise<any>;
  update(id: string, data: any): Promise<any>;

  // verification tokens — was inline array mutation on the Mongoose doc, now explicit
  addVerificationToken(userId: string, token: { token: string; expiresAt: Date }): Promise<any>;
  findByVerificationToken(hashedToken: string, tenantId: string): Promise<any>;
  removeVerificationToken(userId: string, hashedToken: string): Promise<any>;

  // sessions / refresh tokens — same idea
  addSession(userId: string, session: { token: string; createdAt: Date; expiresAt: Date; used: boolean }): Promise<any>;
  findSession(userId: string, hashedToken: string): Promise<any>;
  markSessionUsed(userId: string, hashedToken: string): Promise<any>;
}