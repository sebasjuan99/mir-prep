import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.FLASHCARD_ENCRYPTION_KEY
  if (!secret || secret.trim().length === 0) {
    throw new Error('FLASHCARD_ENCRYPTION_KEY env var is not set')
  }
  // SHA-256 always produces exactly 32 bytes — accepts any string value
  return createHash('sha256').update(secret.trim()).digest()
}

export function encryptApiKey(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptApiKey(stored: string): string {
  const key = getKey()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted key format')
  const [ivHex, tagHex, cipherHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(cipherHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  try {
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    throw new Error('Decryption failed — key may be invalid or data corrupted')
  }
}
