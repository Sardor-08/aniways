const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Building Aniways Electron App...\n");

// Step 1: Build Next.js
console.log("📦 Step 1: Building Next.js application...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Next.js build complete!\n");
} catch (error) {
  console.error("❌ Next.js build failed!");
  process.exit(1);
}

// Step 2: Copy static files to standalone folder
console.log("📁 Step 2: Copying static files...");
const standalonePath = path.join(__dirname, "../.next/standalone");
const staticPath = path.join(__dirname, "../.next/static");
const publicPath = path.join(__dirname, "../public");

// Copy static folder
if (fs.existsSync(staticPath)) {
  const destStatic = path.join(standalonePath, ".next/static");
  fs.mkdirSync(destStatic, { recursive: true });
  copyRecursive(staticPath, destStatic);
  console.log("  ✅ Copied .next/static");
}

// Copy public folder
if (fs.existsSync(publicPath)) {
  const destPublic = path.join(standalonePath, "public");
  fs.mkdirSync(destPublic, { recursive: true });
  copyRecursive(publicPath, destPublic);
  console.log("  ✅ Copied public folder");
}

console.log("✅ Static files copied!\n");

// Step 3: Package with Electron Forge
console.log("⚡ Step 3: Packaging Electron app...");
try {
  execSync("npx electron-forge make", { stdio: "inherit" });
  console.log("✅ Electron packaging complete!\n");
} catch (error) {
  console.error("❌ Electron packaging failed!");
  process.exit(1);
}

console.log("🎉 Build complete! Check the 'out' folder for your packaged app.");

// Helper function to copy recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    files.forEach((file) => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
