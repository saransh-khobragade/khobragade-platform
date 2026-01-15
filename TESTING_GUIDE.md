# Chat App Testing Guide

## Prerequisites

Make sure you have:
- Docker and Docker Compose installed
- Bun installed
- Two browser windows/tabs (or two browsers) for testing real-time messaging

## Step 1: Start the Database

Open a terminal and run:

```bash
cd /Users/saransh/Desktop/Github/khobragade-platform
docker compose up -d
```

Wait for the database to start (about 10-15 seconds). Verify it's running:

```bash
docker ps
```

You should see a `render_postgres` container running.

## Step 2: Start the Backend

Open a **new terminal** and run:

```bash
cd /Users/saransh/Desktop/Github/khobragade-platform/backend
bun dev
```

You should see:
```
🚀 Server running on http://localhost:3000
```

**Keep this terminal open** - the backend needs to keep running.

## Step 3: Start the Frontend

Open **another new terminal** and run:

```bash
cd /Users/saransh/Desktop/Github/khobragade-platform/frontend
bun dev
```

You should see:
```
VITE v7.3.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Keep this terminal open too**.

## Step 4: Open the App in Browser

1. Open your browser and go to: `http://localhost:5173`
2. You should see the home page with all apps listed
3. Click on the **"Chat"** app card

## Step 5: Create Your First Account

1. You'll see a login form
2. Click **"Need an account? Register"** to switch to registration
3. Fill in:
   - **Username**: `testuser1` (or any username you like)
   - **Email**: `test1@example.com` (or any email)
   - **Password**: `password123` (at least 6 characters)
   - **Name**: `Test User 1` (optional)
4. Click **"Register"**
5. You should be automatically logged in and see the Chat interface

## Step 6: Get Your User ID

To chat with someone, you need their User ID. Here's how to get yours:

1. Open browser Developer Tools:
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - **Firefox**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to the **Console** tab
3. Type this and press Enter:
   ```javascript
   JSON.parse(localStorage.getItem('accessToken') || '{}')
   ```
   Actually, better way - type:
   ```javascript
   fetch('http://localhost:3000/api/users/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } }).then(r => r.json()).then(console.log)
   ```
   This will show your user info including your `id` - **copy this ID**!

## Step 7: Create a Second Account (for Testing)

1. Open a **new incognito/private window** (or use a different browser)
2. Go to `http://localhost:5173`
3. Click on "Chat" app
4. Register a second account:
   - **Username**: `testuser2`
   - **Email**: `test2@example.com`
   - **Password**: `password123`
   - **Name**: `Test User 2`
5. Get the User ID for this account too (follow Step 6)

## Step 8: Start a Conversation

**In Account 2's browser:**

1. In the Chat app, you'll see an input field at the top: **"User ID to chat with..."**
2. Paste Account 1's User ID
3. Click the **+** button (or press Enter)
4. A conversation should appear in the left sidebar

## Step 9: Send Messages

1. Click on the conversation in the left sidebar
2. Type a message in the input at the bottom
3. Press Enter or click Send
4. The message should appear immediately

## Step 10: Test Real-Time Messaging

**In Account 1's browser:**

1. Make sure Account 1 is logged in
2. You should see the conversation appear automatically (or refresh the page)
3. Click on the conversation
4. Type a reply and send it

**In Account 2's browser:**

1. You should see the message appear **instantly** without refreshing!
2. This proves real-time messaging is working

## Step 11: Test Multiple Conversations

1. In Account 1, start a conversation with Account 2's ID
2. Send some messages back and forth
3. Try sending messages from both sides
4. Messages should appear in real-time on both sides

## Troubleshooting

### Backend not starting?
- Check if port 3000 is already in use
- Make sure database is running: `docker ps`
- Check backend terminal for error messages

### Frontend not starting?
- Check if port 5173 is already in use (it might use 5174 instead)
- Check frontend terminal for error messages

### Can't register/login?
- Check backend terminal for errors
- Make sure backend is running on port 3000
- Check browser console (F12) for errors

### Messages not appearing in real-time?
- Check browser console for WebSocket errors
- Make sure both accounts are logged in
- Try refreshing both browsers

### Can't find User ID?
- Open browser console (F12)
- Go to Application/Storage tab
- Look for `accessToken` in Local Storage
- Or use the fetch command from Step 6

## What to Test

✅ **Registration** - Create new accounts
✅ **Login** - Login with existing accounts  
✅ **Create Conversation** - Start chatting with another user
✅ **Send Messages** - Send text messages
✅ **Real-time Delivery** - Messages appear instantly on both sides
✅ **Message History** - Previous messages load when opening conversation
✅ **Multiple Conversations** - Can have multiple chat threads

## Expected Behavior

- Messages should appear **instantly** on both sides (real-time)
- No page refresh needed
- Messages persist (refresh page, messages are still there)
- Can see who sent each message
- Timestamps show when messages were sent

## Next Steps After Testing

Once everything works locally:
1. Test all features thoroughly
2. Deploy to Render.com
3. Test on production URL
4. Give go-ahead for next app!
