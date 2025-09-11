import Ticket from '../models/Ticket.js';
import QRCode from 'qrcode';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import bookingRepo from '../repository/bookingRepo.js';
import TicketRepository from '../repository/ticketRepository.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import TicketTransferLogModel from '../models/TransferLog.js';
import transactionRepo from '../repository/TransactionRepository.js';
import axios from 'axios';
import xlsx from 'xlsx';
import { log } from 'console';
import userService from './userService.js';
import WalletHistory from '../models/WalletHistory.js';
import Transaction from '../models/Transaction.js';
import ScanLog from '../models/ScanLog.js';
import Booking from '../models/Booking.js';
import garbaClass from '../models/garbaClass.js';
// import PDFDocument from 'pdfkit';
// import puppeteer from 'puppeteer';
import Invoice from '../models/Invoice.js';
import { jsPDF } from 'jspdf';
import Event from "../models/Event.js";

// <-- Add this import (adjust path if needed)

// import UserService from './userService.js';

const ticketRepo = new TicketRepository();
const UserService = new userService();

class BookingService {



  // async createBooking(data, user, profilePhotoPath, aadharCardPath) {
  //   const { eid, class_id, date, tickets, is_wallet_use, transaction_id } = data;
  //   const bookings = [];

  //   if (!eid) throw new Error('Event ID (eid) is required');
  //   if (!Array.isArray(tickets) || tickets.length === 0) {
  //     throw new Error('At least one ticket entry is required');
  //   }

  //   // Calculate total booking amount
  //   let totalBookingAmount = 0;
  //   for (const ticket of tickets) {
  //     const { total_ticket, price } = ticket;
  //     totalBookingAmount += parseFloat(price) * parseInt(total_ticket);
  //   }

  //   let balance;
  //   if (is_wallet_use == 'true' || is_wallet_use == 1) {
  //     balance = user.balance ?? 0;
  //     if (balance < totalBookingAmount) {
  //       throw new Error('Insufficient wallet balance');
  //     }
  //   }

  //   for (const ticket of tickets) {
  //     const { typeid, total_ticket, price } = ticket;

  //     if (!typeid || !total_ticket || !price) {
  //       throw new Error(`Each ticket must include typeid, total_ticket, and price.`);
  //     }

  //     const isKhelaiya = ['684922cd22c00753b1ef80e0', '684b27ea8869c60f805f4ac9'].includes(typeid);

  //     const ticketTypeId = mongoose.Types.ObjectId.isValid(typeid)
  //       ? new mongoose.Types.ObjectId(typeid)
  //       : typeid;

  //     const ticketType = await ticketRepo.findById(ticketTypeId);
  //     if (!ticketType) throw new Error(`Invalid ticket type: ${typeid}`);

  //     const classUser = isKhelaiya
  //       ? await garbaClass.findOne({ _id: class_id, role: 'Garba Class' })
  //       : null;
  //     if (isKhelaiya && !classUser) {
  //       throw new Error('Invalid class ID for Khelaiya ticket');
  //     }

  //     const bookingDate = isKhelaiya ? null : (ticket.date || date || null);
  //     const ticketSubtotal = parseFloat(price) * parseInt(total_ticket);
  //     let saved;

  //     // 🆕 Merge logic for same-date, same-type (non-Khelaiya)
  //     if (!isKhelaiya) {
  //       const bookingQuery = {
  //         user_id: user._id,
  //         eid,
  //         typeid: ticketTypeId,
  //         date: bookingDate
  //       };

  //       const existingBooking = await bookingRepo.findOneByQuery(bookingQuery);

  //       if (existingBooking) {
  //         // Update booking totals
  //         const updatedTotalTicket = existingBooking.total_ticket + parseInt(total_ticket);
  //         const updatedSubtotal = existingBooking.subtotal + ticketSubtotal;

  //         saved = await bookingRepo.update(existingBooking._id, {
  //           total_ticket: updatedTotalTicket,
  //           subtotal: updatedSubtotal
  //         });

  //         // Create transaction for extra tickets
  //         await transactionRepo.create({
  //           booking_id: existingBooking._id,
  //           p_method_id: transaction_id ? 'razorpay' : 'wallet',
  //           transaction_id: transaction_id ? transaction_id : `wlt-${existingBooking._id}`,
  //           payment_type: 'Online',
  //           total_amt: ticketSubtotal,
  //           payment_status: 'Completed',
  //         });

  //         // Wallet debit if used
  //         if (is_wallet_use == 'true' || is_wallet_use == 1) {
  //           await UserService.debitUserWallet(user._id, ticketSubtotal);
  //           await WalletHistory.create({
  //             userId: user._id,
  //             type: 'debit',
  //             amount: ticketSubtotal,
  //             description: `Extra payment for ${parseInt(total_ticket)} ${ticketType.ticketType} tickets`,
  //           });
  //         }

  //         // Update invoice total
  //         const transactionId = (is_wallet_use == 'true')
  //           ? `wlt-${existingBooking._id}` || transaction_id 
  //           : transaction_id;
  //         let invoice = await Invoice.findOne({ transaction_id: transactionId });
  //         if (invoice) {
  //           invoice.total_amount += ticketSubtotal;
  //           if (!invoice.booking_ids.includes(existingBooking._id)) {
  //             invoice.booking_ids.push(existingBooking._id);
  //           }
  //           await invoice.save();
  //         }

  //         bookings.push({
  //           ...existingBooking.toObject(),
  //           total_ticket: updatedTotalTicket,
  //           subtotal: updatedSubtotal
  //         });

  //         continue; // Skip new booking creation
  //       }
  //     }

  //     // === New booking creation ===
  //     const bookingData = {
  //       user_id: user._id,
  //       eid,
  //       class_id: isKhelaiya ? class_id : null,
  //       typeid: ticketTypeId,
  //       type: ticketType.ticketType,
  //       zone: classUser ? classUser.zone : ticketType.zone,
  //       total_ticket: parseInt(total_ticket),
  //       price: parseFloat(price),
  //       subtotal: ticketSubtotal,
  //       date: bookingDate,
  //       profile_photo: profilePhotoPath || null,
  //       aadhar_card: aadharCardPath || null,
  //     };

  //     saved = await bookingRepo.create(bookingData);

