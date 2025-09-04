// routes/eventSponsorRoutes.js
import express from 'express';
import {
  createEventSponsor,
  getAllEventSponsors,
  getEventSponsorById,
  updateEventSponsor,
  deleteEventSponsor,
  getHomeSponsor
} from '../controllers/eventSponsorController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';

const eventSponsorRouter = express.Router();

// 🔓 Public routes
eventSponsorRouter.get('/', getAllEventSponsors);
eventSponsorRouter.get('/:sponsorId', getEventSponsorById);



// 🔒 Protected routes (Admin only)

// Create Event Sponsor
eventSponsorRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  upload.single('image'),
  createEventSponsor
);

// Update Event Sponsor
eventSponsorRouter.put(
  '/:sponsorId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  upload.single('image'),
  updateEventSponsor
);

// Delete Event Sponsor
eventSponsorRouter.delete(
  '/:sponsorId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteEventSponsor
);

export default eventSponsorRouter;