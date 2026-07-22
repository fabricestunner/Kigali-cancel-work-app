import api from "./api";
import type { Role } from "../utils/auth";

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  role: Role;
}

export const getAllUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>("/auth/users");
  return res.data;
};

// Admin-only registration — the backend's /auth/register issues the account.
export const createUser = async (data: CreateUserDTO): Promise<User> => {
  const res = await api.post<{ user: User }>("/auth/register", data);
  return res.data.user;
};

export const updateUserRole = async (id: string, role: Role): Promise<User> => {
  const res = await api.patch<User>(`/auth/users/${id}`, { role });
  return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/auth/users/${id}`);
};
