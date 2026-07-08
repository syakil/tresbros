import { useAuthStore } from '@/store/useAuthStore';

export function hasPermission(permission: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user?.role?.permissions) return false;
  return user.role.permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(p));
}

export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(p));
}

export function isAdmin(): boolean {
  const user = useAuthStore.getState().user;
  return user?.role?.name === 'ADMIN';
}
