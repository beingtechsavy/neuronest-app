// Check PayPal credentials format
const fs = require('fs');

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('📄 Raw .env.local content (PayPal section):');
  console.log('===========================================');
  
  const lines = envContent.split('\n');
  let inPayPalSection = false;
  
  lines.forEach((line, index) => {
    if (line.includes('PayPal Configuration') || line.includes('PAYPAL')) {
      inPayPalSection = true;
    }
    
    if (inPayPalSection && (line.includes('PAYPAL') || line.trim() === '')) {
      console.log(`Line ${index + 1}: "${line}"`);
      
      if (line.includes('CLIENT_ID')) {
        const value = line.split('=')[1];
        console.log(`  → Length: ${value ? value.length : 0}`);
        console.log(`  → Starts with: ${value ? value.substring(0, 5) : 'N/A'}`);
        console.log(`  → Has spaces: ${value ? value.includes(' ') : false}`);
      }
      
      if (line.includes('CLIENT_SECRET')) {
        const value = line.split('=')[1];
        console.log(`  → Length: ${value ? value.length : 0}`);
        console.log(`  → Has spaces: ${value ? value.includes(' ') : false}`);
      }
    }
    
    if (inPayPalSection && line.trim() !== '' && !line.includes('PAYPAL') && !line.includes('#')) {
      inPayPalSection = false;
    }
  });
  
} catch (error) {
  console.log('❌ Error reading file:', error.message);
}