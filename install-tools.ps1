# 🚀 Quick Installation Script for Windows
# This script will install the essential tools needed

Write-Host "🎯 Anonymous Chat Platform - Auto Installer" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host "❌ This script needs to run as Administrator for some installations." -ForegroundColor Red
    Write-Host "Please right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Install Chocolatey if not installed
Write-Host "📦 Checking for Chocolatey package manager..." -ForegroundColor Cyan
try {
    choco --version | Out-Null
    Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
} catch {
    Write-Host "📥 Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installed" -ForegroundColor Green
}

# Install Node.js
Write-Host "📦 Installing Node.js..." -ForegroundColor Cyan
try {
    choco install nodejs -y
    Write-Host "✅ Node.js installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Node.js" -ForegroundColor Red
}

# Install Git
Write-Host "📦 Installing Git..." -ForegroundColor Cyan
try {
    choco install git -y
    Write-Host "✅ Git installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Git" -ForegroundColor Red
}

# Install PostgreSQL
Write-Host "📦 Installing PostgreSQL..." -ForegroundColor Cyan
try {
    choco install postgresql --params '/Password:postgres123' -y
    Write-Host "✅ PostgreSQL installed (password: postgres123)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install PostgreSQL" -ForegroundColor Red
}

# Install Redis
Write-Host "📦 Installing Redis..." -ForegroundColor Cyan
try {
    choco install redis-64 -y
    Write-Host "✅ Redis installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Redis" -ForegroundColor Red
}

# Install Docker Desktop (optional)
Write-Host "📦 Installing Docker Desktop (optional)..." -ForegroundColor Cyan
$dockerChoice = Read-Host "Do you want to install Docker Desktop? (y/n)"
if ($dockerChoice -eq 'y' -or $dockerChoice -eq 'Y') {
    try {
        choco install docker-desktop -y
        Write-Host "✅ Docker Desktop installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Docker Desktop" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Installation completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Please restart your PowerShell terminal and run:" -ForegroundColor Yellow
Write-Host "  node --version" -ForegroundColor White
Write-Host "  npm --version" -ForegroundColor White
Write-Host "  git --version" -ForegroundColor White
Write-Host "`nThen run the project setup commands from INSTALLATION_GUIDE.md" -ForegroundColor Yellow

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "`n🔄 Refreshing environment variables..." -ForegroundColor Cyan
Write-Host "You may need to restart PowerShell for all changes to take effect." -ForegroundColor Yellow
