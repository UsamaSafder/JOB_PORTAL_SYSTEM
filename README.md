# Job Portal System

A comprehensive job portal application built with modern web technologies, featuring both Angular and React frontends, Node.js/Express backend, and MongoDB database.

## 🚀 Features

- **Multi-role Authentication**: Support for Candidates, Companies, and Admins
- **Job Management**: Post, browse, and apply for jobs
- **Resume Upload & Parsing**: Automatic resume parsing with PDF/DOC support
- **Real-time Messaging**: Socket.io powered chat system
- **Application Tracking**: Complete application lifecycle management
- **Admin Dashboard**: System management and analytics
- **File Upload**: Secure file handling for resumes, logos, and profile pictures
- **Email Notifications**: Automated email services
- **Responsive Design**: Mobile-friendly interfaces

## 🏗️ Architecture

### Frontend Options
- **React** (Primary): Modern React 18 with Vite, React Router, Axios
- **Angular** (Legacy): Traditional Angular application (src/app)

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with role-based access control
- **Socket.io** for real-time features
- **Multer** for file uploads
- **Resume Parsing** with pdf-parse and mammoth libraries

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended
- **MongoDB Compass** - GUI for MongoDB management
- **Postman** - API testing tool

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd job-portal-system
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd Backend
npm install
cd ..

# Install React frontend dependencies
cd src/react
npm install
cd ../..
```

### 3. MongoDB Setup

#### Option A: Local MongoDB Installation
1. Install MongoDB Community Server
2. Start MongoDB service:
   ```bash
   # Windows (PowerShell as Administrator)
   net start MongoDB

   # macOS
   brew services start mongodb/brew/mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string

### 4. Environment Configuration

#### Backend Configuration
```bash
cd Backend
copy .env.example .env
```

Edit `Backend/.env` with your configuration:

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/job_portal_db
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job_portal_db

# Server settings
PORT=5001
NODE_ENV=development

# JWT - Generate a secure random string for production
JWT_SECRET=your-super-secure-jwt-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# CORS - Allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:5173
```

### 5. Database Initialization

The application will automatically create the database and collections on first run. However, you can manually initialize admin user:

```bash
cd Backend
node scripts/setupAdmin.js
```

## 🚀 Running the Application

### Development Mode (Recommended)

#### Start Backend Only
```bash
npm run backend
```
Backend will be available at: `http://localhost:5001`

#### Start React Frontend Only
```bash
npm start
# or
npm run start:react
```
Frontend will be available at: `http://localhost:5173`

#### Start Both Frontend and Backend Together
```bash
npm run start:all
# or
npm run start:all:react
```

### Production Build

#### Build React Frontend
```bash
npm run build
# or
npm run build:react
```

#### Start Production Backend
```bash
cd Backend
npm start
```

## 📁 Project Structure

```
job-portal-system/
├── Backend/                    # Node.js/Express API server
│   ├── config/                # Database and configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── scripts/               # Utility scripts
│   ├── uploads/               # File uploads directory
│   ├── utils/                 # Helper utilities
│   ├── .env.example          # Environment template
│   └── server.js             # Main server file
├── src/
│   ├── app/                  # Angular frontend (legacy)
│   ├── react/                # React frontend (primary)
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   ├── services/     # API services
│   │   │   └── utils/        # Utilities
│   │   ├── public/           # Static assets
│   │   └── package.json      # React dependencies
│   ├── index.html            # Angular index
│   └── styles.css            # Global styles
├── public/                   # Static files
├── uploads/                  # Shared uploads
└── package.json             # Root package.json
```

## 🔐 User Roles & Permissions

### Candidate
- Browse and search jobs
- Apply for positions
- Upload and manage resume
- Track application status
- Real-time messaging with companies
- Profile management

### Company
- Post and manage job listings
- Review and manage applications
- Schedule interviews
- Communicate with candidates
- Company profile management

### Admin
- User management (candidates/companies)
- System monitoring and logs
- Content moderation
- System configuration

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job (company only)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications` - Apply for job
- `GET /api/applications/my-applications` - Get user applications
- `PUT /api/applications/:id/status` - Update application status

### Users
- `GET /api/users/candidate/profile` - Get candidate profile
- `PUT /api/users/candidate/profile` - Update candidate profile
- `GET /api/users/company/profile` - Get company profile
- `PUT /api/users/company/profile` - Update company profile

## 🔧 Development Scripts

### Backend Scripts
```bash
cd Backend

# Start server
npm start

# Development mode with auto-restart
npm run dev

# Run tests
npm test
```

### Frontend Scripts (React)
```bash
cd src/react

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Root Scripts
```bash
# Start both frontend and backend
npm run start:all

# Build frontend
npm run build

# Run tests
npm test
```

## 🗄️ Database Schema

### Collections
- **Users**: Authentication and basic user info
- **Candidates**: Extended candidate profiles
- **Companies**: Company information and settings
- **Jobs**: Job postings
- **Applications**: Job applications
- **Interviews**: Interview schedules
- **Messages**: Chat messages
- **Notifications**: System notifications
- **Admin**: Administrative users
- **SystemLog**: Audit logs

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Input Validation** with express-validator
- **File Upload Security** with type validation
- **Role-based Access Control**

## 📧 Email Configuration

To enable email notifications, add to `Backend/.env`:

```env
# Email service (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🧪 Testing

### API Testing
Use Postman or similar tool to test endpoints:
1. Import the API collection (if available)
2. Set base URL to `http://localhost:5001/api`
3. Test authentication and CRUD operations

### Manual Testing
1. Register as different user types
2. Test job posting and application flow
3. Verify file uploads and real-time messaging
4. Test admin dashboard functionality

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment
2. Use a production MongoDB instance
3. Set strong `JWT_SECRET`
4. Configure proper CORS origins
5. Use process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name job-portal-api
   ```

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve static files from `src/react/dist`
3. Configure web server (nginx/apache) for SPA routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit changes: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Create a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

**Port Already in Use**
- Change PORT in `Backend/.env`
- Kill process using the port: `npx kill-port 5001`

**CORS Errors**
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the backend server

**File Upload Issues**
- Check uploads directory permissions
- Verify file size limits in multer configuration

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

### Getting Help

- Check existing issues on GitHub
- Review server logs for error details
- Test API endpoints with Postman
- Verify environment variables are set correctly

## 📊 System Requirements

- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Stable internet connection for MongoDB Atlas

---

**Note**: This application is designed for educational and portfolio purposes. For production use, additional security measures and performance optimizations may be required.
