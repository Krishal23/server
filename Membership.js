// models/Membership.js
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        // unique: true, // Optional: Ensure emails are unique
    },
    phone: {
        type: String,
        required: true,
    },
    interests: {
        type: String,
        required: false, // Optional field
    },
    feedback: {
        type: String,
        required: false, // Optional field
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Membership model
const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
