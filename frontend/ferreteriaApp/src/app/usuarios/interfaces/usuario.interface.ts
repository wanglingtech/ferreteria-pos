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

// ✅ NUEVO: Para editar usuario
export interface UpdateUsuarioRequest {
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SELLER';
  password?: string; // opcional
}
