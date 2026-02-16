#!/usr/bin/env node

// Interactive OAuth Configuration Script
const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔐 Synthient Google OAuth Configuration');
  console.log('========================================\n');

  // Check if credentials already exist
  const envPath = '.env';
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');

    if (!envContent.includes('your-client-id.apps.googleusercontent.com')) {
      console.log('✅ OAuth credentials already configured!\n');
      rl.close();
      return;
    }
  }

  console.log('📋 To get Google OAuth credentials:\n');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Create a new project or select existing');
  console.log('3. Click "Create Credentials" → "OAuth client ID"');
  console.log('4. Application type: "Web application"');
  console.log('5. Name: "Synthient"');
  console.log('6. Authorized JavaScript origins:');
  console.log('   • http://localhost:3000');
  console.log('7. Authorized redirect URIs:');
  console.log('   • http://localhost:3000/api/auth/google/callback');
  console.log('8. Click "Create" and copy the credentials\n');

  const shouldOpen = await question('Open Google Cloud Console now? (y/n): ');

  if (shouldOpen.toLowerCase() === 'y') {
    console.log('\n🌐 Opening browser...\n');
    try {
      execSync('open https://console.cloud.google.com/apis/credentials', { stdio: 'ignore' });
    } catch (e) {
      console.log('Could not open browser automatically.');
    }
  }

  console.log('Once you have your credentials, enter them below:\n');

  const clientId = await question('Google Client ID: ');
  const clientSecret = await question('Google Client Secret: ');

  if (!clientId || !clientSecret) {
    console.log('\n❌ Both Client ID and Client Secret are required.\n');
    rl.close();
    return;
  }

  // Update .env file
  envContent = envContent.replace(
    /GOOGLE_CLIENT_ID=.*/,
    `GOOGLE_CLIENT_ID=${clientId}`
  );
  envContent = envContent.replace(
    /GOOGLE_CLIENT_SECRET=.*/,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`
  );

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ OAuth credentials saved to .env');
  console.log('\n🔄 Restarting OAuth server...\n');

  try {
    // Kill existing oauth server
    execSync('pkill -f "node oauth-server.js"', { stdio: 'ignore' });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start new server
    console.log('Starting OAuth server with new credentials...');
    execSync('node oauth-server.js > /tmp/oauth-server.log 2>&1 &');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ OAuth server restarted successfully!');
    console.log('\n🎯 Next step:');
    console.log('   Open http://localhost:3001 and try logging in!\n');
  } catch (error) {
    console.log('\n⚠️  Could not restart server automatically.');
    console.log('Run: node oauth-server.js\n');
  }

  rl.close();
}

main().catch(console.error);
