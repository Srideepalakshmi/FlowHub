const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

// 1. Rewrite all hardcoded frontend URLs to use an environment variable falling back to localhost
const frontendSrc = path.join(__dirname, 'frontend', 'src');
const files = walk(frontendSrc);

console.log("Scanning frontend files for hardcoded API URLs...");
let updatedCount = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace string literals like: 'http://localhost:5000/auth/login'
    content = content.replace(/['"]http:\/\/localhost:5000([^'"]*)['"]/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
    
    // Replace template literals: `http://localhost:5000/workflows/${id}`
    content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

    fs.writeFileSync(f, content, 'utf8');
    updatedCount++;
});

console.log(`Replaced hardcoded API URLs in ${updatedCount} files.`);

// 2. Prepare Render / Vercel deployment files
const backendDir = path.join(__dirname, 'backend');

// Prepare render.yaml for backend
const renderYaml = `services:
  - type: web
    name: flowhub-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 5000
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
`;
fs.writeFileSync(path.join(__dirname, 'render.yaml'), renderYaml);
console.log("Generated render.yaml footprint for Backend deployment.");

// Prepare vercel.json for frontend
const vercelJson = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;
fs.writeFileSync(path.join(__dirname, 'frontend', 'vercel.json'), vercelJson);
console.log("Generated vercel.json footprint for Frontend deployment.");

console.log("Deployment parameters successfully prepared.");
