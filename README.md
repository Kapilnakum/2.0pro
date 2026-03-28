# Real-Time Chat Application

A beautiful, real-time chat application built with Node.js, WebSocket, and modern web technologies. Features user authentication, multiple chat rooms, and a sleek UI design.

## Features

- **Real-time messaging** using WebSocket
- **User authentication** with JWT tokens
- **Multiple chat rooms** (General, Random, Tech)
- **Beautiful UI** with gradients, icons, and responsive design
- **Message history** per room
- **Online user list** per room
- **Responsive design** for mobile and desktop

## Architecture

### Backend
- **Node.js** with Express for HTTP server
- **WebSocket** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing
- In-memory storage for users, messages, and online users

### Frontend
- **HTML5** for structure
- **CSS3** with gradients and animations
- **Vanilla JavaScript** for interaction
- **Font Awesome** for icons

## Scalability Considerations

For production deployment:
- Replace in-memory storage with a database (MongoDB, PostgreSQL)
- Implement Redis for session management and message caching
- Use a load balancer for multiple server instances
- Add rate limiting and input validation
- Implement message encryption for security

## How to Run

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Start the server:**
   ```
   npm start
   ```
   Or for development with auto-restart:
   ```
   npm run dev
   ```

3. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

4. **Register a new account or login with existing credentials.**

5. **Start chatting in different rooms!**

## Deployment

To deploy to a hosting platform:

1. Set up a Node.js hosting service (Heroku, DigitalOcean, AWS)
2. Set environment variables for JWT_SECRET
3. Ensure WebSocket support
4. Use a process manager like PM2 in production

## Testing

- Open multiple browser tabs/windows
- Register different users
- Test real-time messaging across rooms
- Check online user updates
- Test responsive design on different screen sizes