  //     // Wallet debit
  //     if ((is_wallet_use == 'true') || is_wallet_use == 1) {
  //       await UserService.debitUserWallet(user._id, ticketSubtotal);
  //       await WalletHistory.create({
  //         userId: user._id,
  //         type: 'debit',
  //         amount: ticketSubtotal,
  //         description: `Booking payment for ${parseInt(total_ticket)} ${ticketType.ticketType} tickets`,
  //       });
  //     }

  //     // Generate QR code
  //     const qrData = saved.booking_id.toString();
  //     const fileName = `qr-${saved.booking_id}-v2.png`;
  //     const qrBuffer = await QRCode.toBuffer(qrData, {
  //       errorCorrectionLevel: 'H',
  //       version: 2,
  //       width: 500,
  //     });
  //     const logoPath = path.resolve('uploads/logo.png');
  //     const logo = await sharp(logoPath).resize(100, 100).toBuffer();
  //     const qrWithLogo = await sharp(qrBuffer)
  //       .composite([{ input: logo, gravity: 'center' }])
  //       .png()
  //       .toBuffer();
  //     const imagePath = path.resolve('uploads/qrcodes', fileName);
  //     fs.writeFileSync(imagePath, qrWithLogo);
  //     const qr_code_url = `/uploads/qrcodes/${fileName}`;
  //     saved.qr_code = qr_code_url;
  //     await bookingRepo.update(saved._id, { qr_code: qr_code_url });

  //     bookings.push(saved);

  //     // Create transaction
  //     const transaction = await transactionRepo.create({
  //       booking_id: saved._id,
  //       p_method_id: transaction_id ? 'razorpay' : 'wallet',
  //       transaction_id: transaction_id ? transaction_id : `wlt-${saved._id}`,
  //       payment_type: 'Online',
  //       total_amt: bookingData.subtotal,
  //       payment_status: 'Completed',
  //     });

  //     // Razorpay capture if applicable
  //     if (transaction_id) {
  //       try {
  //         const razorpayPaymentId = transaction_id;
  //         const amount = Math.round(bookingData.subtotal * 100);
  //         if (amount <= 0) {
  //           throw new Error('Invalid order amount for Razorpay payment capture.');
  //         }
  //         const currency = 'INR';
  //         const url = `https://api.razorpay.com/v1/payments/${razorpayPaymentId}/capture`;
  //         const apiKey = 'rzp_live_dgEoDbRJjpQk2w';
  //         const apiSecret = 'NIl8ViXy2pP04S7rC1NPo2TT';
  //         const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  //         const headers = {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Basic ${auth}`,
  //         };
  //         const postData = { amount, currency };
  //         const razorpayRes = await axios.post(url, postData, { headers });
  //         if (razorpayRes.status !== 200 && razorpayRes.status !== 201) {
  //           throw new Error('Failed to capture payment with Razorpay.');
  //         }
  //       } catch (err) {
  //         throw new Error('Failed to capture payment with Razorpay: ' + (err.response?.data?.error?.description || err.message));
  //       }
  //     }
  //   }

  //   // === Invoice PDF Generation ===
  //   const invoicePath = path.resolve('uploads/invoices');
  //   if (!fs.existsSync(invoicePath)) {
  //     fs.mkdirSync(invoicePath, { recursive: true });
  //   }
  //   const invoiceFileName = `invoice-${Date.now()}-${user._id}.pdf`;
  //   const invoiceFullPath = path.join(invoicePath, invoiceFileName);

  //   try {
  //     const doc = new jsPDF();
  //     // ... (keep your existing PDF generation code exactly as before)
  //          // Header - Orange background
  //     doc.setFillColor(244, 102, 19); // #F46613
  //     doc.rect(0, 0, 210, 35, 'F');
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFontSize(24);
  //     doc.text('Booking Invoice', 105, 25, { align: 'center' });
      
  //     // Reset text color to black
  //     doc.setTextColor(0, 0, 0);
      
  //     // Invoice Details Section
  //     let yPos = 55;
      
  //     // Section header
  //     doc.setFontSize(16);
  //     doc.setTextColor(244, 102, 19);
  //     doc.text('Invoice Details', 20, yPos);
      
  //     // Create info box background
  //     doc.setFillColor(248, 249, 250); // Light gray background
  //     doc.rect(20, yPos + 5, 170, 65, 'F');
      
  //     // Add orange left border
  //     doc.setFillColor(244, 102, 19);
  //     doc.rect(20, yPos + 5, 3, 65, 'F');
      
  //     yPos += 20;
  //     doc.setFontSize(11);
  //     doc.setTextColor(0, 0, 0);
      
  //     // Customer details with better formatting
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Customer Name:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text(`${user.fullName || user.email}`, 75, yPos);
      
  //     yPos += 8;
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Customer Mobile:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text(`${user.phone || 'N/A'}`, 75, yPos);
      
  //     yPos += 8;
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Invoice Date:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text(`${new Date().toLocaleDateString()}`, 75, yPos);
      
  //     yPos += 8;
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Transaction ID:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text(`${transaction_id || 'N/A'}`, 75, yPos);
      
  //     yPos += 8;
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Payment Method:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text(`${is_wallet_use == 'true' ? 'Wallet' : 'Razorpay'}`, 75, yPos);
      
  //     yPos += 8;
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Payment Status:', 25, yPos);
  //     doc.setFont('helvetica', 'normal');
  //     doc.setTextColor(46, 125, 50); // Green color for "Paid"
  //     doc.text('Paid', 75, yPos);
      
  //     // Table Header
  //     yPos += 25;
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFillColor(244, 102, 19); // Orange header
  //     doc.rect(20, yPos, 170, 12, 'F');
      
  //     doc.setFontSize(10);
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('TICKET TYPE', 25, yPos + 8);
  //     doc.text('QTY', 90, yPos + 8);
  //     doc.text('UNIT PRICE', 120, yPos + 8);
  //     doc.text('SUBTOTAL', 160, yPos + 8);
      
  //     // Table Content
  //     yPos += 18;
  //     doc.setTextColor(0, 0, 0);
  //     doc.setFontSize(10);
  //     doc.setFont('helvetica', 'normal');
      
  //     let isEvenRow = false;
  //     bookings.forEach((booking, index) => {
  //       // Alternate row background
  //       if (isEvenRow) {
  //         doc.setFillColor(248, 249, 250);
  //         doc.rect(20, yPos - 3, 170, 12, 'F');
  //       }
        
