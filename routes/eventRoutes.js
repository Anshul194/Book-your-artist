import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getTicketsByEventId,
  getEventsByCategory
} from '../controllers/eventController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';
import checkPermission from '../middlewares/checkPermission.js';
import checkOriginForAdmin from '../middlewares/checkOriginForAdmin.js';

const eventRouter = express.Router();

// 🔓 Public routes

eventRouter.get('/',
  checkOriginForAdmin,
  getAllEvents);

// Get event by ID
eventRouter.get('/:eventId', getEventById);
eventRouter.get('/:eventId/tickets', getTicketsByEventId);

// 🔒 Protected routes (Admin only)

// Create Event
eventRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'create'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  createEvent
);

// Update event
eventRouter.put(
  '/:eventId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'update'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  updateEvent
);


eventRouter.get(
  '/category/:categoryId',
  getEventsByCategory
);

// Delete event
eventRouter.delete(
  '/:eventId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'delete'),
  deleteEvent
);



export default eventRouter;