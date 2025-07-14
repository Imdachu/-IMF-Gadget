const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'supersecretkey'; // In production, use process.env.JWT_SECRET

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Protect all /gadgets endpoints
app.use('/gadgets', authenticateToken);

app.get('/', (req, res) => {
  res.send('IMF Gadget API is running!');
});

// Utility: Generate random codename
function generateCodename() {
  const adjectives = ["Nightingale", "Kraken", "Phantom", "Viper", "Falcon", "Specter", "Shadow", "Wraith", "Oracle", "Sentinel"];
  return `The ${adjectives[Math.floor(Math.random() * adjectives.length)]}`;
}

// Utility: Generate random mission success probability
function getRandomProbability() {
  return Math.floor(Math.random() * 51) + 50; // 50% to 100%
}

// GET /gadgets (with optional status filter)
app.get('/gadgets', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const gadgets = await prisma.gadget.findMany({ where });
    const gadgetsWithProbability = gadgets.map(gadget => ({
      ...gadget,
      missionSuccessProbability: `${getRandomProbability()}% success probability`
    }));
    res.json(gadgetsWithProbability);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gadgets' });
  }
});

// POST /gadgets
app.post('/gadgets', async (req, res) => {
  try {
    const { name, status } = req.body;
    const codename = generateCodename();
    const gadget = await prisma.gadget.create({
      data: {
        name: name || codename,
        status: status || 'Available',
      },
    });
    res.status(201).json(gadget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create gadget' });
  }
});

// PATCH /gadgets/:id
app.patch('/gadgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const gadget = await prisma.gadget.update({
      where: { id },
      data: { name, status },
    });
    res.json(gadget);
  } catch (err) {
    res.status(404).json({ error: 'Gadget not found or update failed' });
  }
});

// DELETE /gadgets/:id (soft delete)
app.delete('/gadgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gadget = await prisma.gadget.update({
      where: { id },
      data: {
        status: 'Decommissioned',
        decommissionedAt: new Date(),
      },
    });
    res.json({ message: 'Gadget decommissioned', gadget });
  } catch (err) {
    res.status(404).json({ error: 'Gadget not found or decommission failed' });
  }
});

// POST /gadgets/:id/self-destruct with logging
app.post('/gadgets/:id/self-destruct', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Self-destruct endpoint called with id:', id);
    // Check if gadget exists
    const gadget = await prisma.gadget.findUnique({ where: { id } });
    if (!gadget) {
      console.log('Gadget not found for id:', id);
      return res.status(404).json({ error: 'Gadget not found' });
    }
    // Generate random confirmation code (6 digits)
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Simulate self-destruct (no actual DB change required)
    console.log('Self-destruct sequence initiated for gadget:', gadget.name, 'Code:', confirmationCode);
    res.json({
      message: `Self-destruct sequence initiated for gadget '${gadget.name}'.`,
      confirmationCode
    });
  } catch (err) {
    console.error('Error in self-destruct endpoint:', err);
    res.status(500).json({ error: 'Failed to initiate self-destruct sequence' });
  }
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
