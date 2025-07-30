# Anonymous Chat Platform

A production-ready, full-stack anonymous chat application with enterprise-grade security, real-time messaging, and comprehensive monitoring capabilities.

## 🚀 Features

### Core Functionality
- **Anonymous & Persistent Chat**: Gender-based matching with seamless account conversion
- **Real-time Messaging**: Instant message delivery with Socket.IO
- **User Presence**: Online/offline/typing status indicators
- **File Sharing**: Secure file upload with virus scanning
- **Voice Calling**: WebRTC P2P with relay fallback
- **Message Management**: Edit, delete, reply, search, pagination

### Security & Performance
- **Enterprise Security**: JWT with refresh tokens, rate limiting, input validation
- **GDPR Compliance**: Data portability, right to erasure, consent management
- **Performance Optimization**: Redis caching, connection pooling, CDN integration
- **Monitoring**: Comprehensive logging, metrics, health checks

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes deployment manifests
- **CI/CD**: GitHub Actions pipeline
- **Monitoring**: Prometheus metrics, Grafana dashboards

## 🏗️ Architecture

```
anonymous-chat/
├── client/          # React 18 + TypeScript frontend
├── server/          # Node.js + Express backend
├── shared/          # Shared types and utilities
├── k8s/            # Kubernetes manifests
├── monitoring/     # Prometheus, Grafana configs
├── nginx/          # Nginx configuration
└── .github/        # CI/CD workflows
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with Concurrent Features
- **TypeScript** for type safety
- **Redux Toolkit** + RTK Query for state management
- **Material-UI** for consistent design
- **Socket.IO Client** for real-time communication
- **React Router v6** with lazy loading
- **PWA** capabilities with offline support

### Backend
- **Node.js** with Express.js and TypeScript
- **Socket.IO** with Redis Adapter for clustering
- **PostgreSQL** with connection pooling
- **Redis** for caching, sessions, and pub/sub
- **JWT** authentication with RS256
- **Winston** for structured logging
- **Bull Queue** for background jobs

### Infrastructure
- **Docker** & **Kubernetes** for containerization
- **Nginx** as reverse proxy and load balancer
- **Let's Encrypt** for SSL certificates
- **Prometheus** + **Grafana** for monitoring
- **GitHub Actions** for CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd anonymous-chat
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   # Configure your environment variables
   ```

3. **Start Services**
   ```bash
   # Start database services
   docker-compose up -d postgres redis
   
   # Start development servers
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

### Production Deployment

1. **Docker Deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Kubernetes Deployment**
   ```bash
   kubectl apply -f k8s/
   ```

## 📊 Monitoring

- **Health Checks**: `/health` endpoint for service status
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Structured JSON logs with Winston
- **Dashboards**: Grafana dashboards for real-time monitoring

## 🔒 Security Features

- **Authentication**: JWT with refresh token rotation
- **Rate Limiting**: IP and user-based limits
- **Input Validation**: Comprehensive validation with Joi
- **CSRF Protection**: Cross-site request forgery prevention
- **File Security**: Antivirus scanning and type validation
- **Audit Trail**: Comprehensive logging for compliance

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific workspace tests
npm run test:server
npm run test:client

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

Comprehensive API documentation is available at `/api-docs` when running the development server.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for secure, scalable anonymous communication**
