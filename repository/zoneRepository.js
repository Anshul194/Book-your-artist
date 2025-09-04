import Zone from '../models/Zone.js';

export default class ZoneRepository {
  async create(data) {
    try {
      return await Zone.create(data);
    } catch (error) {
      throw new Error(`Failed to create zone: ${error.message}`);
    }
  }

  async findAll({ page = 1, limit = 10, search = '', status, subcategory }) {
    try {
      const query = {};
      if (status) query.status = status;
      // if (subcategory) query.subcategory = subcategory;
      if (search) query.title = { $regex: search, $options: 'i' };

      const skip = (page - 1) * limit;

      const zones = await Zone.find(query)
        // .populate('subcategory')
        .skip(skip)
        .limit(limit)

        console.log('Query:', zones);


      const total = await Zone.countDocuments(query);

      return {
        data: zones,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to retrieve zones: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Zone.findById(id).populate('subcategory', 'title');
    } catch (error) {
      throw new Error(`Failed to find zone by ID: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await Zone.findByIdAndUpdate(id, data, { new: true }).populate('subcategory', 'title');
    } catch (error) {
      throw new Error(`Failed to update zone: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Zone.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete zone: ${error.message}`);
    }
  }
}
