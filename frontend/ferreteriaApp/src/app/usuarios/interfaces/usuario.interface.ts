export interface Usuario {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SELLER';
  isActive: boolean;
  createdAt: string;
}

export interface CreateUsuarioRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: 'ADMIN' | 'SELLER';
}

export interface UpdateStatusRequest {
  isActive: boolean;
}
