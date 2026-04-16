import jwt      from 'jsonwebtoken'
import bcrypt   from 'bcryptjs'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

export function signSuperAdminToken(payload) {
  return jwt.sign({ ...payload, role: 'superadmin_user' }, JWT_SECRET, { expiresIn: '8h' })
}

export function verifySuperAdminToken(token) {
  const payload = jwt.verify(token, JWT_SECRET)
  if (!payload.role?.startsWith('superadmin')) throw new Error('Not a superadmin token')
  return payload
}

export function extractToken(request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function requireSuperAdmin(request, allowedRoles = null) {
  const token = extractToken(request)
  if (!token) return { admin: null, error: NextResponse.json({ error: 'No token provided' }, { status: 401 }) }
  try {
    const payload = verifySuperAdminToken(token)
    if (allowedRoles && !allowedRoles.includes(payload.adminRole)) {
      return { admin: null, error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
    }
    return { admin: payload, error: null }
  } catch (e) {
    return { admin: null, error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) }
  }
}

export const hashPassword   = (p) => bcrypt.hash(p, 12)
export const verifyPassword = (p, h) => bcrypt.compare(p, h)

export const ROLES = {
  superadmin: { label:'Super Admin', color:'#F87171', permissions:['tenants','leads','conversations','analytics','team','settings','impersonate','billing'] },
  support:    { label:'Support',     color:'#4F8EF7', permissions:['tenants','leads','conversations','impersonate'] },
  billing:    { label:'Billing',     color:'#FBBF24', permissions:['tenants','billing','analytics'] },
  readonly:   { label:'Read Only',   color:'#6E7E9E', permissions:['tenants','leads','conversations','analytics'] },
}

export function hasPermission(adminRole, permission) {
  return ROLES[adminRole]?.permissions.includes(permission) || false
}
