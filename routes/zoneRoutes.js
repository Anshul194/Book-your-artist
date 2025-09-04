import express from 'express';
import {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  deleteZone
} from '../controllers/zoneController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';

const zoneRouter = express.Router();

// Public
zoneRouter.get('/', getAllZones);
zoneRouter.get('/:zoneId', getZoneById);

// Admin Protected
zoneRouter.post('/', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, upload.single('image'),createZone);
zoneRouter.put('/:zoneId', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, updateZone);
zoneRouter.delete('/:zoneId', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, deleteZone);

export default zoneRouter;