/**
 * Registration-specific types cho AutomationExercise
 */

export interface RegistrationData {
  // Basic signup info
  name: string;
  email: string;
  
  // Account information
  title: 'Mr' | 'Mrs';
  password: string;
  dateOfBirth: {
    day: string;
    month: string;
    year: string;
  };
  newsletter: boolean;
  offers: boolean;
  
  // Address information
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
}

export interface AccountInformation {
  title: 'Mr' | 'Mrs';
  password: string;
  day: string;
  month: string;
  year: string;
  newsletter?: boolean;
  offers?: boolean;
}

export interface AddressInformation {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}

// Constants for dropdown values
export const COUNTRIES = [
  "India",
  "United States", 
  "Canada",
  "Australia",
  "Israel",
  "New Zealand",
  "Singapore"
] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export type Country = typeof COUNTRIES[number];
export type Month = typeof MONTHS[number];