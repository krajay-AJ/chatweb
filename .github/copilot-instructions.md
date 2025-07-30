<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Anonymous Chat Application Development Guidelines

This is a production-ready, full-stack anonymous chat application with enterprise-grade features.

## Architecture & Technology Stack
- **Frontend**: React 18 + TypeScript + Redux Toolkit + Material-UI + Socket.IO Client
- **Backend**: Node.js + Express + TypeScript + Socket.IO + JWT
- **Database**: PostgreSQL for persistent data, Redis for caching and sessions
- **Infrastructure**: Docker, Kubernetes, Nginx, monitoring with Prometheus/Grafana

## Security Best Practices
- Always implement input validation using Joi/Yup
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on all endpoints
- Apply CSRF protection for state-changing operations
- Use JWT with RS256 algorithm and refresh tokens
- Hash passwords with Argon2
- Validate and sanitize file uploads

## Performance Optimization
- Implement database connection pooling
- Use Redis for caching and session management
- Apply lazy loading for React components
- Use React.memo and useMemo for expensive operations
- Implement message pagination and virtual scrolling
- Optimize database queries with proper indexing

## Real-time Features
- Use Socket.IO with Redis adapter for clustering
- Implement user presence management
- Handle connection recovery and offline states
- Manage typing indicators and message status

## Monitoring & Observability
- Use Winston for structured logging
- Implement health check endpoints
- Add Prometheus metrics collection
- Include error tracking with proper context
- Monitor performance and resource usage

## Code Quality
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Implement comprehensive error handling
- Write unit and integration tests
- Use proper error boundaries in React
