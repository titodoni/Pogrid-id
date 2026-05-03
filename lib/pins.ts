import bcrypt from 'bcryptjs';

const EASY_PINS = ['2468', '1357', '3691', '2580', '1470', '8642', '7531', '1590', '4812', '7263'] as const;

export function isFourDigitPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

export function isSixDigitPin(pin: string) {
  return /^\d{6}$/.test(pin);
}

export function generateEasyPin() {
  return EASY_PINS[Math.floor(Math.random() * EASY_PINS.length)];
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}

export async function compareSuperadminPin(pin: string) {
  const configuredPin = process.env.SUPER_ADMIN_PIN;
  if (!configuredPin || !isSixDigitPin(pin)) return false;

  if (configuredPin.startsWith('$2')) {
    return bcrypt.compare(pin, configuredPin);
  }

  return configuredPin === pin;
}
