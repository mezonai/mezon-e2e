
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export enum UserRole {
  // ADMIN = "admin",
  // USER = "user", 
  // MODERATOR = "moderator",
  // GUEST = "guest"
}

// Test data types
export interface TestData {
  users: User[];
  environment: string;
  baseUrl: string;
}

// Page types
export interface PageInfo {
  title: string;
  url: string;
  path: string;
}

// Component types
export interface ComponentLocators {
  [key: string]: string;
}

// API types
export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
  error?: string;
}

// Test result types
export interface TestResult {
  testName: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

// Environment types
export interface Environment {
  name: string;
  baseUrl: string;
  apiUrl: string;
  dbUrl?: string;
  credentials: {
    admin: User;
    user: User;
  };
}