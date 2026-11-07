export interface AccessTokenService {
  sign(input: { userId: string; roles: string[]; sessionId: string }): Promise<string>;
  verify(token: string): Promise<{ userId: string; sessionId: string }>;
}
