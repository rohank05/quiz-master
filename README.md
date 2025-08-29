# Skill Assessment & Reporting Portal

A comprehensive web-based system for skill assessment and performance tracking built with React, Node.js, MySQL, and Redis.

## 🚀 Features

- **User Authentication**: JWT-based login and registration
- **Role-based Access Control**: Admin and user roles with different permissions
- **Skill-based Quizzes**: Multiple choice questions organized by skills
- **Performance Analytics**: Detailed reports and progress tracking
- **Admin Panel**: Manage users, questions, and view system analytics
- **Real-time Scoring**: Instant feedback and score calculation
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js 22** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Primary database
- **Redis** - Caching layer
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Chart.js** - Data visualization

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy for production

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 22 (for local development)
- Git

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skill-assessment-portal
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏃‍♂️ Local Development Setup

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Start MySQL and Redis
docker-compose up mysql redis

# Run database migrations
mysql -u root -p skill_assessment < backend/database/schema.sql
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skill_assessment
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Quiz Endpoints
- `GET /api/quizzes/start/:skillId` - Start a quiz
- `POST /api/quizzes/submit` - Submit quiz answers
- `GET /api/quizzes/history` - Get user's quiz history

### Admin Endpoints
- `GET /api/reports/admin-stats` - System statistics
- `GET /api/users` - User management
- `GET /api/questions` - Question management

## 👥 Demo Accounts

- **Admin**: username: `admin`, password: `admin123`
- **Student**: username: `student`, password: `student123`

## 🏗️ Project Structure

```
skill-assessment-portal/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── App.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 📈 Performance Optimizations

- Redis caching for frequent queries
- Database indexing
- Gzip compression
- Static asset caching
- Lazy loading of components

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up --build
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database credentials
- Set up SSL/TLS certificates
- Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Happy Learning! 🎓**