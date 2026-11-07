export interface EmailChangeMailer {
  sendVerification(email: string, verificationUrl: string): Promise<void>;
  notifyChanged(oldEmail: string, newEmail: string): Promise<void>;
}
