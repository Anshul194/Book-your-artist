import AdminService from "../service/adminService.js";
import { Token } from "../utils/index.js";
// import { initRedis } from "../config/redisClient.js"; // Remove redis import
import { logAdminActivity } from "../utils/adminLogger.js";
import Role from "../models/Role.js";

const adminService = new AdminService();



export const AdminSignup = async (req, res) => {
  try {
    const { email, password,role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        data: {},
        err: "Missing credentials",
      });
    }

    const newAdmin = await adminService.signup(email, password,role);

    // Optionally, you can generate tokens immediately after signup:
    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } = await Token.generateTokens(newAdmin);

    // Remove redis logic
    // const redis = await initRedis();
    // let accessTTL = Math.floor((accessTokenExp - Date.now()) / 1000);
    // let refreshTTL = Math.floor((refreshTokenExp - Date.now()) / 1000);
    // accessTTL = Number.isFinite(accessTTL) && accessTTL > 0 ? accessTTL : 3600;
    // refreshTTL = Number.isFinite(refreshTTL) && refreshTTL > 0 ? refreshTTL : 604800;
    // await redis.setEx(`accessToken:${accessToken}`, accessTTL, "valid");
    // await redis.setEx(`refreshToken:${refreshToken}`, refreshTTL, newAdmin._id.toString());
    // await redis.setEx(`admin:${newAdmin._id.toString()}`, 3600, JSON.stringify({
    //   _id: newAdmin._id,
    //   email: newAdmin.email,
    //   role: newAdmin.role,
    //   createdAt: newAdmin.createdAt,
    //   updatedAt: newAdmin.updatedAt,
    // }));

    // Set HTTP-only cookies for tokens (same as login)
    const currentTime = Date.now();
    const accessMaxAge = Math.max(3600000, accessTokenExp - currentTime);
    const refreshMaxAge = Math.max(604800000, refreshTokenExp - currentTime);

    Token.setTokensCookies(res, accessToken, refreshToken, accessMaxAge, refreshMaxAge);

    const adminResponse = { ...newAdmin.toObject() };
    delete adminResponse.password;

    return res.status(201).json({
      success: true,
      message: "✅ Admin signup successful",
      data: {
        admin: adminResponse,
        tokens: { accessToken, refreshToken },
      },
      err: {},
    });
  } catch (err) {
    console.error("❌ Admin Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error during admin signup",
      data: {},
      err: err.message,
    });
  }
};

const getClientIP = (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // x-forwarded-for can be a list of IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  // fallback to req.ip
  return req.ip;
};


// export const AdminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//         data: {},
//         err: "Missing credentials",
//       });
//     }

//     const admin = await adminService.login(email, password);

//     if (!admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//         data: {},
//         err: "Authentication failed",
//       });
//     }

//       // ✅ Log the login activity
//         await logAdminActivity({
//           adminId: admin._id,
//           action: "login",
//           ip: req.ip,
//           userAgent: req.get("User-Agent")
//         });


//     const adminId = admin._id.toString();

//     const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } = await Token.generateTokens(admin);

//     const redis = await initRedis();

//     let accessTTL = Math.floor((accessTokenExp - Date.now()) / 1000);
//     let refreshTTL = Math.floor((refreshTokenExp - Date.now()) / 1000);
//     accessTTL = Number.isFinite(accessTTL) && accessTTL > 0 ? accessTTL : 3600;
//     refreshTTL = Number.isFinite(refreshTTL) && refreshTTL > 0 ? refreshTTL : 604800;

//     await redis.setEx(`accessToken:${accessToken}`, accessTTL, "valid");
//     await redis.setEx(`refreshToken:${refreshToken}`, refreshTTL, adminId);

//     // Cache admin data in Redis (1 hour)
//     await redis.setEx(`admin:${adminId}`, 3600, JSON.stringify({
//       _id: admin._id,
//       email: admin.email,
//       role: admin.role,
//       createdAt: admin.createdAt,
//       updatedAt: admin.updatedAt,
//     }));

//     // Set HTTP-only cookies
//     const currentTime = Date.now();
//     const accessMaxAge = Math.max(3600000, accessTokenExp - currentTime);
//     const refreshMaxAge = Math.max(604800000, refreshTokenExp - currentTime);

//     Token.setTokensCookies(res, accessToken, refreshToken, accessMaxAge, refreshMaxAge);

//     const adminResponse = { ...admin.toObject() };
//     delete adminResponse.password;

//     return res.status(200).json({
//       success: true,
//       message: "✅ Admin login successful",
//       data: {
//         admin: adminResponse,
//         tokens: { accessToken, refreshToken },
//       },
//       err: {},
//     });

//   } catch (err) {
//     console.error("❌ Admin Login Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during admin login",
//       data: {},
//       err: err.message,
//     });
//   }
// };

// Helper function to get real client IP address
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;

  if (ip) {
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
  } else {
    ip = 'unknown';
  }
  return ip;
}

