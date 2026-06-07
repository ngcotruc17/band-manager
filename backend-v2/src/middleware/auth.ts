import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456') as { id: string };

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: "Không tìm thấy người dùng" });
      }

      req.user = user as IUser;

      if (!req.user.isApproved && req.user.role !== 'admin') {
         return res.status(403).json({ message: "Tài khoản chưa được duyệt." });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }
};

export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ message: "Chỉ Admin mới có quyền này" });
  }
};
