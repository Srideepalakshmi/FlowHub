import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        
        // Basic check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = await User.create({
            name, email, password, role, department
        });
        
        res.status(201).json({ message: 'Registered successfully', user: newUser });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Send user back (excluding password typically, but for simplicity we return the mongo doc)
        res.json(user);
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;