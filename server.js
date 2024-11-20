// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';
import connectDB from './db.js';
import MongoStore from 'connect-mongo';
import Membership from './Membership.js';
import Expense from './models/services/Expense.js';
import ProjectManagement from './ProjectManagement.js';


import User from './User.js';
import Contact from './Contact.js';


dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}));
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Use a strong secret key
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false }, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // Session valid for 24 hours
}));

// Middleware to authenticate user
const authenticateSession = (req, res, next) => {
    console.log("authenticating32");
    if (req.session.user) {
        console.log("authenticating done");
        req.user = { _id: req.session.user.id }; // Set req.user
        next();
    } else {
        console.log("authenticating denied");
        res.status(401).json({ success: false, message: 'Access denied' });
    }
};

// Middleware to verify if the user is a member
const verifyMembership = async (req, res, next) => {
    try {
        // Get the user ID from the session
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Check if the user exists in the Membership collection
        const membership = await Membership.findOne({ userId });

        if (!membership) {
            return res.status(403).json({ success: false, message: 'User is not a member' });
        }

        // If the user is a member, proceed with the request
        next();
    } catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({ success: false, message: 'Server error, could not verify membership.' });
    }
};


// Signup Route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Username:", username);
    console.log("Email:", email);

    console.log("signinign upp")

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("signinign upp2")

    try {
        console.log("signinign upp3")
        const newUser = await User.create({ username, email, password: hashedPassword });
        console.log("signinign upp4")
        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.log("signinign upp5")
        res.status(400).json({ success: false, message: error.message });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid password' });
        }

        // Store user information in session
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };
        console.log(req.session.user)

        res.status(200).json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout Route
app.post('/logout', authenticateSession, (req, res) => {

    console.log(req.session.user)

    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }

        // Clear the session cookie on the client-side
        res.clearCookie('connect.sid', { path: '/' });

        console.log("logout successfully")

        // Send a successful logout response
        res.json({ success: true, message: 'Logged out successfully' });
    });
});


