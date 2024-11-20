import mongoose from 'mongoose';

// Financial Modeling Schema
const financialModelingSchema = new mongoose.Schema({
    budget: {
        venue: {
            type: Number,
            default: 0
        },
        catering: {
            type: Number,
            default: 0
        },
        marketing: {
            type: Number,
            default: 0
        },
        other: {
            type: Number,
            default: 0
        },
    },
    income: {
        ticketSales: {
            type: Number,
            default: 0
        },
        sponsorships: {
            type: Number,
            default: 0
        },
        merchandise: {
            type: Number,
            default: 0
        },
    },
    profitMargin: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

// Execution Notes Schema
const noteSchema = new mongoose.Schema({
    notes: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    eventName: {
        type: String,
        required: true
    },
    importance: {
        type: String,
        default: 'Normal'
    }, // High, Low, or Normal
    dateTime: {
        type: String,
        required: true
    }
},{ timestamps: true });





// Event Planning Schema
const eventPlanningSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    attendees: {
        type: Number,
        required: true
    },
    notes: {
        type: String
    },
    financialData: financialModelingSchema,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });



// Project Management Schema
const projectManagementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    eventPlanning: eventPlanningSchema,
    financialModeling: financialModelingSchema,
    executionNotes: [noteSchema],
}, { timestamps: true });

const ProjectManagement = mongoose.model('ProjectManagement', projectManagementSchema);

export default ProjectManagement;
