# 🚀 Anonymous Chat Platform - Complete Setup Guide

This guide will help you install everything needed to run the production-ready anonymous chat application from scratch.

## 📋 Prerequisites Check

✅ **Python 3.11.9** - Already installed
⬜ **Node.js & npm** - Need to install
⬜ **Git** - Need to install
⬜ **PostgreSQL** - Need to install
⬜ **Redis** - Need to install
⬜ **Docker** (Optional) - For containerized deployment

## 🛠️ Installation Steps

### Step 1: Install Node.js and npm

**Option A: Using Official Installer (Recommended)**
1. Go to https://nodejs.org/
2. Download the **LTS version** (Currently v20.x)
3. Run the installer with default settings
4. Restart your PowerShell terminal
5. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

**Option B: Using Chocolatey (Windows Package Manager)**
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs
```

### Step 2: Install Git

**Option A: Official Installer**
1. Go to https://git-scm.com/download/win
2. Download and install with default settings

**Option B: Using Chocolatey**
```powershell
choco install git
```

### Step 3: Install PostgreSQL

**Option A: Official Installer**
1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL 15 or 16
3. During installation:
   - Set password for postgres user (remember this!)
   - Use default port 5432
   - Install Stack Builder components

**Option B: Using Chocolatey**
```powershell
choco install postgresql
```

### Step 4: Install Redis

**Option A: Using WSL2 (Recommended for Windows)**
```powershell
# Enable WSL2
wsl --install

# After restart, install Redis in WSL
wsl
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

**Option B: Using Windows Port**
1. Go to https://github.com/microsoftarchive/redis/releases
2. Download Redis-x64-3.0.504.msi
3. Install with default settings

**Option C: Using Docker**
```powershell
# Install Docker Desktop first from https://www.docker.com/products/docker-desktop/
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Step 5: Install Python Dependencies

```powershell
# Install pip packages globally or use virtual environment
pip install --upgrade pip
pip install virtualenv
```

## 🔧 Project Setup After Installation

Once all tools are installed, run these commands:

```powershell
# Navigate to project
cd d:\chatweb

# Install root dependencies
npm install

# Install and build shared package
cd shared
npm install
npm run build
cd ..

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies  
cd client
npm install
cd ..

# Set up database
cd server
copy .env.example .env
# Edit .env file with your database credentials
npm run db:migrate
npm run db:seed
cd ..
```

## 🚀 Running the Application

```powershell
# Start all services (from root directory)
npm run dev

# Or start individually:
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev

# Terminal 3: Start Redis (if not running as service)
redis-server
```

## 🔍 Verification

After everything is running, you should be able to access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🆘 Troubleshooting

### Common Issues:

1. **"npm is not recognized"**
   - Restart PowerShell after Node.js installation
   - Add Node.js to PATH manually if needed

2. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check credentials in .env file
   - Create database if it doesn't exist

3. **Redis connection failed**
   - Ensure Redis server is running
   - Check Redis URL in .env file

4. **Port already in use**
   - Change ports in .env files
   - Kill processes using the ports

### Getting Help:

1. Check the logs in the terminal
2. Review the .env configuration
3. Ensure all services are running
4. Check firewall settings

## 🎯 Next Steps

After successful installation and setup:

1. **Development**: Start coding new features
2. **Testing**: Run test suites
3. **Deployment**: Use Docker for production
4. **Monitoring**: Set up logging and metrics
5. **Security**: Configure SSL and security headers

---

**Ready to proceed?** Let me know when you've installed the prerequisites and I'll help you set up the complete project!
