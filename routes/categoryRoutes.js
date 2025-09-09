import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  updateCategoryStatus,
  searchCategories,
  getAllCategoryCoverImages
} from '../controllers/categoryController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';
import checkPermission from '../middlewares/checkPermission.js';
import checkOriginForAdmin from '../middlewares/checkOriginForAdmin.js';

const categoryRouter = express.Router();

// 🔓 Public routes
categoryRouter.get('/active', getActiveCategories);
categoryRouter.get('/search', searchCategories);
categoryRouter.get(
  '/',
  checkOriginForAdmin,
  getAllCategories
);
categoryRouter.get('/cover-images', getAllCategoryCoverImages);


// Get category by ID
categoryRouter.get('/:categoryId',getCategoryById);

// 🔒 Protected routes (Admin only)

// Create Category
categoryRouter.post(
  '/',
  accessTokenAutoRefresh,
  // passport.authenticate('jwt', { session: false }),
  isAdmin,
  // checkPermission('Categories', 'create'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  createCategory
);




// Update category
categoryRouter.put(
  '/:categoryId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Categories', 'update'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  updateCategory
);

// Delete category
categoryRouter.delete(
  '/:categoryId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Categories', 'delete'),
  deleteCategory
);

// Update category status (active/inactive)
categoryRouter.patch(
  '/:categoryId/status',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Categories', 'update'),
  updateCategoryStatus
);

export default categoryRouter;
 
