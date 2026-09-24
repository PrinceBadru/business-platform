import { getCurrentSession } from '@/modules/auth/session';
import { can } from './can';
import { Permission } from './permissions';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden');
    this.name = 'ForbiddenError';
  }
}

/**
 * Higher-order function wrapping a Server Action.
 * Guarantees that the currently authenticated user holds the required permission 
 * for the current session's active account context before the action executes.
 */
export function requirePermission(permission: Permission) {
  return async function <T>(action: () => Promise<T>): Promise<T> {
    const session = await getCurrentSession();
    
    if (!session) {
      throw new UnauthorizedError();
    }
    
    if (!session.accountId) {
      throw new ForbiddenError(); // User has not selected a tenant context
    }

    const allowed = await can(session.userId, session.accountId, permission);
    
    if (!allowed) {
      throw new ForbiddenError();
    }
    
    return action();
  };
}
