import {RuleViolation} from './errors';

export type AccountLocale = 'en' | 'fr';

export interface RegistrationInput {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly locale: AccountLocale;
}

export type ValidatedRegistration = RegistrationInput;

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAccountLocale(value: unknown): AccountLocale {
  return value === 'fr' ? 'fr' : 'en';
}

export function validateDisplayName(value: string) {
  const displayName = value.trim().replace(/\s+/g, ' ');
  if (displayName.length < 2 || displayName.length > 120) {
    throw new RuleViolation(
      'account.display_name',
      'An account display name must contain between 2 and 120 characters'
    );
  }
  return displayName;
}

export function validateEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !SIMPLE_EMAIL.test(email)) {
    throw new RuleViolation('account.email', 'Enter a valid email address');
  }
  return email;
}

export function validatePassword(value: string) {
  if (value.length < 8 || value.length > 128 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new RuleViolation(
      'account.password',
      'A password must contain 8 to 128 characters, including a letter and a number'
    );
  }
  return value;
}

export function validateRegistration(input: RegistrationInput): ValidatedRegistration {
  return {
    displayName: validateDisplayName(input.displayName),
    email: validateEmail(input.email),
    password: validatePassword(input.password),
    locale: normalizeAccountLocale(input.locale)
  };
}
