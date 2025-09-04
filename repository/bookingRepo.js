// Updated BookingRepository - bookingRepo.js
import Booking from '../models/Booking.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import user from '../models/user.js';
import TicketTransferLogModel from '../models/TransferLog.js';
import mongoose from 'mongoose';

class BookingRepository {
  async create(data) {
    try {

      console
      return await Booking.create(data);
    } catch (error) {
      throw error;
    }
  }

  //countByEvent
  async countByEvent(eventId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error('Invalid event ID');
      }

      const query = { eid: eventId };
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error('Invalid user ID');
        }
        query.user_id = userId;
      }

      



    } catch (error) {
      console.error('Error in countByEvent:', error);
      throw new Error('Failed to count bookings by event: ' + error.message);
    }
  }

  async update(id, data) {
    try {
      return await Booking.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw error;
    } 
  }

  async findById(id) {
    try {
      return await Booking.findById(id).populate('user_id class_id eid typeid');
    } catch (error) {
      throw error;
    }
  }

  async findByBookingId(bookingId) {
    try {
      // return await Booking.findOne({ booking_id: bookingId }).populate('user_id class_id eid typeid');
      return await Booking.findById(bookingId).populate('user_id class_id eid typeid');

    } catch (error) {
      throw error;
    }
  }



  async updateStatus(id, status) {
    try {
      return await Booking.findByIdAndUpdate(id, { booking_status: status }, { new: true });
    } catch (error) {
      throw error;
    }
  }

  async findAll({ skip = 0, limit = 10, sort = { createdAt: -1 }, search = {}, filters = {} }) {
    try {
      // Build the query for bookings
      let query = { ...filters };

      // Map simplified field names to their full paths
      const fieldMap = {
        fullName: 'user_id.fullName',
        email: 'user_id.email',
        phone: 'user_id.phone',
        eventName: 'eid.name',
        ticketType: 'type',
        booking_status: 'booking_status',
        type: 'type',
      };

      // Add dynamic search conditions based on search object
      const searchConditions = [];
      for (const [field, value] of Object.entries(search)) {
        if (value && fieldMap[field]) {
          // Ensure value is a string and decode URL-encoded characters
          const decodedValue = decodeURIComponent(String(value));
          console.log(`Search condition: ${fieldMap[field]} = ${decodedValue}`);
          searchConditions.push({ [fieldMap[field]]: { $regex: decodedValue, $options: 'i' } });
        }
      }

      // Combine search conditions with $or if multiple are provided
      if (searchConditions.length > 0) {
        query = { ...query, $or: searchConditions };
        console.log('Search query:', JSON.stringify(query));
      }

      // Log the final query
      console.log('Final query:', JSON.stringify(query));

      // Perform aggregation to join with User, Event, and Class collections
      const data = await Booking.aggregate([
        // Lookup to join with User collection
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_id',
          },
        },
        // Unwind user_id array to get a single user object
        { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
        // Lookup to join with Event collection
        {
          $lookup: {
            from: 'events',
            localField: 'eid',
            foreignField: '_id',
            as: 'eid',
          },
        },
        // Unwind eid array
        { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
        // Lookup to join with Class collection (optional, as it may be null)
        {
          $lookup: {
            from: 'classes',
            localField: 'class_id',
            foreignField: '_id',
            as: 'class_id',
          },
        },
        // Unwind class_id array, preserving null values
        { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
        // Lookup to join with Admin collection (created_by)
          {
            $lookup: {
              from: 'admins',
              localField: 'created_by',
              foreignField: '_id',
              as: 'created_by',
            },
          },
          {
            $unwind: {
              path: '$created_by',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $set: {
              created_by: {
                _id: '$created_by._id',
                name: '$created_by.name',
                email: '$created_by.email',
                type: '$created_by.type',
              }
            }
          },



        // Match the query with search and filters
        { $match: query },
        // Sort, skip, and limit
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);

      // Count total documents matching the query
      const totalResult = await Booking.aggregate([
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_id' } },
        { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'events', localField: 'eid', foreignField: '_id', as: 'eid' } },
        { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
        { $match: query },
        { $count: 'total' },
      ]);

      const total = totalResult[0] ? totalResult[0].total : 0;
      console.log('Total documents:', total);

      return {
        data: data.filter(doc => doc), // Remove null/undefined documents
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async update(id, data) {
  return await Booking.findByIdAndUpdate(id, data, { new: true });
}


  // Updated method with search functionality using aggregation
  /**
   * Count the number of bookings for the given event and user, grouped by typeid and date.
   * Returns: [{ date, type, count }]
   */
  async countByEvent(eventId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error('Invalid event ID');
      }

      const match = { eid: new mongoose.Types.ObjectId(eventId) };
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error('Invalid user ID');
        }
        match.user_id = new mongoose.Types.ObjectId(userId);
      }

      const result = await Booking.aggregate([
        { $match: match },
        {
          $group: {
        _id: { date: "$date", typeid: "$typeid", type: "$type" },
        count: { $sum: 1 },
        total_ticket: { $sum: "$total_ticket" }
          }
        },
        {
          $project: {
        _id: 0,
        date: "$_id.date",
        type: "$_id.type",
        typeid: "$_id.typeid",
        count: "$total_ticket",
        // total_ticket: "$total_ticket"
          }
        }
      ]);

      return result;
    } catch (error) {
      console.error('Error in countByEvent:', error);
      throw new Error('Failed to count bookings by event: ' + error.message);
    }
  }


// old - without complimentary 
  // async findByCategory({ skip = 0, limit = 10, sort = { createdAt: -1 }, search = {}, filters = {} }) {
  //   try {
  //     if (!Event || typeof Event.find !== 'function') {
  //       throw new Error('Event model is not properly defined or imported');
  //     }

  //     const event = await Event.findOne({ category: filters.category }).select('_id');
  //     if (!event) {
  //       return {
  //         data: [],
  //         total: 0,
  //         page: Math.floor(skip / limit) + 1,
  //         limit,
  //         totalPages: 0,
  //       };
  //     }

  //     let baseQuery = { eid: event._id };

  //     if (filters.user_id) {
  //       baseQuery.user_id = new mongoose.Types.ObjectId(filters.user_id);
  //     }

  //     if (filters.booking_status) {
  //       baseQuery.booking_status = filters.booking_status;
  //     }

  //     const directFilters = { ...filters };
  //     delete directFilters.category;
  //     delete directFilters.user_id;
  //     delete directFilters.subCategory;
  //     delete directFilters.booking_status;

  //     Object.keys(directFilters).forEach(key => {
  //       if (directFilters[key] !== undefined && directFilters[key] !== null && directFilters[key] !== '') {
  //         baseQuery[key] = directFilters[key];
  //       }
  //     });

  //     if (filters.subCategory) {
  //       if (!mongoose.Types.ObjectId.isValid(filters.subCategory)) {
  //         return {
  //           data: [],
  //           total: 0,
  //           page: Math.floor(skip / limit) + 1,
  //           limit,
  //           totalPages: 0,
  //         };
  //       }
  //       const tickets = await Ticket.find({ ticketTypeId: filters.subCategory }).select('_id');
  //       if (tickets.length === 0) {
  //         return {
  //           data: [],
  //           total: 0,
  //           page: Math.floor(skip / limit) + 1,
  //           limit,
  //           totalPages: 0,
  //         };
  //       }
  //       const ticketIds = tickets.map(ticket => ticket._id);
  //       baseQuery.typeid = { $in: ticketIds };
  //     }

  //     const fieldMap = {
  //       fullName: 'user_id.fullName',
  //       email: 'user_id.email',
  //       phone: 'user_id.phone',
  //       eventName: 'eid.name',
  //       ticketType: 'type',
  //       booking_status: 'booking_status',
  //       type: 'type',
  //     };

  //     const searchConditions = [];
  //     for (const [field, value] of Object.entries(search)) {
  //       if (value && fieldMap[field]) {
  //         const decodedValue = decodeURIComponent(String(value));
  //         searchConditions.push({ [fieldMap[field]]: { $regex: decodedValue, $options: 'i' } });
  //       }
  //     }

  //     let finalQuery = baseQuery;
  //     if (searchConditions.length > 0) {
  //       finalQuery = { ...baseQuery, $or: searchConditions };
  //     }

  //     const aggregationPipeline = [
  //       { $match: baseQuery },

  //       // Join User
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'user_id',
  //           foreignField: '_id',
  //           as: 'user_id',
  //         },
  //       },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },

  //       // Join Event
  //       {
  //         $lookup: {
  //           from: 'events',
  //           localField: 'eid',
  //           foreignField: '_id',
  //           as: 'eid',
  //         },
  //       },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },

  //       // Join GarbaClasses
  //       {
  //         $lookup: {
  //           from: 'users', // ✅ Make sure your MongoDB collection is named this way
  //           localField: 'class_id',
  //           foreignField: '_id',
  //           as: 'class_id',
  //         },
  //       },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },

  //       // Join Ticket
  //       {
  //         $lookup: {
  //           from: 'tickets',
  //           localField: 'typeid',
  //           foreignField: '_id',
  //           as: 'typeid',
  //         },
  //       },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];

  //     if (searchConditions.length > 0) {
  //       aggregationPipeline.push({ $match: { $or: searchConditions } });
  //     }

  //     aggregationPipeline.push(
  //       { $sort: sort },
  //       { $skip: skip },
  //       { $limit: limit }
  //     );

  //     const data = await Booking.aggregate(aggregationPipeline);

  //     const countPipeline = [
  //       { $match: baseQuery },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'user_id',
  //           foreignField: '_id',
  //           as: 'user_id',
  //         },
  //       },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'events',
  //           localField: 'eid',
  //           foreignField: '_id',
  //           as: 'eid',
  //         },
  //       },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'class_id',
  //           foreignField: '_id',
  //           as: 'class_id',
  //         },
  //       },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'tickets',
  //           localField: 'typeid',
  //           foreignField: '_id',
  //           as: 'typeid',
  //         },
  //       },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];

  //     if (searchConditions.length > 0) {
  //       countPipeline.push({ $match: { $or: searchConditions } });
  //     }

  //     countPipeline.push({ $count: 'total' });

  //     const totalResult = await Booking.aggregate(countPipeline);
  //     const total = totalResult[0] ? totalResult[0].total : 0;

  //     return {
  //       data: data.filter(doc => doc),
  //       total,
  //       page: Math.floor(skip / limit) + 1,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     };
  //   } catch (error) {
  //     console.error('Error in findByCategory:', error);
  //     throw new Error('Failed to fetch bookings by category: ' + error.message);
  //   }
  // }


// Repository
async findByCategory({ sort = { createdAt: -1 }, search = {}, filters = {}, page = 1, limit = 10 }) {
  try {
    const event = await Event.findOne({ category: filters.category }).select('_id');
    if (!event) {
      return { data: [], total: 0 };
    }

    let baseQuery = { eid: event._id };

    if (filters.user_id) {
      baseQuery.user_id = new mongoose.Types.ObjectId(filters.user_id);
    }
    if (filters.booking_status) {
      baseQuery.booking_status = filters.booking_status;
    }

    const directFilters = { ...filters };
    delete directFilters.category;
    delete directFilters.user_id;
    delete directFilters.subCategory;
    delete directFilters.booking_status;

    Object.keys(directFilters).forEach(key => {
      if (directFilters[key] !== undefined && directFilters[key] !== null && directFilters[key] !== '') {
        baseQuery[key] = directFilters[key];
      }
    });

    if (filters.subCategory) {
      if (!mongoose.Types.ObjectId.isValid(filters.subCategory)) {
        return { data: [], total: 0 };
      }
      const tickets = await Ticket.find({ ticketTypeId: filters.subCategory }).select('_id');
      if (tickets.length === 0) {
        return { data: [], total: 0 };
      }
      const ticketIds = tickets.map(ticket => ticket._id);
      baseQuery.typeid = { $in: ticketIds };
    }

    const fieldMap = {
      fullName: 'user_id.fullName',
      email: 'user_id.email',
      phone: 'user_id.phone',
      eventName: 'eid.name',
      ticketType: 'type',
      booking_status: 'booking_status',
      type: 'type',
    };

    const searchConditions = [];
    for (const [field, value] of Object.entries(search)) {
      if (value && fieldMap[field]) {
        const decodedValue = decodeURIComponent(String(value));
        searchConditions.push({ [fieldMap[field]]: { $regex: decodedValue, $options: 'i' } });
      }
    }

    let finalQuery = baseQuery;
    if (searchConditions.length > 0) {
      finalQuery = { ...baseQuery, $or: searchConditions };
    }

    // Pagination calculation
    const skip = (page - 1) * limit;

    const aggregationPipeline = [
      { $match: baseQuery },

      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_id' } },
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },

      { $lookup: { from: 'events', localField: 'eid', foreignField: '_id', as: 'eid' } },
      { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },

      { $lookup: { from: 'users', localField: 'class_id', foreignField: '_id', as: 'class_id' } },
      { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },

      { $lookup: { from: 'tickets', localField: 'typeid', foreignField: '_id', as: 'typeid' } },
      { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
    ];

    if (searchConditions.length > 0) {
      aggregationPipeline.push({ $match: { $or: searchConditions } });
    }

    aggregationPipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    );

    const data = await Booking.aggregate(aggregationPipeline);

    const processedData = data.map(booking => ({
      ...booking,
      originalPrice: booking.price,
      originalSubtotal: booking.subtotal,
      price: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.price,
      subtotal: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.subtotal,
    }));

    const countPipeline = [
      { $match: baseQuery },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_id' } },
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'events', localField: 'eid', foreignField: '_id', as: 'eid' } },
      { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'class_id', foreignField: '_id', as: 'class_id' } },
      { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'tickets', localField: 'typeid', foreignField: '_id', as: 'typeid' } },
      { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
    ];

    if (searchConditions.length > 0) {
      countPipeline.push({ $match: { $or: searchConditions } });
    }

    countPipeline.push({ $count: 'total' });

    const totalResult = await Booking.aggregate(countPipeline);
    const total = totalResult[0] ? totalResult[0].total : 0;

    return {
      data: processedData.filter(doc => doc),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error in findByCategory:', error);
    throw new Error('Failed to fetch bookings by category: ' + error.message);
  }
}