  //       doc.text(booking.type, 25, yPos + 5);
  //       doc.text(booking.total_ticket.toString(), 95, yPos + 5);
  //       doc.setTextColor(46, 125, 50); // Green for price
  //       doc.text(`₹${booking.price}`, 125, yPos + 5);
  //       doc.text(`₹${booking.subtotal}`, 165, yPos + 5);
  //       doc.setTextColor(0, 0, 0); // Reset to black
        
  //       yPos += 12;
  //       isEvenRow = !isEvenRow;
  //     });
      
  //     // Total Section
  //     yPos += 15;
  //     const total = bookings.reduce((sum, b) => sum + b.subtotal, 0);
      
  //     // Total background box
  //     doc.setFillColor(232, 244, 253); // Light blue background
  //     doc.rect(20, yPos, 170, 35, 'F');
      
  //     // Orange border around total section
  //     doc.setDrawColor(244, 102, 19);
  //     doc.setLineWidth(2);
  //     doc.rect(20, yPos, 170, 35);
      
  //     // Rupee symbol circle
  //     doc.setFillColor(244, 102, 19);
  //     doc.circle(35, yPos - 5, 8, 'F');
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFontSize(14);
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('₹', 32, yPos - 2);
      
  //     // Subtotal
  //     yPos += 15;
  //     doc.setTextColor(0, 0, 0);
  //     doc.setFontSize(12);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('Subtotal:', 25, yPos);
  //     doc.text(`₹${total}`, 165, yPos);
      
  //     // Horizontal line
  //     doc.setDrawColor(244, 102, 19);
  //     doc.setLineWidth(1);
  //     doc.line(25, yPos + 3, 185, yPos + 3);
      
  //     // Final Total
  //     yPos += 12;
  //     doc.setFontSize(16);
  //     doc.setFont('helvetica', 'bold');
  //     doc.setTextColor(244, 102, 19);
  //     doc.text('Total Amount:', 25, yPos);
  //     doc.text(`₹${total}`, 165, yPos);
      
  //     // Footer
  //     yPos += 25;
  //     doc.setFontSize(8);
  //     doc.setTextColor(128, 128, 128);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('Thank you for your booking! Please keep this invoice for your records.', 105, yPos, { align: 'center' });
 
  //     const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  //     fs.writeFileSync(invoiceFullPath, pdfBuffer);
  //   } catch (error) {
  //     throw new Error('Failed to generate PDF invoice: ' + error.message);
  //   }

  //   // Save invoice URL to first booking
  //   const invoiceUrl = `/uploads/invoices/${invoiceFileName}`;
  //   await bookingRepo.update(bookings[0]._id, { invoice_url: invoiceUrl });

  //   // Save invoice record
  //   const transactionId = (is_wallet_use == 'true')
  //     ? `wlt-${bookings[0]._id}` || transaction_id 
  //     : transaction_id;
  //   if (transactionId) {
  //     let invoice = await Invoice.findOne({ transaction_id: transactionId });
  //     if (invoice) {
  //       const newIds = bookings.map(b => b._id).filter(id => !invoice.booking_ids.includes(id));
  //       if (newIds.length > 0) {
  //         invoice.booking_ids.push(...newIds);
  //         const total_amount = bookings.reduce((sum, b) => sum + b.subtotal, 0);
  //         invoice.payment_method = is_wallet_use == 'true' ? 'Wallet' : 'Razorpay';
  //         invoice.total_amount = total_amount;
  //         invoice.invoice_url = invoiceUrl;
  //         await invoice.save();
  //       }
  //     } else {
  //       await Invoice.create({
  //         transaction_id: transactionId,
  //         invoice_url: invoiceUrl,
  //         total_amount: bookings.reduce((sum, b) => sum + b.subtotal, 0),
  //         payment_method: is_wallet_use == 'true' ? 'Wallet' : 'Razorpay',
  //         payment_status: 'Paid',
  //         booking_ids: bookings.map(b => b._id),
  //         user_id: user._id,
  //         created_at: new Date()
  //       });
  //     }
  //   }

  //   return {
  //     bookings,
  //     invoice_url: invoiceUrl
  //   };
  // }

