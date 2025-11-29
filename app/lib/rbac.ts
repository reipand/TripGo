import { supabase } from './supabaseClient';

export type UserRole = 'user' | 'admin' | 'super_admin' | 'customer_service' | 'finance';

export interface RolePermissions {
  users: boolean;
  bookings: boolean;
  flights: boolean;
  trains: boolean;
  payments: boolean;
  reports: boolean;
  admin: boolean;
  all: boolean;
}

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    users: false,
    bookings: false,
    flights: false,
    trains: false,
    payments: false,
    reports: false,
    admin: false,
    all: false,
  },
  admin: {
    users: true,
    bookings: true,
    flights: true,
    trains: true,
    payments: true,
    reports: true,
    admin: false,
    all: false,
  },
  super_admin: {
    users: true,
    bookings: true,
    flights: true,
    trains: true,
    payments: true,
    reports: true,
    admin: true,
    all: true,
  },
  customer_service: {
    users: true,
    bookings: true,
    flights: false,
    trains: false,
    payments: false,
    reports: false,
    admin: false,
    all: false,
  },
  finance: {
    users: false,
    bookings: true,
    flights: false,
    trains: false,
    payments: true,
    reports: true,
    admin: false,
    all: false,
  },
};

// Get user role from database
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return (data.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Check if user has permission
export async function hasPermission(
  userId: string,
  permission: keyof RolePermissions
): Promise<boolean> {
  const role = await getUserRole(userId);
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  return permissions.all || permissions[permission] === true;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin' || role === 'super_admin';
}

// Check if user is super admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'super_admin';
}

// Server-side helper for API routes
export async function checkAdminAccess(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  return await isAdmin(userId);
}

// Get user from request headers (for API routes)
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

