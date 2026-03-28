const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// In-memory storage
let users = {}; // {username: {password: hashed, id: uuid}}
let messages = {}; // {room: [{id, username, message, timestamp}]}
let onlineUsers = {}; // {room: [usernames]}

// Initialize default rooms
const defaultRooms = ['general', 'random', 'tech'];
defaultRooms.forEach(room => {
  messages[room] = [];
  onlineUsers[room] = [];
});

app.use(express.json());
app.use(express.static('public'));

// Auth routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword, id: uuidv4() };
  res.json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, id: user.id }, JWT_SECRET);
  res.json({ token });
});

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/rooms', authenticate, (req, res) => {
  res.json({ rooms: defaultRooms, online: onlineUsers });
});

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close();
    return;
  }

  ws.user = user;
  ws.room = 'general'; // default room

  // Join default room
  if (!onlineUsers[ws.room]) onlineUsers[ws.room] = [];
  onlineUsers[ws.room].push(user.username);
  broadcastOnlineUsers(ws.room);

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'join') {
      // Leave current room
      onlineUsers[ws.room] = onlineUsers[ws.room].filter(u => u !== user.username);
      broadcastOnlineUsers(ws.room);

      // Join new room
      ws.room = msg.room;
      if (!onlineUsers[ws.room]) onlineUsers[ws.room] = [];
      onlineUsers[ws.room].push(user.username);
      broadcastOnlineUsers(ws.room);

      // Send message history
      ws.send(JSON.stringify({ type: 'history', messages: messages[ws.room] || [] }));
    } else if (msg.type === 'message') {
      const message = {
        id: uuidv4(),
        username: user.username,
        message: msg.message,
        timestamp: new Date().toISOString()
      };
      if (!messages[ws.room]) messages[ws.room] = [];
      messages[ws.room].push(message);
      broadcastMessage(ws.room, message);
    }
  });

  ws.on('close', () => {
    onlineUsers[ws.room] = onlineUsers[ws.room].filter(u => u !== user.username);
    broadcastOnlineUsers(ws.room);
  });
});

function broadcastMessage(room, message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.room === room) {
      client.send(JSON.stringify({ type: 'message', ...message }));
    }
  });
}

function broadcastOnlineUsers(room) {
  const online = onlineUsers[room] || [];
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.room === room) {
      client.send(JSON.stringify({ type: 'online', users: online }));
    }
  });
}