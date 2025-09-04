// repository/eventSponsorRepository.js
import EventSponsor from '../models/EventSponsor.js';

export default class EventSponsorRepository {
  async create(data) {
    try {
      return await EventSponsor.create(data);
    } catch (error) {
      throw new Error(`Failed to create event sponsor: ${error.message}`);
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
  } = {}) {
    try {
      const query = { ...filters };

      // Search on sponsor name
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const skip = (page - 1) * limit;

      const sponsors = await EventSponsor.find(query)
        .populate('event', 'name startDate placeName')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await EventSponsor.countDocuments(query);

      return {
        data: sponsors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to find all event sponsors: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await EventSponsor.findById(id).populate('event', 'name startDate placeName');
    } catch (error) {
      throw new Error(`Failed to find event sponsor by ID: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await EventSponsor.findByIdAndUpdate(id, data, { new: true }).populate('event', 'name startDate placeName');
    } catch (error) {
      throw new Error(`Failed to update event sponsor: ${error.message}`);
    }
  }

  async findOne(filter) {
    return await EventSponsor.findOne(filter);
  }
  
  async delete(id) {
    try {
      return await EventSponsor.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete event sponsor: ${error.message}`);
    }
  }

    async findHomeSponsor() {
    try {
      const homeSponsors = await EventSponsor.find({ 
        is_home: true, 
        status: 'Publish' 
      }).populate('event').sort({ createdAt: -1 });
      
      return homeSponsors || [];
    } catch (error) {
      throw new Error(`Failed to find home sponsors: ${error.message}`);
    }
  }

  
}