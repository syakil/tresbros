import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const permissions = useMemo(() => {
    return user?.role?.permissions ?? [];
  }, [user]);

  const has = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAny = (perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const isAdmin = user?.role?.name === 'ADMIN';

  return { permissions, has, hasAny, isAdmin };
}
