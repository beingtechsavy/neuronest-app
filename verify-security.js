#!/usr/bin/env node

/**
 * Security Verification Script
 * Checks that sensitive keys are properly configured and not exposed
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Verification...\n');

let hasIssues = false;

// Detect if running in CI/CD environment (Vercel, GitHub Actions, etc.)
const isCI = process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS;

// 1. Check if .env.local exists (skip in CI/CD)
if (!fs.existsSync('.env.local')) {
  if (isCI) {
    console.log('ℹ️  .env.local not found (expected in CI/CD - using platform environment variables)');
  } else {
    console.log('⚠️  .env.local not found - create it from .env.example for local development');
    // Don't fail the build, just warn
  }
} else {
  console.log('✅ .env.local exists');
}

// 2. Check if .env.local is in git
const { execSync } = require('child_process');
try {
  const gitFiles = execSync('git ls-files .env.local', { encoding: 'utf8' });
  if (gitFiles.trim()) {
    console.log('❌ CRITICAL: .env.local is tracked by git!');
    console.log('   Run: git rm --cached .env.local');
    hasIssues = true;
  } else {
    console.log('✅ .env.local is not tracked by git');
  }
} catch (error) {
  console.log('⚠️  Could not check git status');
}

// 3. Check for NEXT_PUBLIC_ prefix on sensitive keys
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'AZURE_OPENAI_API_KEY',
    'RAZORPAY_KEY_SECRET',
    'RESEND_API_KEY'
  ];
  
  sensitiveKeys.forEach(key => {
    if (envContent.includes(`NEXT_PUBLIC_${key}`)) {
      console.log(`❌ CRITICAL: ${key} has NEXT_PUBLIC_ prefix - this exposes it to the browser!`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues) {
    console.log('✅ No sensitive keys have NEXT_PUBLIC_ prefix');
  }
}

// 4. Check client-side code for service role key usage
console.log('\n🔍 Scanning for unsafe service role key usage...');

const clientDirs = ['src/components', 'src/app'];
let unsafeUsage = false;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'api') {
      scanDirectory(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for 'use client' directive
      const isClientComponent = content.includes("'use client'") || content.includes('"use client"');
      
      // Check for service role key usage
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        if (isClientComponent || !fullPath.includes('/api/')) {
          console.log(`❌ CRITICAL: Service role key used in client code: ${fullPath}`);
          unsafeUsage = true;
          hasIssues = true;
        }
      }
    }
  });
}

clientDirs.forEach(dir => scanDirectory(dir));

if (!unsafeUsage) {
  console.log('✅ No unsafe service role key usage found in client code');
}

// 5. Summary
console.log('\n' + '='.repeat(50));
if (hasIssues) {
  console.log('❌ SECURITY ISSUES FOUND - Please fix the issues above');
  process.exit(1);
} else {
  console.log('✅ All security checks passed!');
  
  if (isCI) {
    console.log('\n📋 CI/CD Environment Detected:');
    console.log('   ✓ Ensure environment variables are set in deployment platform');
    console.log('   ✓ Mark sensitive keys as "Sensitive" or "Secret"');
  } else {
    console.log('\n📋 Next steps for production:');
    console.log('   1. Set environment variables in Vercel');
    console.log('   2. Mark sensitive keys as "Sensitive"');
    console.log('   3. Enable Supabase RLS on all tables');
    console.log('   4. Review SECURITY.md for best practices');
  }
  process.exit(0);
}
