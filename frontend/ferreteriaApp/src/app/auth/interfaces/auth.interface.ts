export type UserRole = 'ADMIN' | 'SELLER';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginData {
  tokenType: string;
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
}
