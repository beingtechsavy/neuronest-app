// Test script to verify receipt length
const userId = "12345678-1234-1234-1234-123456789012"; // Sample UUID
const planName = "Master";
const timestamp = Date.now().toString().slice(-8);
const userIdShort = userId.slice(-8);
const planCode = planName === 'Master' ? 'M' : 'W';
const receipt = `Y${planCode}${userIdShort}${timestamp}`;

console.log('Receipt:', receipt);
console.log('Receipt length:', receipt.length);
console.log('Max allowed:', 40);
console.log('Valid:', receipt.length <= 40 ? '✅' : '❌');

// Test with different scenarios
const testCases = [
  { planName: 'Master', userId: '12345678-1234-1234-1234-123456789012' },
  { planName: 'Warrior', userId: 'abcdefgh-ijkl-mnop-qrst-uvwxyz123456' },
  { planName: 'Master', userId: 'short-id' },
];

testCases.forEach((testCase, index) => {
  const ts = Date.now().toString().slice(-8);
  const userShort = testCase.userId.slice(-8);
  const code = testCase.planName === 'Master' ? 'M' : 'W';
  const rec = `Y${code}${userShort}${ts}`;
  
  console.log(`\nTest ${index + 1}:`);
  console.log('Plan:', testCase.planName);
  console.log('User ID:', testCase.userId);
  console.log('Receipt:', rec);
  console.log('Length:', rec.length);
  console.log('Valid:', rec.length <= 40 ? '✅' : '❌');
});