  async createBooking(data, user, profilePhotoPath, aadharCardPath) {
    const { eid, class_id, tickets, is_wallet_use, transaction_id } = data;
    const bookings = [];

    if (!eid) throw new Error('Event ID (eid) is required');
    if (!Array.isArray(tickets) || tickets.length === 0) {
      throw new Error('At least one ticket entry is required');
    }

    // Fetch event to get startDate
    const event = await Event.findById(eid);
    if (!event) throw new Error('Event not found');
    const eventStartDate = event.startDate;

    // Calculate total booking amount
    let totalBookingAmount = 0;
    for (const ticket of tickets) {
      const { total_ticket, price } = ticket;
      totalBookingAmount += parseFloat(price) * parseInt(total_ticket);
    }

    let balance;
    if (is_wallet_use == 'true' || is_wallet_use == 1) {
      balance = user.balance ?? 0;
      if (balance < totalBookingAmount) {
        throw new Error('Insufficient wallet balance');
      }
    }

    for (const ticket of tickets) {
      const { typeid, total_ticket, price } = ticket;

      if (!typeid || !total_ticket || !price) {
        throw new Error(`Each ticket must include typeid, total_ticket, and price.`);
      }

      const isKhelaiya = ['684922cd22c00753b1ef80e0', '684b27ea8869c60f805f4ac9'].includes(typeid);

      const ticketTypeId = mongoose.Types.ObjectId.isValid(typeid)
        ? new mongoose.Types.ObjectId(typeid)
        : typeid;

      const ticketType = await ticketRepo.findById(ticketTypeId);
      if (!ticketType) throw new Error(`Invalid ticket type: ${typeid}`);

      const classUser = isKhelaiya
        ? await garbaClass.findOne({ _id: class_id, role: 'Garba Class' })
        : null;
      if (isKhelaiya && !classUser) {
        throw new Error('Invalid class ID for Khelaiya ticket');
      }

      // Always use event.startDate for bookingDate (unless Khelaiya)
      const bookingDate = isKhelaiya ? null : eventStartDate;
      const ticketSubtotal = parseFloat(price) * parseInt(total_ticket);
      let saved;

      // Merge logic for same-date, same-type (non-Khelaiya)
      if (!isKhelaiya) {
        const bookingQuery = {
          user_id: user._id,
          eid,
          typeid: ticketTypeId,
          date: bookingDate
        };

        const existingBooking = await bookingRepo.findOneByQuery(bookingQuery);

        if (existingBooking) {
          // Update booking totals
          const updatedTotalTicket = existingBooking.total_ticket + parseInt(total_ticket);
          const updatedSubtotal = existingBooking.subtotal + ticketSubtotal;

          saved = await bookingRepo.update(existingBooking._id, {
            total_ticket: updatedTotalTicket,
            subtotal: updatedSubtotal
          });

          // Create transaction for extra tickets
          await transactionRepo.create({
            booking_id: existingBooking._id,
            p_method_id: transaction_id ? 'razorpay' : 'wallet',
            transaction_id: transaction_id ? transaction_id : `wlt-${existingBooking._id}`,
            payment_type: 'Online',
            total_amt: ticketSubtotal,
            payment_status: 'Completed',
          });

          // Wallet debit if used
          if (is_wallet_use == 'true' || is_wallet_use == 1) {
            await UserService.debitUserWallet(user._id, ticketSubtotal);
            await WalletHistory.create({
              userId: user._id,
              type: 'debit',
              amount: ticketSubtotal,
              description: `Extra payment for ${parseInt(total_ticket)} ${ticketType.ticketType} tickets`,
            });
          }

          // Update invoice total
          const transactionId = (is_wallet_use == 'true')
            ? `wlt-${existingBooking._id}` || transaction_id 
            : transaction_id;
          let invoice = await Invoice.findOne({ transaction_id: transactionId });
          if (invoice) {
            invoice.total_amount += ticketSubtotal;
            if (!invoice.booking_ids.includes(existingBooking._id)) {
              invoice.booking_ids.push(existingBooking._id);
            }
            await invoice.save();
          }

          bookings.push({
            ...existingBooking.toObject(),
            total_ticket: updatedTotalTicket,
            subtotal: updatedSubtotal
          });

          continue; // Skip new booking creation
        }
      }

      // === New booking creation ===
      const bookingData = {
        user_id: user._id,
        eid,
        class_id: isKhelaiya ? class_id : null,
        typeid: ticketTypeId,
        type: ticketType.ticketType,
        zone: classUser ? classUser.zone : ticketType.zone,
        total_ticket: parseInt(total_ticket),
        price: parseFloat(price),
        subtotal: ticketSubtotal,
        date: bookingDate,
        profile_photo: profilePhotoPath || null,
        aadhar_card: aadharCardPath || null,
      };

      saved = await bookingRepo.create(bookingData);

      // Wallet debit
      if ((is_wallet_use == 'true') || is_wallet_use == 1) {
        await UserService.debitUserWallet(user._id, ticketSubtotal);
        await WalletHistory.create({
          userId: user._id,
          type: 'debit',
          amount: ticketSubtotal,
          description: `Booking payment for ${parseInt(total_ticket)} ${ticketType.ticketType} tickets`,
        });
      }

      // Generate QR code
      const qrData = saved.booking_id.toString();
      const fileName = `qr-${saved.booking_id}-v2.png`;
      const qrBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'H',
        version: 2,
        width: 500,
      });
      const logoPath = path.resolve('uploads/logo.png');
      const logo = await sharp(logoPath).resize(100, 100).toBuffer();
      const qrWithLogo = await sharp(qrBuffer)
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer();
      const imagePath = path.resolve('uploads/qrcodes', fileName);
      fs.writeFileSync(imagePath, qrWithLogo);
      const qr_code_url = `/uploads/qrcodes/${fileName}`;
      saved.qr_code = qr_code_url;
      await bookingRepo.update(saved._id, { qr_code: qr_code_url });

      bookings.push(saved);

      // Create transaction
      const transaction = await transactionRepo.create({
        booking_id: saved._id,
        p_method_id: transaction_id ? 'razorpay' : 'wallet',
        transaction_id: transaction_id ? transaction_id : `wlt-${saved._id}`,
        payment_type: 'Online',
        total_amt: bookingData.subtotal,
        payment_status: 'Completed',
      });

