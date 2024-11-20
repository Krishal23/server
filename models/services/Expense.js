import mongoose from 'mongoose';

// Define the expense schema
const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0 // Ensure no negative values
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        default: '' // Optional notes
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who added the expense
        required: true
    }
}, {
    timestamps: true // Automatically create createdAt and updatedAt fields
});

// Create the Expense model
const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
