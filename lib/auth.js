import jwt      from 'jsonwebtoken'
import bcrypt   from 'bcryptjs'
import { NextResponse } from 'next/server'

const JWT_SECRET  = process.env.JWT_SECRET
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

// ── PASSWORD ──────────────────────────────────────────────

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

// ── JWT ───────────────────────────────────────────────────

export function signToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not set')
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not set')
  return jwt.verify(token, JWT_SECRET)        // throws on invalid/expired
}

// ── Extract token from Authorization header ───────────────
export function extractToken(request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

// ── Route guard — use in every protected API route ────────
//
// Usage:
//   const { tenant, error } = await requireAuth(request)
//   if (error) return error   // NextResponse with 401
//   // tenant.id, tenant.email, etc.
//
export async function requireAuth(request) {
  const token = extractToken(request)
  if (!token) {
    return {
      tenant: null,
      error: NextResponse.json({ error: 'No token provided' }, { status: 401 }),
    }
  }
  try {
    const payload = verifyToken(token)
    return { tenant: payload, error: null }
  } catch (e) {
    return {
      tenant: null,
      error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    }
  }
}

// ── Simple API key encryption (XOR + base64, good enough for MVP) ─────
// For production, use AWS KMS or Supabase Vault.
const ENC_KEY = () => {
  const k = process.env.JWT_SECRET || 'fallback'
  return k.repeat(Math.ceil(64 / k.length)).slice(0, 64)
}

export function encryptKey(plain) {
  const key = ENC_KEY()
  const buf = Buffer.from(plain, 'utf8')
  const enc = buf.map((b, i) => b ^ key.charCodeAt(i % key.length))
  return enc.toString('base64')
}

export function decryptKey(encoded) {
  const key = ENC_KEY()
  const buf = Buffer.from(encoded, 'base64')
  const dec = buf.map((b, i) => b ^ key.charCodeAt(i % key.length))
  return dec.toString('utf8')
}
