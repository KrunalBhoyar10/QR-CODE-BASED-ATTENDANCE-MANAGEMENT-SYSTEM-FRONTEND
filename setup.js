#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Teacher Frontend for Attendance Management System\n');

// Check if .env exists, if not copy from example
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    // Create basic .env file
    const basicEnv = 'REACT_APP_API_URL=http://localhost:3000/api/v1\n';
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Created basic .env file');
  }
} else {
  console.log('ℹ️  .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  Dependencies already installed');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Make sure your backend API is running on http://localhost:3000');
console.log('2. Update .env file if your API URL is different');
console.log('3. Run: npm start');
console.log('4. Open your browser to http://localhost:3001');
console.log('\n📚 For more information, see README.md');
console.log('\n🔐 Default teacher login credentials should be obtained from your backend setup.');