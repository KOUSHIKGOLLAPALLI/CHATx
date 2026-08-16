# Messenger App

A simple WhatsApp-style 1-to-1 real-time messenger built with:

- React + Vite
- Node.js + Express
- Socket.IO
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing

## Features

- Register
- Local verification code
- Login
- User search
- Chat requests
- Accept/reject requests
- 1-to-1 conversations
- Real-time messages
- Message persistence
- Online/offline status
- Last seen
- Typing indicator
- Read messages
- Block/unblock users

## Requirements

- Node.js 18+
- MongoDB local installation or MongoDB Atlas
- VS Code recommended

## 1. Start MongoDB

For local MongoDB, make sure MongoDB is running.

Or use MongoDB Atlas and put the connection string in `server/.env`.

## 2. Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux:

```bash
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## 3. Frontend

Open another terminal:

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux:

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend runs on the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Verification

This development version does not send real emails.

After registration, the verification code is printed in the backend terminal.

Example:

```text
Verification code for user@example.com: 123456
```

Enter that code on the verification page.

## Test real-time chat

1. Register User A.
2. Verify User A.
3. Register User B in another browser/incognito window.
4. Verify User B.
5. Log in as User A and search for User B.
6. Send a chat request.
7. Log in as User B and accept the request.
8. Open the conversation.
9. Send messages from both browsers.

## Security note

This is an educational MVP. Before production, add:

- HTTPS
- secure cookie-based authentication or hardened token storage
- rate limiting
- production email verification
- stronger validation
- CSRF protection where applicable
- production logging/monitoring
- message abuse controls
- file scanning if attachments are added
- proper secret management

Do not commit `.env` files.
