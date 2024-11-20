import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isMember: {
        type: Boolean,
        default: false,
    },
    displayPicture: {
        type: String, // URL or base64 string
        default: 'https://via.placeholder.com/150' // Default placeholder image
    },
    bio: {
        type: String,
        default: 'This is a short bio.' // Default bio
    },
    expenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense' // Reference to the Expense model
    }],
    phone: {
        type: String,
        default: '' // Empty by default, can be updated by the user
    },
    budget: {
        type: Number,
        default:0,
    },
    projectManagementIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectManagement', 
    }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
