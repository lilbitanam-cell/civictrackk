export * from "./database";

// Navigation item type used across municipal UI shells
export interface NavigationItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
}

// Service response wrapper
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