      // Razorpay capture if applicable
      if (transaction_id) {
        try {
          const razorpayPaymentId = transaction_id;
          const amount = Math.round(bookingData.subtotal * 100);
          if (amount <= 0) {
            throw new Error('Invalid order amount for Razorpay payment capture.');
          }
          const currency = 'INR';
          const url = `https://api.razorpay.com/v1/payments/${razorpayPaymentId}/capture`;
          const apiKey = 'rzp_live_dgEoDbRJjpQk2w';
          const apiSecret = 'NIl8ViXy2pP04S7rC1NPo2TT';
          const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          };
          const postData = { amount, currency };
          const razorpayRes = await axios.post(url, postData, { headers });
          if (razorpayRes.status !== 200 && razorpayRes.status !== 201) {
            throw new Error('Failed to capture payment with Razorpay.');
          }
        } catch (err) {
          throw new Error('Failed to capture payment with Razorpay: ' + (err.response?.data?.error?.description || err.message));
        }
      }
    }

    // === Invoice PDF Generation ===
    const invoicePath = path.resolve('uploads/invoices');
    if (!fs.existsSync(invoicePath)) {
      fs.mkdirSync(invoicePath, { recursive: true });
    }
    const invoiceFileName = `invoice-${Date.now()}-${user._id}.pdf`;
    const invoiceFullPath = path.join(invoicePath, invoiceFileName);

    try {
      const doc = new jsPDF();
      // ... (keep your existing PDF generation code exactly as before)
           // Header - Orange background
      doc.setFillColor(244, 102, 19); // #F46613
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Booking Invoice', 105, 25, { align: 'center' });
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0);
      
      // Invoice Details Section
      let yPos = 55;
      
      // Section header
      doc.setFontSize(16);
      doc.setTextColor(244, 102, 19);
      doc.text('Invoice Details', 20, yPos);
      
      // Create info box background
      doc.setFillColor(248, 249, 250); // Light gray background
      doc.rect(20, yPos + 5, 170, 65, 'F');
      
      // Add orange left border
      doc.setFillColor(244, 102, 19);
      doc.rect(20, yPos + 5, 3, 65, 'F');
      
      yPos += 20;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      // Customer details with better formatting
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Name:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user.fullName || user.email}`, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Mobile:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user.phone || 'N/A'}`, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Date:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${new Date().toLocaleDateString()}`, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction ID:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${transaction_id || 'N/A'}`, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Method:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${is_wallet_use == 'true' ? 'Wallet' : 'Razorpay'}`, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Status:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(46, 125, 50); // Green color for "Paid"
      doc.text('Paid', 75, yPos);
      
      // Table Header
      yPos += 25;
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(244, 102, 19); // Orange header
      doc.rect(20, yPos, 170, 12, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TICKET TYPE', 25, yPos + 8);
      doc.text('QTY', 90, yPos + 8);
      doc.text('UNIT PRICE', 120, yPos + 8);
      doc.text('SUBTOTAL', 160, yPos + 8);
      
      // Table Content
      yPos += 18;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let isEvenRow = false;
      bookings.forEach((booking, index) => {
        // Alternate row background
        if (isEvenRow) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos - 3, 170, 12, 'F');
        }
        
        doc.text(booking.type, 25, yPos + 5);
        doc.text(booking.total_ticket.toString(), 95, yPos + 5);
        doc.setTextColor(46, 125, 50); // Green for price
        doc.text(`₹${booking.price}`, 125, yPos + 5);
        doc.text(`₹${booking.subtotal}`, 165, yPos + 5);
        doc.setTextColor(0, 0, 0); // Reset to black
        
        yPos += 12;
        isEvenRow = !isEvenRow;
      });
      
      // Total Section
      yPos += 15;
      const total = bookings.reduce((sum, b) => sum + b.subtotal, 0);
      
      // Total background box
      doc.setFillColor(232, 244, 253); // Light blue background
      doc.rect(20, yPos, 170, 35, 'F');
      
      // Orange border around total section
      doc.setDrawColor(244, 102, 19);
      doc.setLineWidth(2);
      doc.rect(20, yPos, 170, 35);
      
      // Rupee symbol circle
      doc.setFillColor(244, 102, 19);
      doc.circle(35, yPos - 5, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('₹', 32, yPos - 2);
      
      // Subtotal
      yPos += 15;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 25, yPos);
      doc.text(`₹${total}`, 165, yPos);
      
      // Horizontal line
      doc.setDrawColor(244, 102, 19);
      doc.setLineWidth(1);
      doc.line(25, yPos + 3, 185, yPos + 3);
      
      // Final Total
      yPos += 12;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(244, 102, 19);
      doc.text('Total Amount:', 25, yPos);
      doc.text(`₹${total}`, 165, yPos);
      
      // Footer
      yPos += 25;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your booking! Please keep this invoice for your records.', 105, yPos, { align: 'center' });
 
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      fs.writeFileSync(invoiceFullPath, pdfBuffer);
    } catch (error) {
      throw new Error('Failed to generate PDF invoice: ' + error.message);
    }

    // Save invoice URL to first booking
    const invoiceUrl = `/uploads/invoices/${invoiceFileName}`;
    await bookingRepo.update(bookings[0]._id, { invoice_url: invoiceUrl });

    // Save invoice record
    const transactionId = (is_wallet_use == 'true')
      ? `wlt-${bookings[0]._id}` || transaction_id 
      : transaction_id;
    if (transactionId) {
      let invoice = await Invoice.findOne({ transaction_id: transactionId });
      if (invoice) {
        const newIds = bookings.map(b => b._id).filter(id => !invoice.booking_ids.includes(id));
        if (newIds.length > 0) {
          invoice.booking_ids.push(...newIds);
          const total_amount = bookings.reduce((sum, b) => sum + b.subtotal, 0);
          invoice.payment_method = is_wallet_use == 'true' ? 'Wallet' : 'Razorpay';
          invoice.total_amount = total_amount;
          invoice.invoice_url = invoiceUrl;
          await invoice.save();
        }
      } else {
        await Invoice.create({
          transaction_id: transactionId,
          invoice_url: invoiceUrl,
          total_amount: bookings.reduce((sum, b) => sum + b.subtotal, 0),
          payment_method: is_wallet_use == 'true' ? 'Wallet' : 'Razorpay',
          payment_status: 'Paid',
          booking_ids: bookings.map(b => b._id),
          user_id: user._id,
          created_at: new Date()
        });
      }
    }

    return {
      bookings,
      invoice_url: invoiceUrl
    };
  }



  async createBookingByAdmin(data) {
    const { eid, user_id, fullName, email, phone, zone, class_id, date, typeid, total_ticket, price, remarks, payment_type, complimentary_details,cash_amount   } = data;


      if (payment_type === 'Cash' && cash_amount != null && cash_amount < 0) {
    throw new Error('Cash amount cannot be negative');
  }

    if (!eid) throw new Error('Event ID (eid) is required');
    if (!typeid || !total_ticket || !price) {
      throw new Error('typeid, total_ticket, and price are required');
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    let user;
    if (user_id) {
      user = await User.findById(user_id);
      if (!user) throw new Error(`User not found with ID: ${user_id}`);
    } else {
      if (!fullName || !phone) {
        throw new Error('User fullName and phone are required if user_id is not provided');
      }

      // Try to find existing user by phone or email
      user = await User.findOne({ phone }) || (email ? await User.findOne({ email }) : null);

      // Create user if not exists
      if (!user) {
        user = await User.create({ fullName, email, phone });
      }
    }

    const isKhelaiya = ['684922cd22c00753b1ef80e0', '684b27ea8869c60f805f4ac9'].includes(typeid);

    const ticketTypeId = mongoose.Types.ObjectId.isValid(typeid)
      ? new mongoose.Types.ObjectId(typeid)
      : typeid;

    const ticketType = await ticketRepo.findById(ticketTypeId);
    if (!ticketType) throw new Error(`Invalid ticket type: ${typeid}`);

    console.log(zone, ticketType.zone);

    // ✅ NEW LOGIC: Check for existing booking with same user, event, ticket type, and date
    const existingBookingQuery = {
      user_id: user._id,
      eid,
      typeid: ticketTypeId,
    };

    // Add date condition only for non-Khelaiya tickets
    if (!isKhelaiya && date) {
      existingBookingQuery.date = new Date(date);
    } else if (isKhelaiya) {
      // For Khelaiya, also match class_id
      existingBookingQuery.class_id = class_id;
    }

    const existingBooking = await bookingRepo.findOneByQuery(existingBookingQuery);

    if (existingBooking && !isKhelaiya) {
      // ✅ UPDATE EXISTING BOOKING: Add to existing quantity and recalculate totals
      const newTotalTickets = existingBooking.total_ticket + parseInt(total_ticket);
      const newSubtotal = parseFloat(price) * newTotalTickets;

      const updatedBooking = await bookingRepo.update(existingBooking._id, {
        total_ticket: newTotalTickets,
        subtotal: newSubtotal,
        // Update other fields if needed
        remarks: remarks || existingBooking.remarks,
        payment_type: payment_type || existingBooking.payment_type,
        complimentary_details: payment_type === 'Complimentary' ? complimentary_details : existingBooking.complimentary_details,
        cash_amount: payment_type === 'Cash' ? (cash_amount ?? existingBooking.cash_amount) : existingBooking.cash_amount,
      });

      // Update transaction for the additional tickets
      await transactionRepo.create({
        user_id: user._id,
        booking_id: existingBooking._id,
        p_method_id: 'razorpay',
        transaction_id: `txn-add-${existingBooking._id}-${Date.now()}`,
        payment_type: payment_type || 'Online',
        total_amt: parseFloat(price) * parseInt(total_ticket), // Amount for new tickets only
        payment_status: 'Completed',
      });

      console.log(`Updated existing booking ${existingBooking.booking_id} - Added ${total_ticket} tickets`);

      // Send SMS for Khelaiya if needed
      if (isKhelaiya) {
        const smsParams = {
          authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
          route: "dlt",
          sender_id: "HEMZNX",
          message: "5087",
          variables_values: `${zone || ticketType.zone}|${price}|`,
          numbers: user.phone,
          flash: "0"
        };

        try {
          const queryString = new URLSearchParams(smsParams).toString();
          const url = `https://sms.nexprism.in/dev/api?${queryString}`;
          console.log('SMS API URL:', url);
          const response = await axios.get(url, { timeout: 30000 });
          console.log('SMS API response:', response.data);
        } catch (error) {
          console.error('Error sending SMS:', error.message);
        }
      }else{
         const ticketType = await Ticket.findOne({ _id: ticketTypeId });
        
             const smsParams = {
                    authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
                    route: "dlt",
                    sender_id: "HEMZNX",
                    message: "5090",
                    variables_values: parseInt(total_ticket)  + ' ' + ticketType?.ticketType,
                    numbers: user.phone,
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
                } catch (error) {
                  console.error('Error sending SMS:', error.message);
                }
      }

      return [updatedBooking];
    }

    console.log(`isKhelaiya: ${isKhelaiya}, class_id: ${class_id}, date: ${date}`);

    // ✅ CREATE NEW BOOKING: If no existing booking found, create new one
    const bookingData = {
      user_id: user._id,
      eid,
      class_id: isKhelaiya ? class_id : null,
      typeid: ticketTypeId,
      type: ticketType.ticketType,
      zone: zone,
      total_ticket: parseInt(total_ticket),
      price: parseFloat(price),
      subtotal: parseFloat(price) * parseInt(total_ticket),
      date: isKhelaiya ? null : (date || null),
      profile_photo: null,
      aadhar_card: null,
      remarks: remarks || '',
      payment_type: payment_type || 'Online',
      complimentary_details: payment_type == 'Complimentary' ? complimentary_details : null,
      cash_amount: payment_type === 'Cash' ? (cash_amount ?? 0) : 0, 
      created_by: data.admin_id || null,
    };

    console.log('Booking data by admin:', bookingData);

    const saved = await bookingRepo.create(bookingData);

    // ✅ Generate QR using only booking_id as string
    const qrData = saved.booking_id.toString();
    const fileName = `qr-${saved.booking_id}-v2.png`;

    const qrBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      version: 2,
      width: 500,
    });

    const logoPath = path.resolve('uploads/logo.png');
    const logo = await sharp(logoPath).resize(100, 100).toBuffer();

    const qrWithLogo = await sharp(qrBuffer)
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toBuffer();

    const imagePath = path.resolve('uploads/qrcodes', fileName);
    fs.writeFileSync(imagePath, qrWithLogo);

    const qr_code_url = `/uploads/qrcodes/${fileName}`;
    saved.qr_code = qr_code_url;
    await bookingRepo.update(saved._id, { qr_code: qr_code_url });

    await transactionRepo.create({
      user_id: user._id,
      booking_id: saved._id,
      p_method_id: 'razorpay',
      transaction_id: `txn-${saved._id}`,
      payment_type: payment_type || 'Online',
      total_amt: bookingData.subtotal,
      payment_status: 'Completed',
    });

    if (isKhelaiya) {
      const smsParams = {
        authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
        route: "dlt",
        sender_id: "HEMZNX",
        message: "5087",
        variables_values: `${zone || ticketType.zone}|${bookingData.price}|`,
        numbers: user.phone,
        flash: "0"
      };

      try {
        const queryString = new URLSearchParams(smsParams).toString();
        const url = `https://sms.nexprism.in/dev/api?${queryString}`;
        console.log('SMS API URL:', url);
        const response = await axios.get(url, { timeout: 30000 });
        console.log('SMS API response:', response.data);
      } catch (error) {
        console.error('Error sending SMS:', error.message);
      }
    }else{
      // Handle non-Khelaiya case
      const ticketType = await Ticket.findOne({ _id: ticketTypeId });
      const smsParams = {
        authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
        route: "dlt",
        sender_id: "HEMZNX",
        message: "5090",
        variables_values: parseInt(total_ticket)  + ' ' + ticketType?.ticketType,
        numbers: user.phone,
        flash: "0"
      };

      try {
        const queryString = new URLSearchParams(smsParams).toString();
        const url = `https://sms.nexprism.in/dev/api?${queryString}`;
        console.log('SMS API URL:', url);
        const response = await axios.get(url, { timeout: 30000 });
        console.log('SMS API response:', response.data);
      }
      catch (error) {
        console.error('Error sending SMS:', error.message);
      }

    }

    return [saved];
  }

  async getAllBookings({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = {}, filters = {} }) {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    return await bookingRepo.findAll({ skip, limit, sort, search, filters });
  }

  async getBookingCount(eventId, userId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) throw new Error('Invalid event ID');
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');
    return await bookingRepo.countByEvent(eventId, userId);
  }

  // async getBookingsByCategory({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters = {}, search = {} }) {
  //   const skip = (page - 1) * limit;
  //   const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  //   return await bookingRepo.findByCategory({ skip, limit, sort, filters, search });
  // }
