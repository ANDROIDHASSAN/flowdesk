import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { sendEmail, emailShell } from './email';

interface NotifyInput {
  businessId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  type: NotificationType;
  message: string;
  email?: { to: string; subject: string; bodyHtml: string };
}

/** Writes an in-app Notification row and (optionally) sends a matching email. */
export async function notify(input: NotifyInput): Promise<void> {
  await Notification.create({
    businessId: input.businessId,
    userId: input.userId,
    type: input.type,
    message: input.message,
  });
  if (input.email) {
    await sendEmail(input.email.to, input.email.subject, emailShell(input.email.subject, input.email.bodyHtml));
  }
}
