import crypto from 'crypto';

export const genpass = () => {
  return crypto.randomBytes(8).toString('hex');
}
