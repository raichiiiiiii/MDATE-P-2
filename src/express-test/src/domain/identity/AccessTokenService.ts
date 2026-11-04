export interface AccessTokenService {
  sign(input: { userId: string; roles: string[] }): Promise<string>;
  verify(token: string): Promise<{ userId: string }>;
}
