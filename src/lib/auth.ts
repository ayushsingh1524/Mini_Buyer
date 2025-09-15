import { NextRequest } from 'next/server';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Simple demo authentication - in production, use proper auth like NextAuth.js
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  // For demo purposes, we'll use a simple session approach
  // In production, implement proper JWT or session management
  const userId = request.cookies.get('user-id')?.value;
  
  if (!userId) {
    return null;
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user[0] || null;
  } catch {
    return null;
  }
}

export async function createDemoUser(email: string, name?: string): Promise<User> {
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser[0]) {
    return existingUser[0];
  }

  const newUser = await db.insert(users).values({
    email,
    name,
  }).returning();

  return newUser[0];
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
