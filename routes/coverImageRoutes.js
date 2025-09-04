import express from 'express';
import {
  createCoverImage,
  getAllCoverImages,
  getCoverImageById,
  updateCoverImage,
  deleteCoverImage
} from '../controllers/coverImageController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';
import checkPermission from '../middlewares/checkPermission.js';
import checkOriginForAdmin from '../middlewares/checkOriginForAdmin.js';

const coverImageRouter = express.Router();

// 🔓 Public routes
coverImageRouter.get('/',
  checkOriginForAdmin,
  getAllCoverImages);
coverImageRouter.get('/:coverImageId', getCoverImageById);

// 🔒 Protected routes (Admin only)

// Create Cover Image
coverImageRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'create'),
  upload.array('images', 10), // Allow up to 10 images
  createCoverImage
);

// Update Cover Image
coverImageRouter.put(
  '/:coverImageId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'update'),
  upload.array('images', 10), // Allow up to 10 images
  updateCoverImage
);

// Delete Cover Image
coverImageRouter.delete(
  '/:coverImageId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'delete'),
  deleteCoverImage
);

export default coverImageRouter;