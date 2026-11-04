export interface PasswordResetMailer {
  send(email: string, resetUrl: string): Promise<void>;
}
