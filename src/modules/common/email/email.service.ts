import { Injectable } from '@nestjs/common';
import { resend } from 'src/lib/resend';

@Injectable()
export class EmailService {
  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      const response = await resend.emails.send({
        from: 'admin@thepolyclinic.app',
        to: [to],
        subject,
        html,
      });
      console.log('[response]', response);
      console.log(`Email sent successfully to ${to} with subject ${subject}`);
      return response;
    } catch (error) {
      console.error(
        `Error sending email to ${to} with subject ${subject}`,
        error,
      );
      throw error;
    }
  }
}
