import Role from '../models/Role.js';

export async function isAdmin(req, res, next) {
  try {
    let roleDoc = null;
    if (req.user && req.user.role) {
      if (typeof req.user.role === 'object' && req.user.role.name) {
        roleDoc = req.user.role;
      } else {
        roleDoc = await Role.findById(req.user.role);
      }
    }
    if (roleDoc && roleDoc.name) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied, admin only.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error in isAdmin middleware.' });
  }
}
