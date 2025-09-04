import GarbaClass from "../models/garbaClass.js";

export default class GarbaClassRepository {
  async create(data) {
    try {
      return await GarbaClass.create(data);
    } catch (error) {
      throw new Error(`Failed to create Garba Class: ${error.message}`);
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {}
  }) {
    try {
      const query = { isDeleted: false, ...filters };

      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

  

      const skip = (page - 1) * limit;

      const classes = await GarbaClass.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await GarbaClass.countDocuments(query);

      return {
        data: classes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Failed to fetch Garba Classes: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await GarbaClass.findById(id);
    } catch (error) {
      throw new Error(`Failed to find Garba Class by ID: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await GarbaClass.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw new Error(`Failed to update Garba Class: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await GarbaClass.findByIdAndDelete(id, { isDeleted: true }, { new: true });
    } catch (error) {
      throw new Error(`Failed to delete Garba Class: ${error.message}`);
    }
  }

  async getAllZones() {
  try {
    const zones = await GarbaClass.distinct("zone", { isDeleted: false });
    return zones.filter(z => z); // Remove empty/null zones
  } catch (error) {
    throw new Error(`Failed to fetch zones: ${error.message}`);
  }
}

  //getKhaliyaPriceByZone
  async getKhaliyaPriceByZone(categoryId) {
    try {
      
      //get all garbaclass with name zone_id _id order by zone_id
      const classes = await GarbaClass.find({ categoryId, isDeleted: false })
        .select('zone name _id') 
        .sort({ zone_id: 1 });

        
        //get all zone prices from tickets collection where zone_name = zone
      
    }catch (error) {
      throw new Error(`Failed to fetch Khaliya prices by zone: ${error.message}`);
    }
  }
}
