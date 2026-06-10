import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    req.auth = { userId: null };
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: payload.sub, userRole: payload.role };
  } catch {
    req.auth = { userId: null };
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
  return (req, res, next) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (!roles.includes(req.auth.userRole)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}
