# Sapling - Build & Debug Guide

This guide covers all aspects of building, debugging, and deploying the Sapling branching conversational AI system.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm package manager
- PostgreSQL 15+ (or Docker)
- Git

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd sapling

# Install dependencies
./build.sh install

# Setup development environment
./build.sh dev-setup

# Start development server
cd web && pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ Build Commands

### Using Build Script

```bash
# Full CI pipeline
./build.sh ci

# Development setup
./build.sh dev-setup

# Production build
./build.sh prod-build

# Individual commands
./build.sh install      # Install dependencies
./build.sh type-check   # TypeScript checking
./build.sh lint         # Code linting
./build.sh test         # Run tests
./build.sh build        # Build application
./build.sh db-setup     # Database setup
```

### Manual Commands

```bash
cd web

# Development
pnpm dev              # Start dev server
pnpm dev:debug        # Start dev server with debugging
pnpm preview          # Build and preview production

# Building
pnpm build            # Production build
pnpm build:analyze    # Build with bundle analyzer

# Quality Assurance
pnpm type-check       # TypeScript type checking
pnpm lint             # ESLint code linting
pnpm lint:fix         # Auto-fix linting issues

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm test:debug       # Debug tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Create and run migrations
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio

# Utilities
pnpm clean            # Clean build artifacts
```

## 🐳 Docker Development

### Development with Docker Compose

```bash
# Start development environment
pnpm docker:dev

# Or manually
docker-compose up --build
```

### Production Deployment

```bash
# Build production image
pnpm build:docker

# Run production stack
pnpm docker:prod

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## 🔧 Debugging

### VS Code Debugging

The project includes comprehensive VS Code debugging configurations:

1. **Server-Side Debugging**: Debug Next.js server code
2. **Client-Side Debugging**: Debug browser JavaScript
3. **Full-Stack Debugging**: Debug both server and client simultaneously
4. **Test Debugging**: Debug Jest test files

#### Launch Configurations

- `F5` or Run → Start Debugging
- Select configuration:
  - "Next.js: debug server-side"
  - "Next.js: debug client-side"
  - "Next.js: debug full stack"
  - "Debug Jest Tests"

#### VS Code Tasks

Available tasks in Command Palette (`Ctrl+Shift+P` → "Tasks: Run Task"):

- **Build for Production**: Full production build
- **Start Development Server**: Start dev server
- **Run Tests**: Execute test suite
- **Run Tests with Coverage**: Tests with coverage report
- **Lint Code**: Run ESLint
- **Type Check**: Run TypeScript compiler
- **Generate Prisma Client**: Update database types
- **Database Migration**: Apply database changes

### Manual Debugging

#### Server-Side Debugging

```bash
# Start with Node.js inspector
cd web && pnpm dev:debug

# Or manually
cd web && NODE_OPTIONS='--inspect' pnpm dev
```

Connect Chrome DevTools or VS Code debugger to `localhost:9229`.

#### Client-Side Debugging

Open browser DevTools (`F12`) or use VS Code's browser debugging.

#### Test Debugging

```bash
# Debug all tests
cd web && pnpm test:debug

# Debug specific test file
cd web && node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

## 🧪 Testing

### Test Structure

```
web/__tests__/
├── api/                    # API endpoint tests
│   ├── conversations.test.ts
│   └── messages.test.ts
├── components/             # Component tests
│   └── tree-sidebar.test.tsx
├── lib/                    # Utility function tests
│   ├── context.test.ts
│   ├── performance.test.ts
│   └── tree.test.ts
└── jest.config.js          # Jest configuration
```

### Running Tests

```bash
cd web

# All tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# Specific test file
pnpm test tree.test.ts

# Debug tests
pnpm test:debug
```

### Test Coverage

The test suite covers:
- ✅ Tree traversal algorithms
- ✅ Context building logic
- ✅ API endpoints and validation
- ✅ React components and accessibility
- ✅ Performance benchmarks
- ✅ Error handling and edge cases

## 🗄️ Database Management

### Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt update && sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres createuser --createdb sapling
sudo -u postgres psql -c "ALTER USER sapling PASSWORD 'sapling_password';"
sudo -u postgres createdb -O sapling sapling
```

### Prisma Operations

```bash
cd web

# Generate client after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create migration
pnpm db:migrate

# Reset database (⚠️ destroys data)
pnpm db:reset

# Open database GUI
pnpm db:studio
```

## 🚀 Deployment

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL="postgresql://sapling:secure_password@localhost:5432/sapling"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Production Build

```bash
# Build optimized production bundle
cd web && pnpm build

# Start production server
cd web && pnpm start
```

### Docker Production

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Scale application
docker-compose up -d --scale app=3
```

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
cd web && pnpm build:analyze

# View report at web/analyze/client.html
```

### Performance Benchmarks

```bash
cd web && pnpm test performance.test.ts
```

### Monitoring Metrics

- Tree operations: <100ms response time
- Context building: <50ms for typical conversations
- Database queries: Optimized with proper indexing
- Bundle size: Monitored for performance impact

## 🔍 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear build cache
cd web && pnpm clean

# Reinstall dependencies
cd web && rm -rf node_modules && pnpm install

# Check TypeScript errors
cd web && pnpm type-check
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -h localhost -U sapling -d sapling

# Reset database
cd web && pnpm db:reset
```

#### Test Failures

```bash
# Run with verbose output
cd web && pnpm test --verbose

# Debug specific test
cd web && pnpm test --testNamePattern="test name"
```

#### Port Conflicts

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
cd web && pnpm dev -p 3001
```

### Debug Logs

```bash
# Enable debug logging
DEBUG=* cd web && pnpm dev

# View application logs
cd web && tail -f dev.log
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Jest Documentation](https://jestjs.io/docs)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🤝 Contributing

1. Follow the build script for consistent development setup
2. Use VS Code with provided configurations
3. Run full test suite before committing
4. Follow TypeScript and ESLint rules
5. Update documentation for new features

---

For questions or issues, please refer to the main README.md or create an issue in the repository.