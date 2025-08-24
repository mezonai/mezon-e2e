import { faker } from '@faker-js/faker';

/**
 * User Data Factory
 * Generates dynamic test data for user-related tests
 */
export class UserFactory {
  /**
   * Generate user credentials for login
   */
  static generateLoginCredentials(): {
    email: string;
    password: string;
  } {
    return {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    };
  }

  /**
   * Generate signup data (name and email)
   */
  static generateSignupData(): {
    name: string;
    email: string;
  } {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    };
  }

  /**
   * Generate complete registration data
   */
  static generateCompleteRegistrationData(): {
    title: 'Mr' | 'Mrs';
    name: string;
    email: string;
    password: string;
    dateOfBirth: {
      day: string;
      month: string;
      year: string;
    };
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    mobileNumber: string;
    newsletter: boolean;
    specialOffers: boolean;
  } {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });

    return {
      title: faker.helpers.arrayElement(['Mr', 'Mrs'] as const),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password({ length: 12 }),
      dateOfBirth: {
        day: birthDate.getDate().toString(),
        month: (birthDate.getMonth() + 1).toString(),
        year: birthDate.getFullYear().toString(),
      },
      firstName,
      lastName,
      company: faker.company.name(),
      address1: faker.location.streetAddress(),
      address2: faker.location.secondaryAddress(),
      country: 'India', // Fixed as per website requirement
      state: faker.location.state(),
      city: faker.location.city(),
      zipcode: faker.location.zipCode(),
      mobileNumber: faker.phone.number(),
      newsletter: faker.datatype.boolean(),
      specialOffers: faker.datatype.boolean(),
    };
  }

  /**
   * Generate minimal registration data (required fields only)
   */
  static generateMinimalRegistrationData(): {
    title: 'Mr' | 'Mrs';
    name: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    address1: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    mobileNumber: string;
  } {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      title: faker.helpers.arrayElement(['Mr', 'Mrs'] as const),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password({ length: 12 }),
      firstName,
      lastName,
      address1: faker.location.streetAddress(),
      country: 'India', // Fixed as per website requirement
      state: faker.location.state(),
      city: faker.location.city(),
      zipcode: faker.location.zipCode(),
      mobileNumber: faker.phone.number(),
    };
  }

  /**
   * Generate unique test user for specific test scenario
   */
  static generateTestUser(scenario: string): {
    name: string;
    email: string;
    password: string;
  } {
    const timestamp = Date.now();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      name: `${firstName} ${lastName}`,
      email: `test_${scenario}_${timestamp}_${faker.string.alphanumeric(5)}@automation.test`,
      password: `Test${scenario}123!`,
    };
  }

  /**
   * Generate invalid credentials for negative testing
   */
  static generateInvalidCredentials(): {
    invalidEmail: string;
    invalidPassword: string;
    emptyEmail: string;
    emptyPassword: string;
  } {
    return {
      invalidEmail: 'invalid-email-format',
      invalidPassword: '123', // Too short
      emptyEmail: '',
      emptyPassword: '',
    };
  }

  /**
   * Generate existing user data (for negative testing)
   */
  static generateExistingUserData(): {
    name: string;
    email: string;
  } {
    return {
      name: 'Existing User',
      email: 'existing@example.com', // This should be an existing email in the system
    };
  }

  /**
   * Generate newsletter subscription email
   */
  static generateNewsletterEmail(): string {
    return faker.internet.email();
  }

  /**
   * Generate contact form data
   */
  static generateContactData(): {
    name: string;
    email: string;
    subject: string;
    message: string;
  } {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      subject: faker.lorem.sentence(5),
      message: faker.lorem.paragraphs(2),
    };
  }
}
