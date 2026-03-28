import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { User } from '@/models';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  department: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

export async function setAuthCookie(token: string, keepSignedIn = false) {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    ...(keepSignedIn ? { maxAge } : {}),
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export function authError(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenError(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFoundError(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireAuth(allowedRoles?: string[]): Promise<AuthUser | NextResponse> {
  await connectDB();
  const user = await getAuthUser();
  
  if (!user) {
    return authError('Please login to continue');
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return forbiddenError('You do not have permission to access this resource');
  }
  
  return user;
}

export function generateEmployeeId(): string {
  const prefix = 'SH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export function generateMRN(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MRN-${year}-${random}`;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}-${month}${random}`;
}
