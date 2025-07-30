# 🚀 Simple Node.js Installer (No Admin Required)
# This script downloads and installs Node.js to your user directory

Write-Host "📦 Downloading Node.js LTS..." -ForegroundColor Cyan

# Create tools directory
$toolsDir = "$env:USERPROFILE\tools"
$nodeDir = "$toolsDir\nodejs"

if (!(Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force
}

# Download Node.js
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$nodeZip = "$toolsDir\nodejs.zip"

try {
    Write-Host "⬇️  Downloading Node.js..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip
    
    Write-Host "📂 Extracting Node.js..." -ForegroundColor Yellow
    Expand-Archive -Path $nodeZip -DestinationPath $toolsDir -Force
    
    # Rename extracted folder
    $extractedDir = Get-ChildItem -Path $toolsDir -Directory | Where-Object { $_.Name -like "node-*" } | Select-Object -First 1
    if ($extractedDir) {
        Rename-Item -Path $extractedDir.FullName -NewName "nodejs"
    }
    
    # Add to PATH for current session
    $env:PATH = "$nodeDir;$env:PATH"
    
    Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
    Write-Host "📁 Installation directory: $nodeDir" -ForegroundColor Cyan
    
    # Test installation
    & "$nodeDir\node.exe" --version
    & "$nodeDir\npm.cmd" --version
    
    Write-Host "`n🔧 To permanently add to PATH:" -ForegroundColor Yellow
    Write-Host "1. Open System Properties > Environment Variables" -ForegroundColor White
    Write-Host "2. Add to User PATH: $nodeDir" -ForegroundColor White
    Write-Host "3. Restart PowerShell" -ForegroundColor White
    
    # Clean up
    Remove-Item $nodeZip -Force
    
} catch {
    Write-Host "❌ Failed to install Node.js: $($_.Exception.Message)" -ForegroundColor Red
}
