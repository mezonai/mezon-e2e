/**
 * Common operation result type for better error handling
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Domain-specific data types
 */
export interface ClanCreationData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  avatar?: string;
}

export interface ChannelCreationData {
  name: string;
  type: 'text' | 'voice' | 'stream';
  description?: string;
  isPrivate?: boolean;
  category?: string;
}

export interface UserInvitationData {
  username?: string;
  email?: string;
  role?: 'member' | 'admin' | 'moderator';
}

export interface MessageData {
  content: string;
  attachments?: string[];
  type?: 'text' | 'image' | 'file';
}

/**
 * Test execution context
 */
export interface TestContext {
  testId: string;
  browser: string;
  viewport: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  environment: 'local' | 'dev' | 'staging' | 'prod';
}

/**
 * Test step definition
 */
export interface TestStep<T = void> {
  name: string;
  description?: string;
  preconditions?: string[];
  expectedResult?: string;
  action: () => Promise<T>;
}

/**
 * Error types for better categorization
 */
export enum ErrorType {
  UI_INTERACTION_FAILED = 'UI_INTERACTION_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
}

/**
 * Custom test error class
 */
export class TestOperationError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorType,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TestOperationError';
  }
}
