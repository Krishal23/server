// models/Contact.js
import mongoose from "mongoose";
const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    query: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// const Contact = mongoose.model('Contact', contactSchema);
const Contact = mongoose.model('Contact', ContactSchema);
export default Contact;
