export interface Usuario {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SELLER';
  isActive: boolean;
  createdAt: string;
  imageUrl?: string; // ✅ nuevo
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

// ✅ Para editar usuario (con imageUrl opcional)
export interface UpdateUsuarioRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'ADMIN' | 'SELLER';
  password?: string;
  imageUrl?: string; // ✅ nuevo
}
