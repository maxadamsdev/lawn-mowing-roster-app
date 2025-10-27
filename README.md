# Lawn Mowing Roster API

Backend API for the Lawn Mowing Roster application.

## Setup Instructions

### 1. Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

### 2. Deploy to Hosting Platform

#### Option A: Deploy to Render (Recommended - Free)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repository
5. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `ADMIN_PASSWORD`: Your admin password (e.g., `SecurePass123`)
6. Deploy!

#### Option B: Deploy to Railway

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub repo"
4. Add environment variables (same as above)
5. Deploy!

#### Option C: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set ADMIN_PASSWORD="your-password"
   ```
5. Deploy: `git push heroku main`

### 3. Configure Frontend

1. Copy your backend URL (e.g., `https://your-app.render.com/api`)
2. Paste it into the "Backend API URL" field in your HTML file
3. Done!

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (required)
- `ADMIN_PASSWORD`: Password for admin account (required)
- `PORT`: Server port (optional, auto-set by hosting providers)
- `BASE_URL`: Base URL of your app (default: https://lawn-mowing-roster-app.onrender.com)
- `EMAIL_USER`: Gmail address for sending emails (required for coverage requests)
- `EMAIL_PASSWORD`: Gmail app password (required for coverage requests)
- `TESTING_MODE`: Set to 'true' to send all emails to EMAIL_USER instead of actual recipients (optional)
- `SSL_CERT_PATH`: Path to SSL certificate file (optional, for local HTTPS)
- `SSL_KEY_PATH`: Path to SSL private key file (optional, for local HTTPS)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `DELETE /api/users/:id` - Delete user

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session (assign user)
- `PUT /api/sessions/:id/confirm` - Confirm session
- `DELETE /api/sessions/:id` - Delete session

## Local Development

1. Install dependencies: `npm install`
2. Create `.env` file with your variables:
   ```bash
   # Copy this example and update with your values
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/lawn-mowing-roster
   ADMIN_PASSWORD=admin123
   ```
3. Run: `npm start`
4. Open `http://localhost:3000` in your browser
5. The frontend will automatically connect to `http://localhost:3000/api`
6. For MongoDB, either:
   - Install MongoDB locally, or
   - Use MongoDB Atlas (cloud) - see instructions above