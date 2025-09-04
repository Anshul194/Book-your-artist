import bookingService from '../service/bookingService.js';
// import { initRedis } from '../config/redisClient.js'; // Remove redis import
import User from '../models/user.js';
import walletService from "../service/walletService.js";
import mongoose from 'mongoose';
import ScanLog from '../models/ScanLog.js';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import Booking from '../models/Booking.js';
import TransferLog from '../models/TransferLog.js';
import Ticket from '../models/Ticket.js';
import Invoice from '../models/Invoice.js';
import path from 'path';
import fs from 'fs';




import axios from 'axios';




export const createBooking = async (req, res) => {
  try {
    console.log('Request body:', req.body);

    
    const profilePhotoPath = req.files?.profile_photo?.[0]?.path || null;
    const aadharCardPath = req.files?.aadhar_card?.[0]?.path || null;

    const user = await User.findById(req.user._id); // ✅ FIXED
    console.log('User from request:', user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    const booking = await bookingService.createBooking(req.body, user, profilePhotoPath, aadharCardPath);
    console.log('Booking created:', booking);

    res.status(201).json({
      success: true,
      message: 'Booking created',
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};


// export const getTicketTypes = async (req, res) => {
//   try {
//     const user = req.user; // From auth middleware
//     const { category_id, ticket_type_id } = req.query;

//     if (!user || user.type !== 'User') {
//       return res.status(401).json({
//         ResponseCode: '401',
//         Result: 'false',
//         ResponseMsg: 'Something went wrong, try again!',
//       });
//     }

//     // Get event by category and pending status
//     const event = await Event.findOne({
//       status: 1,
//       event_status: 'Pending',
//       ...(category_id && { category_id }),
//     });

//     if (!event) {
//       return res.status(404).json({
//         ResponseCode: '404',
//         Result: 'false',
//         ResponseMsg: 'No event found',
//       });
//     }

//     // Get ticket types for that event, except id 9
//     const query = {
//       event_id: event._id,
//       status: 1,
//       ...(ticket_type_id && { _id: ticket_type_id }),
//       _id: { $ne: '9' }, // adjust this if using ObjectId
//     };

//     const ticketTypes = await TicketType.find(query);
//     const ticketList = [];

//     for (const ticket of ticketTypes) {
//       const prices = JSON.parse(ticket.ticket_price || '[]');
//       const ticket_dates = [];

//       for (const price of prices) {
//         const formattedDate = new Date(
//           price.date.split('-').reverse().join('-')
//         ); // Convert dd-mm-yyyy → yyyy-mm-dd

//         const tickets_count = await Booking.countDocuments({
//           user_id: user._id,
//           typeid: ticket._id,
//           date: formattedDate,
//         });

//         ticket_dates.push({
//           day: price.day,
//           date: price.date,
//           price: price.price,
//           tickets_count,
//         });
//       }

//       ticketList.push({
//         typeid: ticket._id,
//         ticket_type: ticket.event_type,
//         ticket_date: ticket_dates,
//       });
//     }

//     return res.json({
//       ResponseCode: '200',
//       Result: 'true',
//       ResponseMsg: 'Ticket Type List Founded!',
//       TicketType: ticketList,
//     });
//   } catch (err) {
//     console.error('Error in getTicketTypes:', err);
//     return res.status(500).json({
//       ResponseCode: '500',
//       Result: 'false',
//       ResponseMsg: 'Internal server error',
//     });
//   }
// };

export const getAllBookings = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, searchFields, ...filters } = req.query;

    // Parse searchFields as a JSON object if provided
    let search = {};
    if (searchFields) {
      try {
        search = JSON.parse(decodeURIComponent(searchFields));
      } catch (error) {
        console.error('Error parsing searchFields:', error);
        return res.status(400).json({ success: false, message: 'Invalid searchFields format' });
      }
    }

    // Convert page and limit to numbers
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      search,
      filters,
    };

    console.log('Parsed search:', JSON.stringify(options.search));

    const bookings = await bookingService.getAllBookings(options);

    res.status(200).json({
      success: true,
      message: 'Bookings fetched successfully',
      ...bookings,
    });
  } catch (err) {
    console.error('Controller error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//getBookingCount
export const getBookingCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.query.user_id ? await User.findById(req.query.user_id) : null;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }



    const bookingCount = await bookingService.getBookingCount(eventId, user?._id || null);
    if (!bookingCount) {
      return res.status(404).json({ success: false, message: 'No bookings found for this event' });
    }
    res.status(200).json({
      success: true,
      message: 'Booking count fetched successfully',
      data: bookingCount,
    });
  } catch (err) {
    console.error('Error fetching booking count:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


//transferTicket
// export const transferTicket = async (req, res) => {
//   try {
//     const user = req.user; // Authenticated user from middleware
//     console.log('Transfer ticket request body:', req.user);
//     if (!user || (user.roles !== 'user' && user.role !== 'user')) {
//       return res.status(403).json({ success: false, message: 'Forbidden: Only users can transfer tickets' });
//     }

//     const data = req.body;

//     const {type_id, date: dates, mobile, qty } = data;


//         let to_user = await User.findOne({ phone: mobile, role: 'user' });

//         if (!to_user) {
//             // Create user if not found
//             const randomPassword = '123456'; // Consider generating a more secure random password
//             const hashedPassword = await bcrypt.hash(randomPassword, 10);

//             to_user = await User.create({
//                 fullName: 'User' + Math.floor(1000 + Math.random() * 9000), // Generates 'User1234'
//                 email: uuidv4().substring(0, 10) + '@gmail.com', // Random email
//                 phone: mobile,
//                 password: hashedPassword,
//                 role: 'user',
//                 isverified: 1,
//             });
//             // If you have roles, you would assign them here, e.g., to_user.assignRole('User');
//         }

//         if (user._id.toString() === to_user._id.toString()) {
//             return res.status(400).json({
//                 ResponseCode: '400',
//                 Result: 'false',
//                 ResponseMsg: "You can't transfer ticket to yourself!"
//             });
//         }

//         if (dates.length === 0) {
//             return res.status(400).json({
//                 ResponseCode: '400',
//                 Result: 'false',
//                 ResponseMsg: 'No dates provided for ticket transfer.'
//             });
//         }

//         const selected_dates_count = dates.length;
//         const available_dates = [];

//         for (const dateString of dates) {
//             // Convert date string to Date object for querying MongoDB
//             // Ensure queryDate matches the format 'YYYY-MM-DDT00:00:00.000+00:00'
//             const queryDate = new Date(new Date(dateString).setUTCHours(0, 0, 0, 0))
//             .toISOString()
//             .replace('Z', '+00:00');

            
          



//             console.log('Checking availability for date:', queryDate);
//             console.log('User ID:', user._id);
//             console.log('Type ID:', type_id);


//             // const ticket_count = await Booking.countDocuments({
//             //     user_id: user._id,
//             //     typeid: type_id,
//             //     date: queryDate,
//             //     booking_status: 'Booked' // Only count 'Booked' tickets as available for transfer
//             // });


           


//           const tickets = await Booking.findOne({
//             user_id: user._id,
//             typeid: type_id,
//             date: queryDate,
//             booking_status: 'Booked', // Only count 'Booked' tickets as available for transfer
//           });

//             // console.log(`Tickets available for transfer on ${dateString}:`, ticket_count);
//           if (qty <= tickets.total_ticket) {
//                 available_dates.push(dateString);
//             }
//         }
//         console.log('Available dates for transfer:', available_dates);
//         console.log('Selected dates count:', selected_dates_count);
//         if (available_dates.length === selected_dates_count) {
//             for (const dateString of available_dates) {
//                 const queryDate = new Date(dateString);

//                 // Find and update tickets
//                 const ticketsToTransfer = await Booking.find({
//                     user_id: user._id,
//                     typeid: type_id,
//                     date: queryDate,
//                     booking_status: 'Booked'
//                 }).limit(qty);

//                 const ticketIds = ticketsToTransfer.map(ticket => ticket._id);

//                 if (ticketIds.length > 0) {
//                     await Booking.updateMany(
//                         { _id: { $in: ticketIds } },
//                         { $set: { user_id: to_user._id } } // Update user_id of the tickets
//                     );

//                     // Log each individual ticket transfer
//                     for (const tid of ticketIds) {
//                         // Assuming you have a TransferTicket model
//                         // await TransferTicket.create({
//                         //     tid: tid,
//                         //     from_user_id: user._id,
//                         //     to_user_id: to_user._id,
//                         //     transfer_date: new Date(),
//                         // });
//                         console.log(`Ticket ${tid} transferred from ${user._id} to ${to_user._id}`);
//                     }
//                 }
//             }

//             // Log the overall transfer to transfer_ticket_log (if you have a separate collection/table)
//             // This mirrors DB::table('transfer_ticket_log')->insert in PHP
//             // Assuming a 'TransferLog' model for this
//             await TransferLog.create({
//                 from_user_id: user._id,
//                 to_user_id: to_user._id,
//                 quantity: qty,
//                 type_id: type_id,
//             });
            
//             console.log(`Logged overall transfer: From ${user._id} to ${to_user._id}, Qty: ${qty}, Type ID: ${type_id}`);

//             let smsResult = {
//               success: false,
//               message: 'Ticket transfer SMS failed'
//             };

//             // const smsResult = await sendTransferSms(mobile, qty);
//               smsResult.success = true; // Simulate SMS success, replace with actual SMS sending logic
//             if (smsResult.success) {
//                 return res.status(200).json({
//                     ResponseCode: '200',
//                     Result: 'true',
//                     ResponseMsg: 'Ticket Transfer Successfully'
//                 });
//             } else {
//                 return res.status(401).json({ // Changed to 400 or 500 based on SMS error nature
//                     ResponseCode: '401',
//                     Result: 'false',
//                     ResponseMsg: smsResult.message
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 ResponseCode: '400',
//                 Result: 'false',
//                 ResponseMsg: 'You have not enough ticket to transfer on selected date!'
//             });
//         }

    

//   } catch (err) {
//     console.error('Transfer ticket error:', err.message);
//     res.status(500).json({
//       success: false,
//       message: err.message || 'Internal server error'
//     });
//   }
// };


export const transferTicket = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.roles !== 'user' && user.role !== 'user')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only users can transfer tickets' });
    }

    // console.log('Transfer ticket request body:', req.body);

    const { type_id, date: dates, mobile, qty } = req.body;

    if (!Array.isArray(dates) || dates.length === 0 || !qty || qty <= 0) {
      return res.status(400).json({
        ResponseCode: '400',
        Result: 'false',
        ResponseMsg: 'Invalid date array or quantity.',
      });
    }

    // Step 1: Find or create recipient user
    let to_user = await User.findOne({ phone: mobile, role: 'user' });

    if (!to_user) {
      const randomPassword = '123456';
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      to_user = await User.create({
        fullName: 'User' + Math.floor(1000 + Math.random() * 9000),
        email: uuidv4().substring(0, 10) + '@gmail.com',
        phone: mobile,
        password: hashedPassword,
        role: 'user',
        isverified: 1,
      });
    }

    if (user._id.toString() === to_user._id.toString()) {
      return res.status(400).json({
        ResponseCode: '400',
        Result: 'false',
        ResponseMsg: "You can't transfer ticket to yourself!",
      });
    }

    // console.log('datestring:', dates);

    const successfullyTransferredDates = [];

    for (const dateString of dates) {
      const queryDate = new Date(new Date(dateString).setUTCHours(0, 0, 0, 0));
      const formattedDate = queryDate.toISOString();

      const senderBooking = await Booking.findOne({
        user_id: user._id,
        typeid: type_id,
        date: formattedDate,
        booking_status: 'Booked',
        total_ticket: { $gte: qty }, // Ensure sender has enough tickets
      });

      // console.log('Sender booking:', senderBooking);

      if (!senderBooking || senderBooking.total_ticket < qty) {
        continue; // Skip this date if insufficient tickets
      }

      // Deduct from sender
      senderBooking.total_ticket -= qty;
      if (senderBooking.total_ticket <= 0) {
        await senderBooking.deleteOne();
      } else {
        await senderBooking.save();
      }

      // Add to recipient
      const recipientBooking = await Booking.findOne({
        user_id: to_user._id,
        typeid: type_id,
        date: formattedDate,
        booking_status: 'Booked',
      });

      if (recipientBooking) {
        recipientBooking.total_ticket += qty;
        await recipientBooking.save();
      } else {
        await Booking.create({
          user_id: to_user._id,
          typeid: type_id,
          date: formattedDate,
          type: senderBooking.type,
          eid: senderBooking.eid,
          class_id: senderBooking.class_id || null,
          zone: senderBooking.zone || null,
          total_ticket: qty,
          price: senderBooking.price,
          subtotal: senderBooking.price * qty,
          booking_status: 'Booked',
          profile_photo: senderBooking.profile_photo || '',
          aadhar_card: senderBooking.aadhar_card || '',
          qr_code: senderBooking.qr_code || '',
        });
      }

      successfullyTransferredDates.push({ date: dateString, qty });
    }

    // console.log('Successfully transferred dates:', successfullyTransferredDates);

    if (successfullyTransferredDates.length === 0) {
      return res.status(400).json({
        ResponseCode: '400',
        Result: 'false',
        ResponseMsg: 'You do not have enough tickets to transfer on the selected date(s).',
      });
    }

    // Log overall transfer
    await TransferLog.create({
      from_user_id: user._id,
      to_user_id: to_user._id,
      quantity: qty * successfullyTransferredDates.length,
      type_id: type_id,
    });

    const ticketType = await Ticket.findOne({ _id: type_id });

     const smsParams = {
            authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
            route: "dlt",
            sender_id: "HEMZNX",
            message: "5090",
            variables_values: qty * successfullyTransferredDates.length + ' ' + ticketType?.ticketType,
            numbers: to_user.phone,
            flash: "0"
          };
    
        // --- Updated SMS send logic as per new API ---
        
    
        try {
          const queryString = new URLSearchParams(smsParams).toString();
          // Use the new SMS API endpoint for sending SMS
          const url = `https://sms.nexprism.in/dev/api?${queryString}`;
          console.log('SMS API URL:', url);
          const response = await axios.get(
            url,
            {
              timeout: 30000
            }
          );
    
          console.log('SMS API response:', response.data);
          const result = response.data;
          if (result && result.return) {
            return res.status(200).json({
              ResponseCode: '200',
              Result: 'true',
              ResponseMsg: `Ticket Transfer Successful`,
              transferred: successfullyTransferredDates,
            });
          }
        } catch (error) {
          console.error('Error sending SMS:', error.message);
        }

    // return res.status(200).json({
    //   ResponseCode: '200',
    //   Result: 'true',
    //   ResponseMsg: `Ticket Transfer Successful`,
    //   transferred: successfullyTransferredDates,
    // });

  } catch (err) {
    console.error('Transfer ticket error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};




// Controller 12/08/2025

export const getBookingsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    let user_id = null;
    if (user && (user.roles === 'user' || user.role === 'user')) {
      user_id = user._id;
    }

    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      searchFields,
      ...filters
    } = req.query;

    let search = {};
    if (searchFields) {
      try {
        search = typeof searchFields === 'string' ? JSON.parse(searchFields) : searchFields;
      } catch (error) {
        console.log('Error parsing searchFields:', error);
        search = {};
      }
    }

    const options = {
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit),
      filters: { ...filters, category: categoryId, user_id },
      search,
    };

    const bookings = await bookingService.getBookingsByCategory(options);

    res.status(200).json({
      success: true,
      message: 'Bookings fetched successfully',
      ...bookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


  
// 12/08/2025
// export const getBookingsByCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const user = req.user;

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ success: false, message: 'Invalid category ID' });
//     }

