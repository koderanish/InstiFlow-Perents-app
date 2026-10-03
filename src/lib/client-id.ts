const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const RANDOM_LENGTH = 20;

/**
 * An id the server can use to recognise a message it has already stored (POST /parent/messages `clientId`).
 * 28 characters: a base-36 timestamp plus 20 random ones. Make one per message and reuse it when retrying.
 * `random` is injectable for tests.
 */
export const makeClientId = (now: number = Date.now(), random: () => number = Math.random): string => {
  let id = Math.max(0, Math.floor(now)).toString(36);
  for (let i = 0; i < RANDOM_LENGTH; i += 1) {
    id += ALPHABET.charAt(Math.floor(random() * ALPHABET.length) % ALPHABET.length);
  }
  return id;
};