// new- with complimentary 12/8/25
  // async findByCategory({ sort = { createdAt: -1 }, search = {}, filters = {} }) {
  //   try {
  //     if (!Event || typeof Event.find !== 'function') {
  //       throw new Error('Event model is not properly defined or imported');
  //     }
  
  //     const event = await Event.findOne({ category: filters.category }).select('_id');
  //     if (!event) {
  //       return { data: [], total: 0 };
  //     }
  
  //     let baseQuery = { eid: event._id };
  
  //     if (filters.user_id) {
  //       baseQuery.user_id = new mongoose.Types.ObjectId(filters.user_id);
  //     }
  
  //     if (filters.booking_status) {
  //       baseQuery.booking_status = filters.booking_status;
  //     }
  
  //     const directFilters = { ...filters };
  //     delete directFilters.category;
  //     delete directFilters.user_id;
  //     delete directFilters.subCategory;
  //     delete directFilters.booking_status;
  
  //     Object.keys(directFilters).forEach(key => {
  //       if (directFilters[key] !== undefined && directFilters[key] !== null && directFilters[key] !== '') {
  //         baseQuery[key] = directFilters[key];
  //       }
  //     });
  
  //     if (filters.subCategory) {
  //       if (!mongoose.Types.ObjectId.isValid(filters.subCategory)) {
  //         return { data: [], total: 0 };
  //       }
  //       const tickets = await Ticket.find({ ticketTypeId: filters.subCategory }).select('_id');
  //       if (tickets.length === 0) {
  //         return { data: [], total: 0 };
  //       }
  //       const ticketIds = tickets.map(ticket => ticket._id);
  //       baseQuery.typeid = { $in: ticketIds };
  //     }
  
  //     const fieldMap = {
  //       fullName: 'user_id.fullName',
  //       email: 'user_id.email',
  //       phone: 'user_id.phone',
  //       eventName: 'eid.name',
  //       ticketType: 'type',
  //       booking_status: 'booking_status',
  //       type: 'type',
  //     };
  
  //     const searchConditions = [];
  //     for (const [field, value] of Object.entries(search)) {
  //       if (value && fieldMap[field]) {
  //         const decodedValue = decodeURIComponent(String(value));
  //         searchConditions.push({ [fieldMap[field]]: { $regex: decodedValue, $options: 'i' } });
  //       }
  //     }
  
  //     let finalQuery = baseQuery;
  //     if (searchConditions.length > 0) {
  //       finalQuery = { ...baseQuery, $or: searchConditions };
  //     }
  
  //     const aggregationPipeline = [
  //       { $match: baseQuery },
  
  //       { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_id' } },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
  
  //       { $lookup: { from: 'events', localField: 'eid', foreignField: '_id', as: 'eid' } },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
  
  //       { $lookup: { from: 'users', localField: 'class_id', foreignField: '_id', as: 'class_id' } },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
  
  //       { $lookup: { from: 'tickets', localField: 'typeid', foreignField: '_id', as: 'typeid' } },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];
  
  //     if (searchConditions.length > 0) {
  //       aggregationPipeline.push({ $match: { $or: searchConditions } });
  //     }
  
  //     aggregationPipeline.push({ $sort: sort });
  
  //     const data = await Booking.aggregate(aggregationPipeline);
  
  //     const processedData = data.map(booking => ({
  //       ...booking,
  //       originalPrice: booking.price,
  //       originalSubtotal: booking.subtotal,
  //       price: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.price,
  //       subtotal: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.subtotal,
  //     }));
  
  //     const countPipeline = [
  //       { $match: baseQuery },
  //       { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_id' } },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
  //       { $lookup: { from: 'events', localField: 'eid', foreignField: '_id', as: 'eid' } },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
  //       { $lookup: { from: 'users', localField: 'class_id', foreignField: '_id', as: 'class_id' } },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
  //       { $lookup: { from: 'tickets', localField: 'typeid', foreignField: '_id', as: 'typeid' } },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];
  
  //     if (searchConditions.length > 0) {
  //       countPipeline.push({ $match: { $or: searchConditions } });
  //     }
  
  //     countPipeline.push({ $count: 'total' });
  
  //     const totalResult = await Booking.aggregate(countPipeline);
  //     const total = totalResult[0] ? totalResult[0].total : 0;
  
  //     return {
  //       data: processedData.filter(doc => doc),
  //       total,
  //     };
  //   } catch (error) {
  //     console.error('Error in findByCategory:', error);
  //     throw new Error('Failed to fetch bookings by category: ' + error.message);
  //   }
  // }  


  
  // async findByCategory({ skip = 0, limit = 10, sort = { createdAt: -1 }, search = {}, filters = {} }) {
  //   try {
  //     if (!Event || typeof Event.find !== 'function') {
  //       throw new Error('Event model is not properly defined or imported');
  //     }

  //     const event = await Event.findOne({ category: filters.category }).select('_id');
  //     if (!event) {
  //       return {
  //         data: [],
  //         total: 0,
  //         page: Math.floor(skip / limit) + 1,
  //         limit,
  //         totalPages: 0,
  //       };
  //     }

  //     let baseQuery = { eid: event._id };

  //     if (filters.user_id) {
  //       baseQuery.user_id = new mongoose.Types.ObjectId(filters.user_id);
  //     }

  //     if (filters.booking_status) {
  //       baseQuery.booking_status = filters.booking_status;
  //     }

  //     const directFilters = { ...filters };
  //     delete directFilters.category;
  //     delete directFilters.user_id;
  //     delete directFilters.subCategory;
  //     delete directFilters.booking_status;

  //     Object.keys(directFilters).forEach(key => {
  //       if (directFilters[key] !== undefined && directFilters[key] !== null && directFilters[key] !== '') {
  //         baseQuery[key] = directFilters[key];
  //       }
  //     });

  //     if (filters.subCategory) {
  //       if (!mongoose.Types.ObjectId.isValid(filters.subCategory)) {
  //         return {
  //           data: [],
  //           total: 0,
  //           page: Math.floor(skip / limit) + 1,
  //           limit,
  //           totalPages: 0,
  //         };
  //       }
  //       const tickets = await Ticket.find({ ticketTypeId: filters.subCategory }).select('_id');
  //       if (tickets.length === 0) {
  //         return {
  //           data: [],
  //           total: 0,
  //           page: Math.floor(skip / limit) + 1,
  //           limit,
  //           totalPages: 0,
  //         };
  //       }
  //       const ticketIds = tickets.map(ticket => ticket._id);
  //       baseQuery.typeid = { $in: ticketIds };
  //     }

  //     const fieldMap = {
  //       fullName: 'user_id.fullName',
  //       email: 'user_id.email',
  //       phone: 'user_id.phone',
  //       eventName: 'eid.name',
  //       ticketType: 'type',
  //       booking_status: 'booking_status',
  //       type: 'type',
  //     };

  //     const searchConditions = [];
  //     for (const [field, value] of Object.entries(search)) {
  //       if (value && fieldMap[field]) {
  //         const decodedValue = decodeURIComponent(String(value));
  //         searchConditions.push({ [fieldMap[field]]: { $regex: decodedValue, $options: 'i' } });
  //       }
  //     }

  //     let finalQuery = baseQuery;
  //     if (searchConditions.length > 0) {
  //       finalQuery = { ...baseQuery, $or: searchConditions };
  //     }

  //     const aggregationPipeline = [
  //       { $match: baseQuery },

  //       // Join User
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'user_id',
  //           foreignField: '_id',
  //           as: 'user_id',
  //         },
  //       },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },

  //       // Join Event
  //       {
  //         $lookup: {
  //           from: 'events',
  //           localField: 'eid',
  //           foreignField: '_id',
  //           as: 'eid',
  //         },
  //       },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },

  //       // Join GarbaClasses
  //       {
  //         $lookup: {
  //           from: 'users', // ✅ Make sure your MongoDB collection is named this way
  //           localField: 'class_id',
  //           foreignField: '_id',
  //           as: 'class_id',
  //         },
  //       },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },

  //       // Join Ticket
  //       {
  //         $lookup: {
  //           from: 'tickets',
  //           localField: 'typeid',
  //           foreignField: '_id',
  //           as: 'typeid',
  //         },
  //       },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];

  //     if (searchConditions.length > 0) {
  //       aggregationPipeline.push({ $match: { $or: searchConditions } });
  //     }

  //     aggregationPipeline.push(
  //       { $sort: sort },
  //       { $skip: skip },
  //       { $limit: limit }
  //     );

  //     const data = await Booking.aggregate(aggregationPipeline);

  //      const processedData = data.map(booking => {
  //      return {
  //        ...booking,
  //        originalPrice: booking.price,
  //        originalSubtotal: booking.subtotal,
  //        price: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.price,
  //        subtotal: booking.payment_type === 'Complimentary' ? 'Complimentary' : booking.subtotal,
  //      };
  //    });


  //     const countPipeline = [
  //       { $match: baseQuery },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'user_id',
  //           foreignField: '_id',
  //           as: 'user_id',
  //         },
  //       },
  //       { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'events',
  //           localField: 'eid',
  //           foreignField: '_id',
  //           as: 'eid',
  //         },
  //       },
  //       { $unwind: { path: '$eid', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'class_id',
  //           foreignField: '_id',
  //           as: 'class_id',
  //         },
  //       },
  //       { $unwind: { path: '$class_id', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'tickets',
  //           localField: 'typeid',
  //           foreignField: '_id',
  //           as: 'typeid',
  //         },
  //       },
  //       { $unwind: { path: '$typeid', preserveNullAndEmptyArrays: true } },
  //     ];

  //     if (searchConditions.length > 0) {
  //       countPipeline.push({ $match: { $or: searchConditions } });
  //     }

  //     countPipeline.push({ $count: 'total' });

  //     const totalResult = await Booking.aggregate(countPipeline);
  //     const total = totalResult[0] ? totalResult[0].total : 0;

  //     return {
  //       data: processedData.filter(doc => doc),
  //       total,
  //       page: Math.floor(skip / limit) + 1,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     };
  //   } catch (error) {
  //     console.error('Error in findByCategory:', error);
  //     throw new Error('Failed to fetch bookings by category: ' + error.message);
  //   }
  // }

 



 



  async verifyByBookingId(bookingId) {
    try {
      const booking = await Booking.findOne({ _id: bookingId });
      if (!booking) return null;
      if (booking.booking_status === 'Verified') {
        return { alreadyVerified: true, booking };
      }
      booking.booking_status = 'Verified';
      await booking.save();
      return { alreadyVerified: false, booking };
    } catch (error) {
      console.error('Error verifying booking by ID:', error?.message );
      throw error;
    }
  }

  
async TicketTransferLog({ filter = {}, skip = 0, limit = 20 }) {
  try {
    return await TicketTransferLogModel.find(filter)
      .populate("from_user_id", "fullName email phone")
      .populate("to_user_id", "fullName email phone")
      .populate("type_id", "_id event ticketTypeId ticketType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error("Error fetching transfer logs:", error);
    throw new Error("Failed to fetch ticket transfer logs");
  }
}


async findOneByQuery(query = {}) {
  try {
    return await Booking.findOne(query).populate('user_id class_id eid typeid');
  } catch (error) {
    console.error('Error in findOneByQuery:', error.message);
    throw new Error('Failed to find booking by query');
  }
}


}

export default new BookingRepository();