import crypto from 'crypto';

export const genticket = (): string => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}
