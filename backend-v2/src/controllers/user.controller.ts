import { Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: "Người dùng không tồn tại" });
      return;
    }

    user.fullName = req.body.fullName || user.fullName;
    user.phone = req.body.phone || user.phone;
    user.instrument = req.body.instrument || user.instrument;

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        res.status(400).json({ message: "Email này đã được sử dụng bởi tài khoản khác." });
        return;
      }
      user.email = req.body.email;
    }

    const updatedUser = await user.save();
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : "";

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      instrument: updatedUser.instrument,
      token
    });
    
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
