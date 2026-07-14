import { EmailAdapter } from "./types";
import { Resend } from "resend";

export class ResendAdapter implements EmailAdapter {
  private client: Resend;

  constructor(apiKey: string, private from: string) {
    this.client = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
  }
}