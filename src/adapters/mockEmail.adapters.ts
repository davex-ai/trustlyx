import { EmailAdapter } from "./types";

export class MockEmailAdapter implements EmailAdapter {
  async sendEmail(to: string, subject: string, html: string) {
    console.log("📧 EMAIL SENT:");
    console.log({ to, subject, html });
  }
}