/**
 * Static Test Users Data
 * Contains predefined test users for consistent testing
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestUser {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegistrationTestUser extends TestUser {
  title: 'Mr' | 'Mrs';
  dateOfBirth: {
    day: string;
    month: string;
    year: string;
  };
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
  newsletter?: boolean;
  specialOffers?: boolean;
}

/**
 * Valid test users for login scenarios
 */
export const VALID_TEST_USERS: TestUser[] = [
  {
    name: 'John Doe',
    email: 'john.doe@automation.test',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@automation.test',
    password: 'TestPassword456!',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@automation.test',
    password: 'TestPassword789!',
    firstName: 'Mike',
    lastName: 'Johnson',
  },
];

/**
 * Invalid test credentials for negative testing
 */
export const INVALID_CREDENTIALS = {
  WRONG_EMAIL: {
    email: 'wrong@automation.test',
    password: 'TestPassword123!',
  },
  WRONG_PASSWORD: {
    email: 'john.doe@automation.test',
    password: 'WrongPassword123!',
  },
  INVALID_EMAIL_FORMAT: {
    email: 'invalid-email-format',
    password: 'TestPassword123!',
  },
  EMPTY_CREDENTIALS: {
    email: '',
    password: '',
  },
  EMPTY_EMAIL: {
    email: '',
    password: 'TestPassword123!',
  },
  EMPTY_PASSWORD: {
    email: 'john.doe@automation.test',
    password: '',
  },
};

/**
 * Complete registration test user
 */
export const COMPLETE_REGISTRATION_USER: RegistrationTestUser = {
  title: 'Mr',
  name: 'Test User Complete',
  email: 'test.complete@automation.test',
  password: 'TestPassword123!',
  dateOfBirth: {
    day: '15',
    month: '6',
    year: '1990',
  },
  firstName: 'Test',
  lastName: 'User Complete',
  company: 'Test Company Ltd',
  address1: '123 Test Street',
  address2: 'Apartment 4B',
  country: 'India',
  state: 'California',
  city: 'Los Angeles',
  zipcode: '90210',
  mobileNumber: '+1234567890',
  newsletter: true,
  specialOffers: false,
};

/**
 * Minimal registration test user (required fields only)
 */
export const MINIMAL_REGISTRATION_USER: RegistrationTestUser = {
  title: 'Mrs',
  name: 'Test User Minimal',
  email: 'test.minimal@automation.test',
  password: 'TestPassword456!',
  dateOfBirth: {
    day: '1',
    month: '1',
    year: '1995',
  },
  firstName: 'Test',
  lastName: 'User Minimal',
  address1: '456 Minimal Street',
  country: 'India',
  state: 'Texas',
  city: 'Houston',
  zipcode: '77001',
  mobileNumber: '+0987654321',
};

/**
 * Existing user data for negative testing
 */
export const EXISTING_USER_DATA = {
  name: 'Existing User',
  email: 'existing@automation.test',
};

/**
 * Newsletter subscription test emails
 */
export const NEWSLETTER_TEST_EMAILS = [
  'newsletter1@automation.test',
  'newsletter2@automation.test',
  'newsletter3@automation.test',
];

/**
 * Error messages constants
 */
export const ERROR_MESSAGES = {
  LOGIN_INCORRECT: 'Your email or password is incorrect!',
  EMAIL_EXISTS: 'Email Address already exist!',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
};

/**
 * Success messages constants
 */
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account Created!',
  ACCOUNT_DELETED: 'Account Deleted!',
  SUBSCRIPTION_SUCCESS: 'You have been successfully subscribed!',
  CONTACT_SUCCESS: 'Success! Your details have been submitted successfully.',
};

/**
 * Page titles constants
 */
export const PAGE_TITLES = {
  HOME: 'Mezon',
  LOGIN: 'Sign In - Mezon Account',
  REGISTRATION: 'Sign Up - Mezon Account',
  ACCOUNT_CREATED: 'Account Created!',
  CONTACT_US: 'Mezon - Contact Us',
  PRODUCTS: 'Mezon - All Products',
};

/**
 * URL paths constants
 */
export const URL_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CONTACT_US: '/contact_us',
  PRODUCTS: '/products',
  CART: '/view_cart',
  API_LIST: '/api_list',
};

/**
 * Mezon Test User Interface
 */
export interface MezonTestUser {
  email: string;
  otp: string;
  name?: string;
  role?: string;
  authFile?: string;
}

// Auth file paths
export const authUserFile = path.join(__dirname, '../.auth/user.json');
export const authAdminFile = path.join(__dirname, '../.auth/admin.json');
export const authModeratorFile = path.join(__dirname, '../.auth/moderator.json');

/**
 * Mezon test users with multi-role support
 */
export const MEZON_TEST_USERS = {
  MAIN_USER: {
    email: 'mezontest@gmail.com',
    otp: '578098',
    name: 'Mezon Test User',
    role: 'user',
    authFile: authUserFile,
  },
  user: {
    email: 'mezontest@gmail.com',
    otp: '578098',
    name: 'Mezon Test User',
    role: 'user',
    authFile: authUserFile,
  },
  admin: {
    email: 'mezonadmin@gmail.com',
    otp: '578098',
    name: 'Mezon Admin User',
    role: 'admin',
    authFile: authAdminFile,
  },
  moderator: {
    email: 'mezonmod@gmail.com',
    otp: '578098',
    name: 'Mezon Moderator User',
    role: 'moderator',
    authFile: authModeratorFile,
  },
  member: {
    email: 'tdkien.99.vn@gmail.com',
  },
} as const;

// Export for compatibility with ncc-erp pattern
export const users = MEZON_TEST_USERS;

/**
 * Mezon page titles and messages
 */
export const MEZON_PAGE_TITLES = {
  HOME: 'Mezon',
  LOGIN: 'Sign In - Mezon Account',
} as const;

export const MEZON_MESSAGES = {
  LOGIN_SUCCESS: 'So glad to meet you again!',
  ENTER_EMAIL: 'Enter your email to login',
  SEND_OTP: 'Send OTP',
  LOGIN_WITH_PASSWORD: 'Login with Email & Password',
} as const;

/**
 * Browser viewport configurations
 */
export const VIEWPORT_CONFIGS = {
  DESKTOP: { width: 1920, height: 1080 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
  LARGE_DESKTOP: { width: 2560, height: 1440 },
};
