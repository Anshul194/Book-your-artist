import Admin from "../models/admin.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

class AdminRepository {
  async findByEmail(email) {
    try {
      return await Admin.findOne({ email }).populate("role", "name permissions").populate("type", "title");
    } catch (error) {
      throw new Error("Failed to find admin by email");
    }
  }

async createAdmin(adminData) {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(adminData.password, salt);
    const admin = new Admin({
      ...adminData,
      password: hashedPassword,
      role: adminData.role || "admin",
    });
    return await admin.save();
  } catch (error) {
    throw new Error("Failed to create admin");
  }
}



 async findAllAdmins({ page = 1, limit = 10, search = "", role, sortBy = "createdAt", order = "desc" }) {
  try {
    const filter = {};

    if (search) {
      filter.email = { $regex: search, $options: "i" };
    }

    if (role) {
      filter.role = role;
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const admins = await Admin.find(filter)
      .select("-password")
      .populate("role", "name permissions")
      .populate("type", "title")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Admin.countDocuments(filter);

    return {
      admins,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error("Failed to fetch filtered admins");
  }
}






async findAdminById(id) {
  try {
    return await Admin.findById(id).select("-password").populate("type", "title")
  .populate("role", "name permissions");
  } catch (error) {
    throw new Error("Failed to fetch admin by ID");
  }
}

async deleteAdminById(id) {
  try {
    return await Admin.findByIdAndDelete(id).select("-password");
  } catch (error) {
    throw new Error("Failed to delete admin by ID");
  }
}
async updateAdminById(id, updateData) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid admin ID");
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .select("-password")
      .populate("role", "name permissions")
      .populate("type", "title");

    if (!updatedAdmin) {
      throw new Error("Admin not found");
    }

    return updatedAdmin;
  } catch (error) {
    console.error("🔥 Error in updateAdminById:", error);
    throw error;
  }
}



}



export default AdminRepository;
