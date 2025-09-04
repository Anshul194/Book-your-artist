import EventService from '../service/eventService.js';
import { initRedis } from '../config/redisClient.js';
import { eventCreateValidator ,eventUpdateValidator} from '../validations/eventValidation.js';
import Admin from '../models/admin.js';
import mongoose from 'mongoose';
const eventService = new EventService();

export const createEvent = async (req, res) => {
  try {
    const { error, value } = eventCreateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if event with same name exists
    const existingEvent = await eventService.findByName(value.name);
    if (existingEvent) {
      return res.status(409).json({ success: false, message: 'Event name already exists.' });
    }

    const eventData = { ...value };

    // Allow category to be an array of ObjectIds
    if (req.body.category) {
      if (Array.isArray(req.body.category)) {
        eventData.category = req.body.category;
      } else if (typeof req.body.category === 'string') {
        // Accept comma separated string or single id
        eventData.category = req.body.category.split(',').map(id => id.trim());
      }
    }

    // Attach files if exist
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        eventData.coverImage = req.files.coverImage[0].filename;
      }
      if (req.files.image && req.files.image[0]) {
        eventData.image = req.files.image[0].filename;
      }
    }

    const event = await eventService.createEvent(eventData);

    const redis = await initRedis();
    await redis.del('events:all');

    res.status(201).json({ success: true, message: 'Event created successfully.', data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};






// export const getAllEvents = async (req, res) => {
//   try {
//     const cacheKey = 'events:all';
//     const redis = await initRedis();
//     const cached = await redis.get(cacheKey);

//     if (cached) {
//       return res.status(200).json({ success: true, data: JSON.parse(cached), fromCache: true });
//     }

//     const events = await eventService.getAllEvents();
//     await redis.setEx(cacheKey, 300, JSON.stringify(events)); // Cache for 5 minutes

//     res.status(200).json({ success: true, data: events });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


export const getAllEvents = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      eventStatus,
      category
    } = req.query;

    const filters = {};

    if (req.user && req.user.type) {
          const admin = await Admin.findOne({_id:req.user.id});
          if(!admin.isSuper_Admin){
            const type = req.user.type;
            filters.category = new mongoose.Types.ObjectId(type);
          }
        }

    
    if (status) filters.status = status;
    if (eventStatus) filters.eventStatus = eventStatus;
    if (category) filters.category = category;

    const options = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    const cacheKey = `events:all:${JSON.stringify(options)}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Events fetched successfully (from cache).',
    //     ...JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const events = await eventService.getAllEvents(options);

    await redis.setEx(cacheKey, 300, JSON.stringify(events)); // 5 minutes cache

    res.status(200).json({
      success: true,
      message: 'Events fetched successfully.',
      ...events
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    console.log("Fetching event by ID:", req.params.eventId);

    const { eventId } = req.params;
    const cacheKey = `event:${eventId}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({ 
    //     success: true, 
    //     message: "Event fetched successfully from cache.", 
    //     data: JSON.parse(cached), 
    //     fromCache: true 
    //   });
    // }

    const event = await eventService.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(event)); // Cache for 5 minutes

    res.status(200).json({ 
      success: true, 
      message: "Event fetched successfully.", 
      data: event 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getEventsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ success: false, message: "Category ID is required." });
    }

    const events = await eventService.getEventsByCategory(categoryId);

    res.status(200).json({
      success: true,
      message: "Events fetched successfully by category.",
      data: events
    });
  } catch (err) {
    console.error("Error fetching events by category:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const updateEvent = async (req, res) => {
  try {
  console.log("Updating event with ID:", req.params.eventId);
    const { eventId } = req.params;

    const { error, value } = eventUpdateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if event name is being updated & if duplicate exists
    if (value.name) {
      const existingEvent = await eventService.findByName(value.name);
      if (existingEvent && existingEvent._id.toString() !== eventId) {
        return res.status(409).json({ success: false, message: 'Event name already exists.' });
      }
    }

    const eventData = { ...value };

    // Attach files if exist
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        eventData.coverImage = req.files.coverImage[0].filename;
      }
      if (req.files.image && req.files.image[0]) {
        eventData.image = req.files.image[0].filename;
      }
    }

    const updated = await eventService.updateEvent(eventId, eventData);

    const redis = await initRedis();
    await redis.del('events:all');
    await redis.del(`event:${eventId}`);

    res.status(200).json({ success: true, message: 'Event updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    console.log("Deleting event with ID:", req.params.eventId);
    const { eventId } = req.params;
    const deleted = await eventService.deleteEvent(eventId);

    const redis = await initRedis();
    await redis.del('events:all');
    await redis.del(`event:${eventId}`);

    res.status(200).json({ success: true, message: "Event deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTicketsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await eventService.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tickets fetched successfully.",
      data: event.ticketsTypes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};





