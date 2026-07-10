export interface CreateAdminInput {
  profilepic?: string | null;
  name: string;
  email: string;
  number?: string | null;
  role: string | string[];
  employeeStatus?: "active" | "blocked" | "onHold";
  password?: string | null;
}

export interface AdminPayload {
  id: string;
  name: string;
  email: string;
  username: string;
  profilepic: string | null;
  employeeStatus: string;
  roles: string[];
}

export interface LoginAdminInput {
  email: string;
  password: string;
}

export type UpdateAdminInput = {
  profilepic?: File | null;
  name?: string;
  number?: string | null;
  role?: string[];
  employeeStatus?: "active" | "blocked" | "onHold";
  password?: string | null;
};