//     let user_id = null;
//     if (user && (user.roles === 'user' || user.role === 'user')) {
//       user_id = user._id;
//     }

//     const { sortBy = 'createdAt', sortOrder = 'desc', searchFields, ...filters } = req.query;

//     let search = {};
//     if (searchFields) {
//       try {
//         search = typeof searchFields === 'string' ? JSON.parse(searchFields) : searchFields;
//       } catch (error) {
//         console.log('Error parsing searchFields:', error);
//         search = {};
//       }
//     }

//     const options = {
//       sortBy,
//       sortOrder,
//       filters: { ...filters, category: categoryId, user_id },
//       search,
//     };

//     const bookings = await bookingService.getBookingsByCategory(options);

//     res.status(200).json({
//       success: true,
//       message: 'Bookings fetched successfully',
//       ...bookings,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



export const listInvoices = async (req, res) => {
  console.log('Listing invoices for user:', req.user);
  try {
    // Only show invoices for the logged-in user
    const userId = req.user._id;
    const invoices = await Invoice.find({ user_id: userId }).sort({ created_at: -1 }).populate('user_id', 'fullName email phone');
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    console.log('Downloading invoice with ID:', req.params.id);
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    // Only allow the user who owns the invoice to download
    if (String(invoice.user_id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    // Resolve the file path
    const filePath = path.join(process.cwd(), invoice.invoice_url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice._id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// export const createBookingAsAdmin = async (req, res) => {
//   try {
//     // const { user_id, tickets } = req.body;
//   console.log('Admin booking request body:', req.body);
   

   
//     const booking = await bookingService.createBookingByAdmin(req.body);

//     res.status(201).json({
//       success: true,
//       message: 'Booking created by admin',
//       data: booking,
//     });
//   } catch (err) {
//     console.error('Admin booking error:', err.message);
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
export const createBookingAsAdmin = async (req, res) => {
  try {
    console.log('Admin booking request body:', req.body);

    // ✅ Inject admin ID from the authenticated user into the body
    const adminId = req.user?._id;
    const payload = {
      ...req.body,
      admin_id: adminId, // 👈 Pass it to service
    };

    const booking = await bookingService.createBookingByAdmin(payload);

    res.status(201).json({
      success: true,
      message: 'Booking created by admin',
      data: booking,
    });
  } catch (err) {
    console.error('Admin booking error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBooking(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const profilePhotoPath = req.files?.profile_photo?.[0]?.path || null;
    const aadharCardPath = req.files?.aadhar_card?.[0]?.path || null;

    const updates = {
      ...req.body,
      ...(profilePhotoPath && { profile_photo: profilePhotoPath }),
      ...(aadharCardPath && { aadhar_card: aadharCardPath }),
    };

    const updatedBooking = await bookingService.updateBooking(id, updates);

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking,
    });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }
    // Find booking
    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
  
    // Check admin role and ticket type
    const adminRole = req.user?.role;
    const ticketType = booking?.eid?._id;
    let allowed = false;

    if (req.user && req.user.type) {
      const type = req.user.type;
      if (ticketType.toString() === type.toString()) allowed = true;
      
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Only ${ticketType == "6846af4d9968b7820276967f" ? "admin_3.5" : ticketType == "684681fe6e43be0460f617a4" ? "admin_3.0" : "admin"} can verify this ticket.`,
      });
    }
  }

    
    // Only log if not already verified
    if (booking.booking_status === 'Verified') {
      return res.status(200).json({ success: false, message: 'Booking already verified', data: booking });
    }
    // console.log('Booking status:', booking.booking_status);
    // Save scan log only if not already verified
    const scanLog = {
      booking_id: booking._id,
      scanned_at: new Date(),
      scanned_by: req.user?._id
    };

    console.log('Scan log to be created:', scanLog);
    await ScanLog.create(scanLog);
    // Verify booking
    const result = await bookingService.verifyBookingById(bookingId);
    console.log('Booking verified:', result);
    res.status(200).json({ success: true, message: 'Booking verified', data: result.booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const exportScanLogsExcel = async (req, res) => {
  try {
    const scanLogs = await ScanLog.find()
      .populate({
        path: 'booking_id',
        populate: [
          { path: 'user_id', model: 'User' },
          { path: 'eid', model: 'Event' },
          { path: 'typeid', model: 'Ticket' },
          { path: 'class_id', model: 'GarbaClass' } 
        ]
      })
      .populate({ path: 'scanned_by', model: 'Admin' })
      .lean(); // Added .lean() for better performance

    console.log('Scan logs fetched:', JSON.stringify(scanLogs, null, 2));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scan Logs');

    worksheet.columns = [
      { header: 'Booking ID', key: 'booking_id', width: 20 },
      { header: 'Booking Status', key: 'booking_status', width: 15 },
      { header: 'User Name', key: 'user_name', width: 25 },
      { header: 'User Email', key: 'user_email', width: 30 },
      { header: 'User Phone', key: 'user_phone', width: 20 },
      { header: 'Event Name', key: 'event_name', width: 25 },
      { header: 'Ticket Type', key: 'ticket_type', width: 20 },
      // { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Booking Date', key: 'booking_date', width: 20 },
      { header: 'Total Tickets', key: 'total_ticket', width: 15 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Scanned At', key: 'scanned_at', width: 25 },
      // { header: 'Scanned By Name', key: 'scanned_by_name', width: 25 },
      { header: 'Scanned By Email', key: 'scanned_by_email', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 25 },
      { header: 'Updated At', key: 'updatedAt', width: 25 },
      { header: 'Is Expired', key: 'is_expiry', width: 12 },
      { header: 'QR Code Path', key: 'qr_code', width: 30 }
    ];

    // Process each scan log
    scanLogs.forEach(log => {
      const booking = log.booking_id;
      const user = booking?.user_id;
      const event = booking?.eid;
      const ticket = booking?.typeid;
      const scannedBy = log.scanned_by;

      worksheet.addRow({
        booking_id: booking?.booking_id || '',
        booking_status: booking?.booking_status || '',
        user_name: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
        user_email: user?.email || '',
        user_phone: user?.phone || user?.mobile || '',
        event_name: event?.name || event?.title || '',
        // event_date: event?.date ? new Date(event.date).toLocaleDateString() : '',
        ticket_type: ticket?.ticketType || ticket?.type || booking?.type || '',
        // zone: booking?.zone || '',
        booking_date: booking?.date ? new Date(booking.date).toLocaleDateString() : '',
        total_ticket: booking?.total_ticket || '',
        price: booking?.price || '',
        subtotal: booking?.subtotal || '',
        scanned_at: log.scanned_at ? new Date(log.scanned_at).toLocaleString() : '',
        scanned_by_email: scannedBy?.email || '',
        createdAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
        updatedAt: log.updatedAt ? new Date(log.updatedAt).toLocaleString() : '',
        is_expiry: booking?.is_expiry ? 'Yes' : 'No',
        qr_code: booking?.qr_code || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=scan_logs_' + new Date().toISOString().split('T')[0] + '.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error exporting scan logs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportBookingLogsExcel = async (req, res) => {
  try {
    // Accept query params: bookingId, eid (event id)
    const { bookingId, eid } = req.query;

    let bookings;
    if (bookingId) {
      // Single booking export
      bookings = await mongoose.model('Booking').find({ booking_id: bookingId })
        .populate([
          { path: 'user_id', model: 'User' },
          { path: 'class_id', model: 'GarbaClass' },
          { path: 'eid', model: 'Event' },
          { path: 'typeid', model: 'Ticket' }
        ])
        .lean();
    } else if (eid) {
      // Filter by event id (3.5 or 3.2)
      bookings = await mongoose.model('Booking').find({ eid: { $in: [eid] } })
        .populate([
          { path: 'user_id', model: 'User' },
          { path: 'class_id', model: 'GarbaClass' },
          { path: 'eid', model: 'Event' },
          { path: 'typeid', model: 'Ticket' }
        ])
        .lean();
    } else {
      // All bookings for both event ids
      bookings = await mongoose.model('Booking').find({ eid: { $in: ['684681fe6e43be0460f617a4', '6846af4d9968b7820276967f'] } })
        .populate([
          { path: 'user_id', model: 'User' },
          { path: 'class_id', model: 'GarbaClass' },
          { path: 'eid', model: 'Event' },
          { path: 'typeid', model: 'Ticket' }
        ])
        .lean();
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Booking Logs');

    worksheet.columns = [
      { header: 'Booking ID', key: 'booking_id', width: 20 },
      { header: 'Booking Status', key: 'booking_status', width: 15 },
      { header: 'User Name', key: 'user_name', width: 25 },
      { header: 'User Email', key: 'user_email', width: 30 },
      { header: 'User Phone', key: 'user_phone', width: 20 },
      { header: 'Event Name', key: 'event_name', width: 25 },
      { header: 'Ticket Type', key: 'ticket_type', width: 20 },
      { header: 'Class', key: 'class', width: 20 },
      { header: 'Booking Date', key: 'booking_date', width: 20 },
      { header: 'Total Tickets', key: 'total_ticket', width: 15 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 25 },
      { header: 'Updated At', key: 'updatedAt', width: 25 },
      { header: 'Is Expired', key: 'is_expiry', width: 12 },
      { header: 'QR Code Path', key: 'qr_code', width: 30 }
    ];

    bookings.forEach(booking => {
      const user = booking?.user_id;
      const event = booking?.eid;
      const ticket = booking?.typeid;
      worksheet.addRow({
        booking_id: booking?.booking_id || '',
        booking_status: booking?.booking_status || '',
        user_name: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
        user_email: user?.email || '',
        user_phone: user?.phone || user?.mobile || '',
        event_name: event?.name || event?.title || '',
        ticket_type: ticket?.ticketType || ticket?.type || booking?.type || '',
        class: booking?.class_id?.name || '',
        booking_date: booking?.date ? new Date(booking.date).toLocaleDateString() : '',
        total_ticket: booking?.total_ticket || '',
        price: booking?.price || '',
        subtotal: booking?.subtotal || '',
        createdAt: booking?.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
        updatedAt: booking?.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '',
        is_expiry: booking?.is_expiry ? 'Yes' : 'No',
        qr_code: booking?.qr_code || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=booking_logs_' + new Date().toISOString().split('T')[0] + '.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error exporting booking logs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const exportTransferLogsExcel = async (req, res) => {
  try {
    const { from_user_id, to_user_id, type_id } = req.query;
    const filter = {};
    if (from_user_id) filter.from_user_id = from_user_id;
    if (to_user_id) filter.to_user_id = to_user_id;
    if (type_id) filter.type_id = type_id;

    const logs = await TransferLog.find(filter)
      .populate('from_user_id', 'fullName email phone')
      .populate('to_user_id', 'fullName email phone')
      .populate('type_id', 'ticketType type')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transfer Logs');

    worksheet.columns = [
      { header: 'From User Name', key: 'from_user_name', width: 25 },
      { header: 'From User Email', key: 'from_user_email', width: 30 },
      { header: 'From User Phone', key: 'from_user_phone', width: 20 },
      { header: 'To User Name', key: 'to_user_name', width: 25 },
      { header: 'To User Email', key: 'to_user_email', width: 30 },
      { header: 'To User Phone', key: 'to_user_phone', width: 20 },
      { header: 'Ticket Type', key: 'ticket_type', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    logs.forEach(log => {
      worksheet.addRow({
        from_user_name: log.from_user_id?.fullName || '',
        from_user_email: log.from_user_id?.email || '',
        from_user_phone: log.from_user_id?.phone || '',
        to_user_name: log.to_user_id?.fullName || '',
        to_user_email: log.to_user_id?.email || '',
        to_user_phone: log.to_user_id?.phone || '',
        ticket_type: log.type_id?.ticketType || log.type_id?.type || '',
        quantity: log.quantity,
        createdAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transfer_logs_' + new Date().toISOString().split('T')[0] + '.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error exporting transfer logs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getTransferLogs = async (req, res) => {
  try {
    console.log("Fetching transfer logs for user:", req.user?._id);
    const result = await bookingService.getTransferLogsService(req);

    return res.status(200).json({
      success: true,
      message: "Transfer logs fetched successfully",
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error("Error fetching transfer logs:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getDashboardAnalytics = async (req, res) => {
  try {
    const { eventId, startDate, endDate, ticketTypeId } = req.query;
    const data = await bookingService.getDashboardAnalytics({ eventId, startDate, endDate, ticketTypeId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add this function to your bookingController.js file

export const exportAllBookingsExcel = async (req, res) => {
  try {
    const { eid, booking_status, typeid, user_id, startDate, endDate, zone, payment_type } = req.query;

    const filter = {};

    if (eid) filter.eid = eid;
    if (booking_status) filter.booking_status = booking_status;
    if (typeid) filter.typeid = typeid;
    if (user_id) filter.user_id = user_id;
    if (zone) filter.zone = zone;
    if (payment_type) filter.payment_type = payment_type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate([
        {
          path: 'user_id',
          model: 'User',
          select: 'fullName email phone'
        },
        {
          path: 'class_id',
          model: 'User', // Assuming class is a user (Garba class)
          select: 'fullName zone'
        },
        {
          path: 'eid',
          model: 'Event',
          select: 'name title category'
        },
        {
          path: 'typeid',
          model: 'Ticket',
          select: 'ticketType type event'
        }
      ])
      .sort({ createdAt: -1 })
      .lean();

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found with the specified filters.'
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Bookings');

    // Define headers
    worksheet.columns = [
      { header: 'Booking ID', key: 'booking_id', width: 20 },
      { header: 'Booking Status', key: 'booking_status', width: 15 },
      { header: 'User Name', key: 'user_name', width: 25 },
      { header: 'User Email', key: 'user_email', width: 30 },
      { header: 'User Phone', key: 'user_phone', width: 20 },
      { header: 'Event Name', key: 'event_name', width: 25 },
      { header: 'Ticket Type', key: 'ticket_type', width: 20 },
      { header: 'Class Name', key: 'class_name', width: 20 },
      { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Booking Date', key: 'booking_date', width: 20 },
      { header: 'Total Tickets', key: 'total_ticket', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'Payment Type', key: 'payment_type', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 25 },
      { header: 'Updated At', key: 'updatedAt', width: 25 },
      { header: 'QR Code Path', key: 'qr_code', width: 40 }
    ];

    // Populate data
    bookings.forEach(booking => {
      const user = booking.user_id || {};
      const event = booking.eid || {};
      const ticket = booking.typeid || {};
      const garbaClass = booking.class_id || {};

      const displayPrice =
        booking.payment_type === 'Complimentary'
          ? 'Complimentary'
          : `₹${booking.price?.toLocaleString('en-IN') || 0}`;

      const displaySubtotal =
        booking.payment_type === 'Complimentary'
          ? 'Complimentary'
          : `₹${booking.subtotal?.toLocaleString('en-IN') || 0}`;

      worksheet.addRow({
        booking_id: booking.booking_id || '',
        booking_status: booking.booking_status || '',
        user_name: user.fullName || '',
        user_email: user.email || '',
        user_phone: user.phone || '',
        event_name: event.name || event.title || '',
        // event_category: event.category || '',
        ticket_type: ticket.ticketType || ticket.type || booking.type || '',
        class_name: garbaClass.fullName || '',
        zone: booking.zone || '',
        booking_date: booking.date ? new Date(booking.date).toLocaleDateString('en-IN') : '',
        total_ticket: booking.total_ticket || 0,
        price: displayPrice,
        subtotal: displaySubtotal,
        payment_type: booking.payment_type || 'Online',
        remarks: booking.remarks || '',
        createdAt: new Date(booking.createdAt).toLocaleString('en-IN'),
        updatedAt: new Date(booking.updatedAt).toLocaleString('en-IN'),
        // is_expiry: booking.is_expiry ? 'Yes' : 'No',
        qr_code: booking.qr_code || ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Summary stats
    const totalBookings = bookings.length;
    const totalTickets = bookings.reduce((sum, b) => sum + (b.total_ticket || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => {
      return b.payment_type === 'Complimentary' ? sum : sum + (b.subtotal || 0);
    }, 0);

    const bookedCount = bookings.filter(b => b.booking_status === 'Booked').length;
    const verifiedCount = bookings.filter(b => b.booking_status === 'Verified').length;
    const cancelledCount = bookings.filter(b => b.booking_status === 'Cancelled').length;

    worksheet.addRow([]);
    worksheet.addRow(['SUMMARY STATISTICS']);
    worksheet.addRow(['Total Bookings', totalBookings]);
    worksheet.addRow(['Total Tickets', totalTickets]);
    worksheet.addRow(['Total Revenue (₹)', `₹${totalRevenue.toLocaleString('en-IN')}`]);
    worksheet.addRow(['Booked', bookedCount]);
    worksheet.addRow(['Verified', verifiedCount]);
    worksheet.addRow(['Cancelled', cancelledCount]);

    const summaryStartRow = worksheet.rowCount - 6;
    worksheet.getRow(summaryStartRow).font = { bold: true, size: 14 };
    for (let i = summaryStartRow + 1; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
      worksheet.getRow(i).getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F8FF' }
      };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `all_bookings_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting all bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to export bookings: ' + err.message
    });
  }
};