export const AdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        data: {},
        err: "Missing credentials",
      });
    }

    const admin = await adminService.login(email, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        data: {},
        err: "Authentication failed",
      });
    }

    // Use helper to get real IP
    const ip = getClientIp(req);

    // Log the login activity with IP and User-Agent
    await logAdminActivity({
      adminId: admin._id,
      action: "login",
      ip,
      userAgent: req.get("User-Agent"),
    });

    const adminId = admin._id.toString();

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } = await Token.generateTokens(admin);

    // Remove redis logic
    // const redis = await initRedis();
    // let accessTTL = Math.floor((accessTokenExp - Date.now()) / 1000);
    // let refreshTTL = Math.floor((refreshTokenExp - Date.now()) / 1000);
    // accessTTL = Number.isFinite(accessTTL) && accessTTL > 0 ? accessTTL : 3600;
    // refreshTTL = Number.isFinite(refreshTTL) && refreshTTL > 0 ? refreshTTL : 604800;
    // await redis.setEx(`accessToken:${accessToken}`, accessTTL, "valid");
    // await redis.setEx(`refreshToken:${refreshToken}`, refreshTTL, adminId);
    // await redis.setEx(`admin:${adminId}`, 3600, JSON.stringify({
    //   _id: admin._id,
    //   email: admin.email,
    //   role: admin.role,
    //   createdAt: admin.createdAt,
    //   updatedAt: admin.updatedAt,
    // }));

    // Set HTTP-only cookies
    const currentTime = Date.now();
    const accessMaxAge = Math.max(3600000, accessTokenExp - currentTime);
    const refreshMaxAge = Math.max(604800000, refreshTokenExp - currentTime);

    Token.setTokensCookies(res, accessToken, refreshToken, accessMaxAge, refreshMaxAge);

    const adminResponse = { ...admin.toObject() };
    delete adminResponse.password;

    return res.status(200).json({
      success: true,
      message: "✅ Admin login successful",
      data: {
        admin: adminResponse,
        tokens: { accessToken, refreshToken },
      },
      err: {},
    });

  } catch (err) {
    console.error("❌ Admin Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin login",
      data: {},
      err: err.message,
    });
  }
};

export const AdminSignupWithRole = async (req, res) => {
  try {
    console.log("AdminSignupWithRole Request Body:", req.body);
    
    const { email, password, role, name, type, isSuper_Admin  } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
        data: {},
        err: "Missing required fields",
      });
    }

    // 🔍 Ensure role exists
    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
        data: {},
        err: "Invalid role",
      });
    }

    // ✅ Create new admin
    const newAdmin = await adminService.signupWithRole(email, password, role, name, type , isSuper_Admin);

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      await Token.generateTokens(newAdmin);

    const currentTime = Date.now();
    const accessMaxAge = Math.max(3600000, accessTokenExp - currentTime);
    const refreshMaxAge = Math.max(604800000, refreshTokenExp - currentTime);

    Token.setTokensCookies(res, accessToken, refreshToken, accessMaxAge, refreshMaxAge);

    const adminResponse = { ...newAdmin.toObject() };
    delete adminResponse.password;

    return res.status(201).json({
      success: true,
      message: "✅ Admin signup (versioned) successful",
      data: {
        admin: adminResponse,
        tokens: { accessToken, refreshToken },
      },
      err: {},
    });

  } catch (err) {
    if (err.message === "Admin with this email already exists") {
      return res.status(409).json({
        success: false,
        message: "Admin already exists with this email",
        data: {},
        err: err.message,
      });
    }

    console.error("❌ Admin Signup With Role Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during versioned admin signup",
      data: {},
      err: err.message,
    });
  }
};





export const getAllAdmins = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const params = { page, limit, search, role, sortBy, order };

    // You can optionally cache based on query string (skip cache for now if filtering is dynamic)
    const adminsData = await adminService.getAllAdmins(params);

    return res.status(200).json({
      success: true,
      message: "✅ Admins fetched with filters",
      data: adminsData,
      err: {},
    });
  } catch (err) {
    console.error("❌ Get All Admins Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admins",
      data: [],
      err: err.message,
    });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    // Remove redis logic
    // const redis = await initRedis();
    // const cacheKey = `admin:${id}`;
    // const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "✅ Admin fetched from cache",
    //     data: JSON.parse(cached),
    //     err: {},
    //   });
    // }

    const admin = await adminService.getAdminById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
        data: {},
        err: "Not found",
      });
    }

    // await redis.setEx(cacheKey, 3600, JSON.stringify(admin));

    return res.status(200).json({
      success: true,
      message: "✅ Admin fetched successfully",
      data: admin,
      err: {},
    });
  } catch (err) {
    console.error("❌ Get Admin By ID Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admin",
      data: {},
      err: err.message,
    });
  }
};

export const deleteAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAdmin = await adminService.deleteAdminById(id);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or already deleted",
        data: {},
        err: "Not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Admin deleted successfully",
      data: deletedAdmin,
      err: {},
    });
  } catch (err) {
    console.error("❌ Delete Admin Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting admin",
      data: {},
      err: err.message,
    });
  }
};


export const updateAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedAdmin = await adminService.updateAdminById(id, updateData);

    return res.status(200).json({
      success: true,
      message: "✅ Admin updated successfully",
      data: updatedAdmin,
      err: {},
    });
  } catch (err) {
    console.error("❌ Admin Update Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin update",
      data: {},
      err: err.message,
    });
  }
};
