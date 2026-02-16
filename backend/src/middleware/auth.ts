import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

      req.user = await User.findById(decoded.id).select('-password') as IUser;
      if (!req.user) throw new Error('not authorized');

      next();
    } catch(error) {
      res.status(401).json({ message: 'not authorized' });
    }
  } else {
    res.status(401).json({ message: 'no token, not authorized' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `user role ${req.user?.role} is not authorized` 
      });
    }
    next();
  };
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      req.user = await User.findById(decoded.id).select('-password') as IUser;
    } catch(error) {
      // ignore errors, continue wo user
    }
  }
  next();
};
