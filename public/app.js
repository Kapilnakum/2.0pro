let ws;
let currentRoom = 'general';
let token;

function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.querySelectorAll('.tab')[0].classList.add('active');
  document.querySelectorAll('.tab')[1].classList.remove('active');
}

function showRegister() {
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
  document.querySelectorAll('.tab')[1].classList.add('active');
  document.querySelectorAll('.tab')[0].classList.remove('active');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      document.getElementById('auth').classList.add('hidden');
      document.getElementById('chat').classList.remove('hidden');
      document.getElementById('currentUser').textContent = username;
      connectWebSocket();
      loadRooms();
    } else {
      document.getElementById('authError').textContent = data.error;
    }
  } catch (err) {
    document.getElementById('authError').textContent = 'Login failed';
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      showLogin();
    } else {
      document.getElementById('authError').textContent = data.error;
    }
  } catch (err) {
    document.getElementById('authError').textContent = 'Registration failed';
  }
});

function connectWebSocket() {
  ws = new WebSocket(`ws://localhost:3000?token=${token}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      displayMessage(data);
    } else if (data.type === 'history') {
      data.messages.forEach(displayMessage);
    } else if (data.type === 'online') {
      updateOnlineUsers(data.users);
    }
  };
}

function loadRooms() {
  fetch('/rooms', {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';
    data.rooms.forEach(room => {
      const li = document.createElement('li');
      li.textContent = room;
      li.onclick = () => joinRoom(room);
      if (room === currentRoom) li.classList.add('active');
      roomList.appendChild(li);
    });
    updateOnlineUsers(data.online[currentRoom] || []);
  });
}

function joinRoom(room) {
  currentRoom = room;
  document.getElementById('currentRoom').textContent = room;
  document.querySelectorAll('#roomList li').forEach(li => {
    li.classList.remove('active');
    if (li.textContent === room) li.classList.add('active');
  });
  ws.send(JSON.stringify({ type: 'join', room }));
  document.getElementById('messages').innerHTML = '';
}

function updateOnlineUsers(users) {
  const onlineList = document.getElementById('onlineList');
  onlineList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    onlineList.appendChild(li);
  });
}

document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

document.getElementById('sendBtn').addEventListener('click', sendMessage);

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (message) {
    ws.send(JSON.stringify({ type: 'message', message }));
    input.value = '';
  }
}

function displayMessage(msg) {
  const messagesDiv = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ' + (msg.username === document.getElementById('currentUser').textContent ? 'own' : 'other');
  messageDiv.innerHTML = `
    <div class="username">${msg.username}</div>
    <div>${msg.message}</div>
    <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</div>
  `;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  ws.close();
  document.getElementById('chat').classList.add('hidden');
  document.getElementById('auth').classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  document.getElementById('authError').textContent = '';
});