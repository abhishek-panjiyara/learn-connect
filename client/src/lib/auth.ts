import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  role: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await apiRequest("POST", "/api/auth/login", credentials);
    return res.json();
  },

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout", {});
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiRequest("GET", "/api/auth/me", undefined);
    return res.json();
  },

  async register(data: RegisterData): Promise<User> {
    const res = await apiRequest("POST", "/api/users/register", data);
    return res.json();
  },
};

export const isTeacher = (user?: User | null): boolean => {
  return user?.role === "teacher";
};

export const isStudent = (user?: User | null): boolean => {
  return user?.role === "student";
};

export const getDisplayRole = (user?: User | null): string => {
  if (!user) return "Guest";
  return user.role === "teacher" ? "Teacher" : "Student";
};
