import GarbaClassService from "../service/garbaClassService.js";
import { initRedis } from "../config/redisClient.js";
import { garbaClassCreateValidator, garbaClassUpdateValidator } from "../validations/garbaClassValidation.js";
import GarbaClass from "../models/garbaClass.js";
import Ticket from "../models/Ticket.js"; // Assuming you have a Ticket model for fetching prices
import Event from "../models/Event.js"; // Assuming you have an Event model for fetching event details
import Admin from '../models/admin.js';
import Category from '../models/Category.js'; // Assuming you have a Category model for fetching event details
import mongoose from 'mongoose';

const garbaClassService = new GarbaClassService();

// ✅ Create
export const createGarbaClass = async (req, res) => {
  try {
    const { error, value } = garbaClassCreateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    const classData = { ...value };
    if (req.file) {
      classData.profilePic = req.file.filename;
    }

    const created = await garbaClassService.createGarbaClass(classData);

    const redis = await initRedis();
    // Delete all cached garba classes list keys
    const keys = await redis.keys("garba-classes:all*");
    if (keys.length) await redis.del(keys);

    res.status(201).json({
      success: true,
      message: "Garba class created successfully.",
      data: created,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get All
export const getAllGarbaClasses = async (req, res) => {
  try {
    console.log("Fetching all garba classes with options:", req.query);
  
    
    const eid = req.query.eid; // Assuming eventId is passed in the URL
    if (!eid) {
      return res.status(400).json({ success: false, message: "Event ID is required" });
    }

    const {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "zoneId",
      sortOrder = "asc",
      blocked,
    } = req.query;

    const filters = {};
    if (blocked !== undefined) filters.blocked = blocked === 'true'; // convert string to boolean

    if(eid) {
      filters.eid = eid; // Filter by eventId if provided 
    }

    const options = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    // const cacheKey = `garba-classes:all:${JSON.stringify(options)}`;
    // const redis = await initRedis();
    // const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Garba classes fetched from cache.",
    //     ...JSON.parse(cached),
    //     fromCache: true,
    //   });
    // }
    // console.log("Fetching from database with options:", options);
    const classes = await garbaClassService.getAllGarbaClasses(options);

    // await redis.setEx(cacheKey, 300, JSON.stringify(classes));

    res.status(200).json({
      success: true,
      message: "Garba classes fetched successfully.",
      ...classes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//app
export const getAllGarbaClasses_admin = async (req, res) => {
  try {
    console.log("Fetching all garba classes with options:", req.query);

    const {
      eid, // now optional
      search = "",
      page = 1,
      limit = 10,
      sortBy = "zoneId",
      sortOrder = "asc",
      blocked,
    } = req.query;

    const filters = {};
    if (blocked !== undefined) filters.blocked = blocked === 'true'; // convert string to boolean

    // Apply event filter only if eid is provided
    if (eid) {
      filters.eid = eid;
    }

    if (req.user && req.user.type) {
      const admin = await Admin.findOne({ _id: req.user.id });
      if (!admin.isSuper_Admin) {
        const type = req.user.type;
        const event = await Event.findOne({ category: type });
        console.log("Event found:", event);
        filters.eid = new mongoose.Types.ObjectId(event._id);
      }
    }

    const options = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    const classes = await garbaClassService.getAllGarbaClasses(options);

    res.status(200).json({
      success: true,
      message: "Garba classes fetched successfully.",
      ...classes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get by ID
export const getGarbaClassById = async (req, res) => {
  try {
    const { id } = req.params; // Fix: use id not classId

    const cacheKey = `garba-class:${id}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Garba class fetched from cache.",
        data: JSON.parse(cached),
        fromCache: true,
      });
    }

    const garbaClass = await garbaClassService.getGarbaClassById(id);

    if (!garbaClass) {
      return res.status(404).json({ success: false, message: "Garba class not found." });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(garbaClass));

    res.status(200).json({ success: true, message: "Garba class fetched successfully", data: garbaClass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update
export const updateGarbaClass = async (req, res) => {
  try {
    const { id } = req.params; // Fix: use id not classId

    const { error, value } = garbaClassUpdateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    const classData = { ...value };
    if (req.file) {
      classData.profilePic = req.file.filename;
    }

    const updated = await garbaClassService.updateGarbaClass(id, classData);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Garba class not found." });
    }

    const redis = await initRedis();

    // Delete cache keys with pattern
    const keys = await redis.keys("garba-classes:all*");
    if (keys.length) await redis.del(keys);

    await redis.del(`garba-class:${id}`);

    res.status(200).json({ success: true, message: "Garba class updated successfully.", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete
export const deleteGarbaClass = async (req, res) => {
  try {
    const { id } = req.params; // Fix: use id not classId

    const deleted = await garbaClassService.deleteGarbaClass(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Garba class not found." });
    }

    const redis = await initRedis();

    // Delete cache keys with pattern
    const keys = await redis.keys("garba-classes:all*");
    if (keys.length) await redis.del(keys);

    await redis.del(`garba-class:${id}`);

    res.status(200).json({ success: true, message: "Garba class deleted successfully.", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// export const getAllZones = async (req, res) => {
//   try {
//     const zones = await GarbaClass.distinct("zone", { isDeleted: false });

//     return res.status(200).json({
//       success: true,
//       message: "Zones fetched successfully",
//       data: zones.filter(zone => zone && zone.trim() !== "") // remove empty/null zones
//     });
//   } catch (err) {
//     console.error("❌ Failed to fetch zones:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch zones",
//     });
//   }
// };

export const getAllZones = async (req, res) => {
  try {
    const zones = await garbaClassService.getAllZones();

    res.status(200).json({
      success: true,
      message: "All zones fetched successfully.",
      data: zones,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//getKhaliyaPriceByZone
export const getKhaliyaPriceByZone = async (req, res) => {
  try {
    const { eventId, typeId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }
    const ticket = await Ticket.findOne({ event: event._id, _id: typeId });
    console?.log("Fetched ticket:", ticket);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Group all prices by normalized zone (array per zone)
    const pricesMap = {};
    for (const price of ticket.prices) {
      if (price.zone) {
        const zoneKey = price.zone.toLowerCase().replace(/\s/g, "");
        
        // Format date to YYYY-MM-DD
        const isKhelaiya = ['684922cd22c00753b1ef80e0', '684b27ea8869c60f805f4ac9'].includes(typeId);
        if (isKhelaiya && !price.date) {
          pricesMap[zoneKey] = price.price || null; // Use price directly if no date
        } else {
          const formattedPrice = {
            ...price.toObject?.() || price,
            date: price.date ? price.date.toISOString().split('T')[0] : null
          };
          if (!pricesMap[zoneKey]) pricesMap[zoneKey] = [];
          pricesMap[zoneKey].push(formattedPrice);
        }
      }
    }

    // Get all users with role "Garba Class" and not deleted
    const users = await GarbaClass.find({ role: "Garba Class", eid: eventId, isDeleted: false })
      .select("name zone email phoneNumber")
      .sort({ zoneId: 1 });

    console?.log("Fetched users:", users.length, "with zones:", users.map(u => u.zone));

    // Attach the array of prices for each user's zone
    const enrichedUsers = users.map(user => {
      const userZoneKey = (user.zone || "").toLowerCase().replace(/\s/g, "");
      const zonePrices = pricesMap[userZoneKey] || [];
      return {
        ...user.toObject(),
        zonePrices,
      };
    });

    res.json(enrichedUsers);

  } catch (error) {
    console.error("Error fetching users with zone prices:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
