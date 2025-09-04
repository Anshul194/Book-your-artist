import mongoose from 'mongoose';

const transferLogSchema = new mongoose.Schema({
    from_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    to_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket', // Assuming this refers to the 'Ticket' model (which is the TicketType ID in your Booking schema)
        required: true
    },
    // Mongoose's timestamps option handles 'createdAt' and 'updatedAt' automatically.
    // If you prefer custom field names like created_at and updated_at, you can configure it.
    // However, the default 'createdAt' and 'updatedAt' is generally preferred for consistency.
}, {
    timestamps: true // This automatically adds createdAt and updatedAt fields
});

const TransferLog = mongoose.model('TransferLog', transferLogSchema);

export default TransferLog;