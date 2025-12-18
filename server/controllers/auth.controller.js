const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = new User({
        email,
        passwordHash: password,
        role: 'creator',
        canUpload: false // Requires admin approval
      });

      await user.save();

      res.status(201).json({
        message: 'Registration successful. Please wait for admin approval to upload projects.',
        userId: user._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store in session
      req.session.token = token;
      req.session.userId = user._id;

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          canUpload: user.canUpload
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
      });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed' });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-passwordHash');
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }

  async approveCreator(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findByIdAndUpdate(
        userId,
        { canUpload: true },
        { new: true }
      ).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'Creator approved successfully',
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Approval failed' });
    }
  }
}

module.exports = new AuthController();
