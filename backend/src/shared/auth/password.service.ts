import bcrypt from "bcrypt"

const SALT_ROUNDS = 10

export const passwordService = {
  /**
   * Hash a plain text password
   */
  hash: async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS)
  },

  /**
   * Verify a password against a hash
   */
  verify: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
  },
}
