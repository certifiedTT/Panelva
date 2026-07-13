export interface UserSession {
  userId: string;
  email: string;
  role: string;
  token?: string;
}

export interface IAuthService {
  signUp(email: string, password: string, username?: string): Promise<UserSession>;
  logIn(email: string, password: string): Promise<UserSession>;
  verifyToken(token: string): Promise<UserSession>;
}
