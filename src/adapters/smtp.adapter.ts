import { EmailAdapter } from "./types";
import nodemailer, { Transporter } from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string; // e.g. "Trustlyx <no-reply@yourdomain.com>"
}

export class SmtpAdapter implements EmailAdapter {
  private client: Transporter;
  private from: string;

  constructor(config: SmtpConfig) {
    this.client = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: config.auth,
    });
    this.from = config.from;
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.client.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });
  }
}