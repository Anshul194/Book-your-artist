import Event from '../models/Event.js';
import mongoose from 'mongoose';


export default class EventRepository {
  async create(data) {
    try {
      return await Event.create(data);
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
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
    const skip = (page - 1) * limit;

    const matchStage = { deletedAt: null, ...filters };

    if (search) {
      matchStage.name = { $regex: search, $options: 'i' };
    }

    const pipeline = [
      { $match: matchStage },
      { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },

      // Populate category (direct ref in Event model)
      {
        $lookup: {
          from: 'categories', // check actual name if different
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

      // Reverse populate: EventSponsors
      {
        $lookup: {
          from: 'eventsponsors', // actual collection name
          localField: '_id',
          foreignField: 'event',
          as: 'eventSponsors',
        },
      },

      // Reverse populate: TicketTypes (only published)
      {
        $lookup: {
          from: 'tickets', // ✅ actual collection name
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            { $match: { status: 'publish' } },
          ],
          as: 'ticketsTypes',
        },
      },

      {
        $lookup: {
          from: 'galleryimages', 
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
          ],
          as: 'galleryImages',
        },
      },

      {
        $lookup: {
          from: 'coverimages', 
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            { $match: { status: 'publish' } },
          ],
          as: 'coverImages',
        },
      },
    ];

    const events = await Event.aggregate(pipeline);

    // Count total for pagination
    const total = await Event.countDocuments(matchStage);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Failed to aggregate events: ${error.message}`);
  }
}



async findAllByCategory(
  categoryId,
  {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
  } = {}
) {
  try {
    const skip = (page - 1) * limit;
    
    // Validate and extract categoryId
    let actualCategoryId = categoryId;
    
    // Handle case where categoryId might be an object with category property
    if (typeof categoryId === 'object' && categoryId !== null && !Array.isArray(categoryId)) {
      if (categoryId.category) {
        actualCategoryId = categoryId.category;
      } else if (categoryId._id) {
        actualCategoryId = categoryId._id;
      }
    }
    
    // Validate that we have a valid categoryId
    if (!actualCategoryId) {
      throw new Error('Category ID is required');
    }
    
    // Build match stage
    const matchStage = { 
      deletedAt: null,
      ...filters 
    };
    
    // Handle different categoryId formats
    if (typeof actualCategoryId === 'string') {
      if (actualCategoryId.match(/^[0-9a-fA-F]{24}$/)) {
        // Valid ObjectId string
        matchStage.category = new mongoose.Types.ObjectId(actualCategoryId);
      } else {
        // Invalid ObjectId format
        throw new Error('Invalid category ID format');
      }
    } else if (actualCategoryId instanceof mongoose.Types.ObjectId) {
      // Already an ObjectId
      matchStage.category = actualCategoryId;
    } else {
      throw new Error('Category ID must be a valid ObjectId string or ObjectId instance');
    }
    
    // Add search conditions
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { placeName: { $regex: search, $options: 'i' } },
      ];
    }
    
    const pipeline = [
      { $match: matchStage },
      { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $lookup: {
          from: 'eventsponsors',
          localField: '_id',
          foreignField: 'event',
          as: 'eventSponsors',
        },
      },
      {
        $lookup: {
          from: 'tickets',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            { $match: { status: 'publish' } },
          ],
          as: 'ticketsTypes',
        },
      },
      {
        $lookup: {
          from: 'galleryimages',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
          ],
          as: 'galleryImages',
        },
      },
      {
        $lookup: {
          from: 'coverimages',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            { $match: { status: 'publish' } },
          ],
          as: 'coverImages',
        },
      },
    ];
    
    const events = await Event.aggregate(pipeline);
    const total = await Event.countDocuments(matchStage);
    
    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error in findAllByCategory:', error);
    throw new Error(`Failed to aggregate events by category: ${error.message}`);
  }
}


  async findById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid event ID');
      }

      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id), deletedAt: null } },

        // Populate category (direct ref in Event model)
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

        // Reverse populate: EventSponsors
        {
          $lookup: {
            from: 'eventsponsors',
            localField: '_id',
            foreignField: 'event',
            as: 'eventSponsors',
          },
        },

        // Reverse populate: TicketTypes (only published)
        {
          $lookup: {
            from: 'tickets',
            let: { eventId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
              { $match: { status: 'publish' } },
            ],
            as: 'ticketsTypes',
          },
        },

        {
          $lookup: {
            from: 'galleryimages',
            let: { eventId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            ],
            as: 'galleryImages',
          },
        },

        {
          $lookup: {
            from: 'coverimages',
            let: { eventId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
              { $match: { status: 'publish' } },
            ],
            as: 'coverImages',
          },
        },
      ];

      const result = await Event.aggregate(pipeline);
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to find event by ID: ${error.message}`);
    }
  }
  async update(id, data) {
    try {
      return await Event.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

    async findOne(filter) {
    return await Event.findOne(filter);
  }
  
  async softDelete(id) {
    try {
      return await Event.findByIdAndDelete(id, { deletedAt: new Date() }, { new: true });
    } catch (error) {
      throw new Error(`Failed to soft delete event: ${error.message}`);
    }
  }

  
}
