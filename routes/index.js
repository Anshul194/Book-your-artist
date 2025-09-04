import express from 'express';
const router = express.Router();
import userRouter from './userRouter.js';
import adminRouter from "./adminRoutes.js";
import categoryRoutes  from './categoryRoutes.js';
import SubcategoryRoutes from './subCategoryRoutes.js';
import eventRoutes from './eventRoutes.js'; 
import eventSponsorRouter from './eventSponsorRoutes.js'; 
import coverImageRouter from './coverImageRoutes.js'; 
import galleryImageRouter from './galleryImageRoute.js';
import ticketRoutes from './ticketRoutes.js'; 
import garbaClassRouter from './garbaClassRoutes.js';
import zoneRouter from './zoneRoutes.js';
import roleRoutes from './roleRoutes.js';

import BookRouter from './bookingRoutes.js';
import TransactionRouter from './transactionRoutes.js';


import adminLogRouter from './adminLogRoutes.js';
import bannerRoutes from './bannerRoutes.js';



router.get('/', (req, res) => {
  res.send('Hello World!');
});


// admin
router.use('/admin-log', adminLogRouter); // Admin log routes
router.use("/admin", adminRouter);



router.use('/user', userRouter);
//role
router.use('/roles', roleRoutes);
router.use("/category", categoryRoutes);
router.use("/subcategory", SubcategoryRoutes);
router.use("/event", eventRoutes);
router.use("/event-sponsor", eventSponsorRouter); 
router.use("/cover-image", coverImageRouter); 
router.use("/gallery-image", galleryImageRouter); 
router.use("/ticket", ticketRoutes); 
router.use("/garba-class", garbaClassRouter); 
router.use("/zone", zoneRouter);
router.use('/booking', BookRouter);
router.use('/transaction',TransactionRouter)
router.use('/banners', bannerRoutes);



export default router;
