import { clerkClient } from '@clerk/clerk-sdk-node';

export async function clerkMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    req.auth = { userId: null, sessionId: null };
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await clerkClient.verifyToken(token, {
      clockSkewInMs: 600_000,
      jwksCacheTtlInMs: 600_000,
    });
    req.auth = { userId: payload.sub, sessionId: payload.sid };
  } catch (err) {
    console.error('[AUTH]', err.message);
    req.auth = { userId: null, sessionId: null };
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const user = await clerkClient.users.getUser(req.auth.userId);
      const role = user.publicMetadata?.role || 'RECEPTIONIST';
      if (!roles.includes(role)) {
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }
      req.userRole = role;
    } catch {
      return res.status(403).json({ error: 'Error verificando permisos' });
    }
    next();
  };
}
