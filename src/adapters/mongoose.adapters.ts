import { UserAdapter } from "./useradapter";
import { User } from "../models/user.model";

export class MongooseUserAdapter implements UserAdapter {
  private toPlain(doc: any) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : doc;
    return { ...obj, id: obj._id.toString() };
  }

  // ---- core CRUD ----

  async findById(id: string) {
    return this.toPlain(await User.findById(id));
  }

  async findByEmail(email: string, tenantId: string) {
    return this.toPlain(await User.findOne({ email, tenantId }));
  }

  async create(user: Partial<{
    email: string;
    password: string;
    tenantId: string;
    verified: boolean;
    provider: string;
  }>) {
    return this.toPlain(await User.create(user));
  }

  async update(id: string, data: any) {
    return this.toPlain(await User.findByIdAndUpdate(id, data, { new: true }));
  }

  // ---- verification tokens ----

  async addVerificationToken(userId: string, token: { token: string; expiresAt: Date }) {
    return this.toPlain(
      await User.findByIdAndUpdate(
        userId,
        { $push: { verificationTokens: token } },
        { new: true }
      )
    );
  }

  async findByVerificationToken(hashedToken: string, tenantId: string) {
    return this.toPlain(
      await User.findOne({ tenantId, "verificationTokens.token": hashedToken })
    );
  }

  async removeVerificationToken(userId: string, hashedToken: string) {
    return this.toPlain(
      await User.findByIdAndUpdate(
        userId,
        { $pull: { verificationTokens: { token: hashedToken } } },
        { new: true }
      )
    );
  }

  // ---- sessions / refresh tokens ----

  async addSession(
    userId: string,
    session: { token: string; createdAt: Date; expiresAt: Date; used: boolean }
  ) {
    return this.toPlain(
      await User.findByIdAndUpdate(
        userId,
        { $push: { refreshTokens: session } },
        { new: true }
      )
    );
  }

  async findSession(userId: string, hashedToken: string) {
    const user = await User.findOne({
      _id: userId,
      "refreshTokens.token": hashedToken,
    });
    if (!user) return null;
    return user.refreshTokens.find((t) => t.token === hashedToken) ?? null;
  }

  async markSessionUsed(userId: string, hashedToken: string) {
    return this.toPlain(
      await User.findOneAndUpdate(
        { _id: userId, "refreshTokens.token": hashedToken },
        { $set: { "refreshTokens.$.used": true } },
        { new: true }
      )
    );
  }
}