// Service
async getBookingsByCategory({ sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, filters = {}, search = {} }) {
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  return await bookingRepo.findByCategory({ sort, filters, search, page, limit });
}



  async getBooking(id) {
    return await bookingRepo.findByBookingId(id);
  }

  async updateBooking(id, updates) {
    return await bookingRepo.update(id, updates);
  }

  async verifyBookingById(bookingId) {
    return await bookingRepo.verifyByBookingId(bookingId);
  }


  async bulkImportFromExcel(filePath) {
    const eventMap = {
      'Kesariya 3.0': '684681fe6e43be0460f617a4',
      'Kesariya 3.5': '6846af4d9968b7820276967f'
    };
    const khelaiyaTypeId = '684922cd22c00753b1ef80e0';

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const imported = [];

    for (const row of rows) {
      // Expect columns: Event, Name, Phone, TicketType, Zone, ClassId
      const eventName = row.Event?.trim();
      const eid = eventMap[eventName];
      if (!eid) {
        console.log('Skipped row: Unknown event', row);
        continue; // skip unknown event
      }

      const fullName = row.Name?.trim();
      const phone = row.Phone?.toString().trim();
      const ticketType = row.TicketType?.trim();
      const zone = row.Zone?.trim();
      // Find GrabaClass user by role and zone
      let classUser = await User.findOne({ role: 'GrabaClass', zone });
      const class_id = classUser ? classUser._id : null;
      if (!fullName || !phone || !ticketType || !zone) {
        console.log('Skipped row: Missing required fields', row);
        continue;
      }

      // Find or create user by phone
      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({ fullName, phone });
      }

      // Ticket type id
      let typeid = ticketType === 'Khelaiya' ? khelaiyaTypeId : null;
      if (!typeid) {
        console.log('Skipped row: Unknown ticket type', row);
        continue;
      }

      // Fetch price by zone from ticketRepo
      const ticketTypeObj = await ticketRepo.findById(typeid);
      if (!ticketTypeObj) {
        console.log('Skipped row: Ticket type not found in DB', row);
        continue;
      }

      // Find price for the given zone from ticketTypeObj.prices array
      let priceObj = Array.isArray(ticketTypeObj.prices)
        ? ticketTypeObj.prices.find(p => p.zone === zone)
        : null;
      let price = priceObj?.price;
      if (!price) {
        console.log('Skipped row: Zone price not found', row);
        continue;
      }

      // Prepare booking data (quantity static 1, email not required)
      const bookingData = {
        user_id: user._id,
        eid,
        class_id: ticketType === 'Khelaiya' ? class_id : null,
        typeid,
        type: ticketType,
        zone,
        total_ticket: 1,
        price: parseFloat(price),
        subtotal: parseFloat(price) * 1,
        date: null,
        profile_photo: null,
        aadhar_card: null,
        remarks: row.Remarks || ''
      };

      // Create booking
      const saved = await bookingRepo.create(bookingData);

      // Generate QR code
      const qrData = saved.booking_id.toString();
      const fileName = `qr-${saved.booking_id}-v2.png`;
      const qrBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'H',
        version: 2,
        width: 500,
      });
      const logoPath = path.resolve('uploads/logo.png');
      const logo = await sharp(logoPath).resize(100, 100).toBuffer();
      const qrWithLogo = await sharp(qrBuffer)
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer();
      const imagePath = path.resolve('uploads/qrcodes', fileName);
      fs.writeFileSync(imagePath, qrWithLogo);
      const qr_code_url = `/uploads/qrcodes/${fileName}`;
      saved.qr_code = qr_code_url;
      await bookingRepo.update(saved._id, { qr_code: qr_code_url });

      imported.push(saved);


      const smsParams = {
        authorization: 'oZrDs5pHw1xdu3KELvykzGFfPbB8T06Umtg2bQljcXR9Okih9CReuqxdLl1iFbJ6krPWuUszmTpc23A9',
        route: "dlt",
        sender_id: "HEMZNX",
        message: "5087",
        variables_values: `${zone || ticketType.zone}|${bookingData.price}|`,
        numbers: user.phone,
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
        // if (result && result.return) {
        //   return imported;
        // }
      } catch (error) {
        console.error('Error sending SMS:', error.message);
      }
    }

    return imported;
  }

  async getTransferLogsService(req) {
    try {
      const userId = req.user?._id;
      if (!userId) throw new Error("User ID not found in request");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filters = { from_user_id: userId };

      const [logs, total] = await Promise.all([
        bookingRepo.TicketTransferLog({ filter: filters, skip, limit }),
        TicketTransferLogModel.countDocuments(filters),
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in getTransferLogsService:", error);
      throw new Error("Failed to fetch transfer logs");
    }
  }

  // async getDashboardAnalytics({ eventId, startDate, endDate }) {
  //   const match = {};
  //   console.log(eventId, startDate, endDate);
  //   if (eventId) match.eid = mongoose.Types.ObjectId(eventId);
  //   if (startDate || endDate) {
  //     match.createdAt = {};
  //     if (startDate) match.date.$gte = new Date(startDate);
  //     if (endDate) match.date.$lte = new Date(endDate);
  //   }

  //   // Total Tickets & Booked/Verified
  //   const bookingAgg = await Booking.aggregate([
  //     { $match: match },
  //     {
  //       $group: {
  //         _id: '$booking_status',
  //         totalTickets: { $sum: '$total_ticket' }
  //       }
  //     }
  //   ]);
  //   let totalTickets = 0, bookedTickets = 0, verifiedTickets = 0;
  //   for (const row of bookingAgg) {
  //     totalTickets += row.totalTickets;
  //     if (row._id === 'Booked') bookedTickets = row.totalTickets;
  //     if (row._id === 'Verified') verifiedTickets = row.totalTickets;
  //   }

  //   // Total Income
  //   const transMatch = {};
  //   if (eventId || startDate || endDate) {
  //     // Join Transaction to Booking for event/date filter
  //     const bookingIds = await Booking.find(match).distinct('_id');
  //     transMatch.booking_id = { $in: bookingIds };
  //   }
  //   transMatch.payment_status = 'Completed';
  //   if (startDate || endDate) {
  //     transMatch.createdAt = {};
  //     if (startDate) transMatch.createdAt.$gte = new Date(startDate);
  //     if (endDate) transMatch.createdAt.$lte = new Date(endDate);
  //   }
  //   const incomeAgg = await Transaction.aggregate([
  //     { $match: transMatch },
  //     { $group: { _id: null, totalIncome: { $sum: '$total_amt' } } }
  //   ]);
  //   const totalIncome = incomeAgg[0]?.totalIncome || 0;

  //   // Verified tickets (alternative: count ScanLog entries)
  //   // const scanMatch = {};
  //   // if (eventId || startDate || endDate) {
  //   //   const bookingIds = await Booking.find(match).distinct('_id');
  //   //   scanMatch.booking_id = { $in: bookingIds };
  //   // }
  //   // if (startDate || endDate) {
  //   //   scanMatch.scanned_at = {};
  //   //   if (startDate) scanMatch.scanned_at.$gte = new Date(startDate);
  //   //   if (endDate) scanMatch.scanned_at.$lte = new Date(endDate);
  //   // }
  //   // const scanCount = await ScanLog.countDocuments(scanMatch);

  //   return {
  //     totalTickets,
  //     totalIncome,
  //     verifiedTickets,
  //     bookedTickets
  //   };
  // }

  // async getDashboardAnalytics({ eventId, startDate, endDate }) {

  //   // Build match object based on provided filters
  //   const match = {};
  //   if (eventId) {
  //     match.eid = new mongoose.Types.ObjectId(eventId);
  //   }
  //   if (startDate || endDate) {
  //     match.date = {};
  //     if (startDate) match.date.$gte = new Date(startDate);
  //     if (endDate) match.date.$lte = new Date(endDate);
  //   }

  //   // Aggregate ticket counts by booking_status
  //   const bookingAgg = await Booking.aggregate([
  //     { $match: match },
  //     {
  //       $group: {
  //         _id: '$booking_status',
  //         totalTickets: { $sum: '$total_ticket' }
  //       }
  //     }
  //   ]);
  //   let totalTickets = 0, bookedTickets = 0, verifiedTickets = 0;
  //   for (const row of bookingAgg) {
  //     totalTickets += row.totalTickets;
  //     if (row._id === 'Booked') bookedTickets = row.totalTickets;
  //     if (row._id === 'Verified') verifiedTickets = row.totalTickets;
  //   }

  //   // Get all booking IDs in the range
  //   const bookingIds = await Booking.find(match).distinct('_id');

  //   // Aggregate total income from completed transactions
  //   const incomeAgg = await Transaction.aggregate([
  //     { $match: { booking_id: { $in: bookingIds }, payment_status: 'Completed' } },
  //     { $group: { _id: null, totalIncome: { $sum: '$total_amt' } } }
  //   ]);
  //   const totalIncome = incomeAgg[0]?.totalIncome || 0;

  //   return {
  //     totalTickets,
  //     bookedTickets,
  //     verifiedTickets,
  //     totalIncome
  //   };
  // }


async  getDashboardAnalytics({ eventId, startDate, endDate, ticketTypeId }) {
  const match = {};

  // Event Filter
  if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
    match.eid = new mongoose.Types.ObjectId(eventId);
  }

  // Ticket Type Filter (field name is 'typeid' in Booking schema)
  if (ticketTypeId && mongoose.Types.ObjectId.isValid(ticketTypeId)) {
    match.typeid = new mongoose.Types.ObjectId(ticketTypeId);
  }

  // Date Range Filter (with full-day precision)

  // Date Range Filter (with full-day precision)
// Skip date filter for these specific ticketTypeIds
const skipDateFilterTypeIds = [
  "684922cd22c00753b1ef80e0",
  "684b27ea8869c60f805f4ac9"
];

if (
  (startDate || endDate) &&
  !(ticketTypeId && skipDateFilterTypeIds.includes(ticketTypeId))
) {
  match.date = {};
  if (startDate) {
    match.date.$gte = new Date(`${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    match.date.$lte = new Date(`${endDate}T23:59:59.999Z`);
  }
}

  // if (startDate || endDate) {
  //   match.date = {};
  //   if (startDate) {
  //     match.date.$gte = new Date(`${startDate}T00:00:00.000Z`);
  //   }
  //   if (endDate) {
  //     match.date.$lte = new Date(`${endDate}T23:59:59.999Z`);
  //   }
  // }

  // Debug: Log applied filters
  console.log("📌 Final Match Query:", JSON.stringify(match, null, 2));

  // --- Aggregate ticket counts
  const bookingAgg = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$booking_status",
        totalTickets: { $sum: "$total_ticket" },
      },
    },
  ]);

  console.log("📊 Booking Aggregation Result:", bookingAgg);
  

  let totalTickets = 0,
    bookedTickets = 0,
    verifiedTickets = 0;

    console.log("📈 Booking Status Counts:", bookingAgg);
    

  for (const row of bookingAgg) {
    totalTickets += row.totalTickets;
    if (row._id === "Booked") bookedTickets = row.totalTickets;
    if (row._id === "Verified") verifiedTickets = row.totalTickets;
  }

  console.log("📈 Total Tickets:", totalTickets);
  console.log("📈 Booked Tickets:", bookedTickets)
  console.log("📈 Verified Tickets:", verifiedTickets
    
  );
  

  // --- Get booking IDs for income calculation
  const bookingIds = await Booking.find(match).distinct("_id");

  // --- Aggregate total income from completed transactions
  const incomeAgg = await Transaction.aggregate([
    {
      $match: {
        booking_id: { $in: bookingIds },
        payment_status: "Completed",
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$total_amt" },
      },
    },
  ]);

  const totalIncome = incomeAgg[0]?.totalIncome || 0;

  return {
    totalTickets,
    bookedTickets,
    verifiedTickets,
    totalIncome,
  };
}



}

export default new BookingService();
