export const AccessRole = {
  MASTER: "MASTER", ADMIN: "ADMIN", USER: "USER"
} as const;
export type AccessRole = (typeof AccessRole)[keyof typeof AccessRole];

export const ValidationStatus = {
  VALID: "VALID", NOT_VALID: "NOT_VALID"
} as const;
export type ValidationStatus = (typeof ValidationStatus)[keyof typeof ValidationStatus];

export interface User {
  id: string;
  name: string;
  email: string;
  access: AccessRole;
  valid: ValidationStatus;
  approvalLevel: number;
  firstLogin: boolean;
  areaId: string | null;
  areaName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}

export interface Area {
  id: string;
  name: string;
}