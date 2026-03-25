export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