// Me Route
app.get('/me', authenticateSession, async (req, res) => {
    try {
        console.log(req.session.user)
        const user = await User.findById(req.session.user.id).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Contact form submission endpoint
app.post('/contactus', async (req, res) => {
    const { name, email, query } = req.body;

    try {
        const newContact = new Contact({ name, email, query });
        await newContact.save();
        res.status(201).json({ message: 'Contact information submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting contact information', error });
    }
});


// src/server.js or wherever your server is defined
app.post('/membership', async (req, res) => {
    const { name, email, phone, interests, feedback } = req.body;

    try {
        const newMembership = new Membership({ name, email, phone, interests, feedback });
        await newMembership.save();
        res.status(201).json({ message: 'Membership information submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting membership information', error });
    }
});


//Services


// API route to add an expense
// API route to add an expense
app.post('/expenses', authenticateSession, async (req, res) => {
    const { amount, category, date, notes } = req.body;

    // Validate required fields
    if (!amount || !category || !date) {
        return res.status(400).json({ message: 'Amount, category, and date are required.' });
    }

    try {
        const userId = req.session.user.id;

        // Create a new expense
        const newExpense = new Expense({
            amount,
            category,
            date,
            notes,
            user: userId, // Associate expense with the user
        });

        // Save the expense to the database
        const savedExpense = await newExpense.save();

        // Update the user's expenses array with the new expense ID
        await User.findByIdAndUpdate(
            userId,
            { $push: { expenses: savedExpense._id } }, // Push the new expense ID into the user's expenses array
            { new: true } // Return the updated user document
        );

        res.status(201).json(savedExpense);
    } catch (error) {
        console.error(error); // Log error for debugging
        res.status(500).json({ message: 'Server error, could not save expense.' });
    }
});


// Route to get all expenses for the authenticated user
app.get('/get-expenses', authenticateSession, async (req, res) => {
    try {
        // Retrieve user ID from the session
        const userId = req.session.user.id;
        console.log("User ID from session:", userId);

        // Find the user by ID
        const user = await User.findById(userId).populate('expenses'); // Populate the expenses field

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Access the expenses array
        const expenses = user.expenses; // This will already contain populated Expense documents

        console.log("Expenses retrieved:", expenses);

        // Respond with the expenses
        res.status(200).json({
            success: true,
            expenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to delete an expense by its ID
app.delete('/expenses/:id', authenticateSession, async (req, res) => {
    try {
        const expenseId = req.params.id;

        // Find the expense and ensure it belongs to the logged-in user
        const expense = await Expense.findOneAndDelete({ _id: expenseId, user: req.session.user.id });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found or unauthorized.' });
        }

        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Server error, could not delete expense.' });
    }
});


// Route to update an existing expense by its ID
app.put('/expenses/:id', authenticateSession, async (req, res) => {
    try {
        const { amount, category, date, notes } = req.body;
        const expenseId = req.params.id;

        // Validate required fields
        if (!amount || !category || !date) {
            return res.status(400).json({ success: false, message: 'Amount, category, and date are required.' });
        }

        // Find the expense and ensure it belongs to the user
        const expense = await Expense.findOneAndUpdate(
            { _id: expenseId, user: req.session.user.id },
            { amount, category, date, notes },
            { new: true } // Return the updated document
        );

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found or unauthorized.' });
        }

        res.status(200).json({ success: true, message: 'Expense updated successfully', expense });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ success: false, message: 'Server error, could not update expense.' });
    }
});


app.put('/budget', async (req, res) => {
    try {
        const { budget } = req.body;

        // Debugging output
        console.log("Request Body:", req.body);
        console.log("User Session:", req.session.user);

        // Check if the user ID is present in the session
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(req.session.user.id).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update the user's budget
        console.log("Current Budget:", user.budget);
        user.budget = budget; // Set the new budget

        // Save the updated user document
        await user.save(); // Save the changes to the database

        console.log("Updated Budget:", user.budget);

        // Respond with the updated user information
        res.status(200).json({
            success: true,
            message: 'Budget updated successfully',
            user: {
                username: user.username,
                email: user.email,
                budget: user.budget,
            },
        });

    } catch (error) {
        console.error('Error updating budget:', error); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.get('/budget', async (req, res) => {
    try {
        // Ensure the user is logged in and has a session
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(req.session.user.id).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Respond with the user's budget
        res.status(200).json({
            success: true,
            budget: user.budget,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// API route to add an event plan
app.post('/event-planning', authenticateSession, async (req, res) => {
    const { eventName, date, location, attendees, notes } = req.body;

    // Validate required fields
    if (!eventName || !date || !location || !attendees) {
        return res.status(400).json({ message: 'Event name, date, location, and number of attendees are required.' });
    }

    try {
        const userId = req.session.user.id; // Extract user ID from session

        // Create a new event plan object
        const newEventPlan = {
            eventName,
            date,
            location,
            attendees,
            notes,
            userId, // Associate event plan with the user
        };

        // Create a new ProjectManagement document with the event planning
        const newProjectManagement = new ProjectManagement({
            userId,
            eventPlanning: newEventPlan, // Add the event planning object here
        });

        // Save the new ProjectManagement document
        const savedProjectManagement = await newProjectManagement.save();

        // Add the saved ProjectManagement ID to the user's projectManagementIds array
        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { projectManagementIds: savedProjectManagement._id } }, // Ensure no duplicates using $addToSet
            { new: true } // Return the updated user document
        );

        res.status(201).json(savedProjectManagement); // Return the saved project management with the event planning

    } catch (error) {
        console.error(error); // Log error for debugging
        res.status(500).json({ message: 'Server error, could not save event plan.' });
    }
});




// API to list all event names with their ProjectManagement IDs for the logged-in user
app.get('/get-events', async (req, res) => {
    try {
        console.log(req.session.user)
        const user = await User.findById(req.session.user.id).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ success: false, message: 'Unauthorized' });

        }

        console.log(user.projectManagementIds);


        // Fetch all ProjectManagement documents by their IDs
        const projectManagements = await ProjectManagement.find({
            _id: { $in: user.projectManagementIds }
        }).select('eventPlanning.eventName'); // Select only eventName from eventPlanning

        console.log("AFdsgf")
        console.log(projectManagements)

        // Map the response to include ProjectManagement ID and eventName
        const events = projectManagements.map(project => ({
            projectId: project._id,
            eventName: project.eventPlanning.eventName
        }));

        console.log(events)

        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// API route to add financial model
app.post('/financial-model', authenticateSession, async (req, res) => {
    const { budget, income, profitMargin, projectId } = req.body;
    // Validate required fields
    if (!budget || !income || profitMargin === undefined) {
        return res.status(400).json({ message: 'Budget, income, and profit margin are required.' });
    }

    try {
        const userId = req.session.user.id; // Extract user ID from session

        // Create a new financial modeling object
        const newFinancialModel = {
            budget,
            income,
            profitMargin,
            userId, // Associate financial model with the user
        };
        console.log(newFinancialModel, projectId)
        // Find the project by projectId and update the financialModeling field
        const updatedProject = await ProjectManagement.findByIdAndUpdate(
            projectId, // Find project by ID
            {
                $set: { financialModeling: newFinancialModel }, // Update the financialModeling field
            },
            { new: true } // Return the updated project document
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Send the updated project with the new financial model
        res.status(200).json(updatedProject);


        console.log(updatedProject)

    } catch (error) {
        console.error(error); // Log error for debugging
        res.status(500).json({ message: 'Server error, could not save financial model.' });
    }
});

// API route to add financial model notes to a project
app.post('/notes', async (req, res) => {
    const { notes, category, importance, dateTime, projectId } = req.body;

    // Validate required fields
    if (!notes || !category || !importance || !dateTime) {
        return res.status(400).json({ message: 'Notes, category, importance, and date/time are required.' });
    }

    try {
        const userId = req.session.user.id; // Extract user ID from session
        console.log(userId);

        // Find the project by projectId
        const project = await ProjectManagement.findOne({ _id: projectId });
        console.log(project);

        // Check if project exists
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const eventName = project.eventPlanning?.eventName;
        console.log(eventName);

        // Create a new note object
        const newNote = {
            notes,
            category,
            eventName, // Store eventName as part of the note
            importance: importance || 'Normal', // Default importance if not provided
            dateTime
        };

        console.log(newNote);

        // Push the new note to the executionNotes array
        project.executionNotes.push(newNote);

        // Save the updated project
        await project.save();

        res.status(200).json({ message: 'Note added successfully.', project });
    } catch (error) {
        console.error(error); // Log error for debugging
        res.status(500).json({ message: 'Server error, could not save financial model.' });
    }
});


// API route to get financial model notes for a project
app.get('/notes/:projectId', authenticateSession, async (req, res) => {
    const { projectId } = req.params;  // Extract projectId from the URL
    console.log("Project ID: ", projectId);  // Logging the projectId

    try {
        // Find the project by projectId
        const project = await ProjectManagement.findOne({ _id: projectId });

        // Check if project exists
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Extract notes from the project
        const notes = project.executionNotes || [];  // Ensure it's an array, even if empty
        console.log("Notes: ", notes);

        // Respond with the notes
        res.status(200).json({ message: 'Notes fetched successfully.', notes });
    } catch (error) {
        console.error("Error fetching notes: ", error);  // Log the error for debugging
        res.status(500).json({ message: 'Server error, could not fetch notes.' });
    }
});


app.get('/preview-event/:projectId',authenticateSession,async(req,res)=>{
    const { projectId } = req.params;  // Extract projectId from the URL
    console.log("Project ID: ", projectId);  // Logging the projectId
    try {
        // Find the project by projectId
        const project = await ProjectManagement.findOne({ _id: projectId });

        // Check if project exists
        if (!project) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Extract the project
       
        console.log("Notes: ", project);

        // Respond with the notes
        res.status(200).json({ message: 'Event fetched successfully.', project });
    } catch (error) {
        console.error("Error fetching notes: ", error);  // Log the error for debugging
        res.status(500).json({ message: 'Server error, could not fetch notes.' });
    }

})



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
