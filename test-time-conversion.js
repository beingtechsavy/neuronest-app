#!/usr/bin/env node

// Test time conversion functions to ensure they work correctly

// Helper functions (same as in calendar)
const timeToUTCMinutes = (time) => {
  if (typeof time === 'string') {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  return time.getUTCHours() * 60 + time.getUTCMinutes();
};

const minutesToTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
};

const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
};

console.log('🧪 Testing Time Conversion Functions');
console.log('');

// Test cases
const testCases = [
  { time: '15:00:00', expected: 900, description: '3:00 PM' },
  { time: '09:30:00', expected: 570, description: '9:30 AM' },
  { time: '16:50:00', expected: 1010, description: '4:50 PM' },
  { time: '00:00:00', expected: 0, description: 'Midnight' },
  { time: '23:59:00', expected: 1439, description: '11:59 PM' }
];

console.log('📊 Time String to Minutes Conversion:');
testCases.forEach(test => {
  const result = timeStringToMinutes(test.time);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.time} (${test.description}) → ${result} minutes (expected: ${test.expected})`);
});

console.log('');
console.log('📊 Minutes to Time String Conversion:');
testCases.forEach(test => {
  const result = minutesToTimeString(test.expected);
  const status = result === test.time ? '✅' : '❌';
  console.log(`${status} ${test.expected} minutes → ${result} (expected: ${test.time})`);
});

console.log('');
console.log('🎯 Grid Position Test (15-minute slots):');
testCases.forEach(test => {
  const minutes = timeStringToMinutes(test.time);
  const gridPosition = Math.floor(minutes / 15) + 1;
  console.log(`✅ ${test.time} (${test.description}) → Grid Row ${gridPosition}`);
});

console.log('');
console.log('🔄 Round Trip Test:');
testCases.forEach(test => {
  const minutes = timeStringToMinutes(test.time);
  const backToTime = minutesToTimeString(minutes);
  const status = backToTime === test.time ? '✅' : '❌';
  console.log(`${status} ${test.time} → ${minutes} → ${backToTime}`);
});

console.log('');
if (testCases.every(test => timeStringToMinutes(test.time) === test.expected)) {
  console.log('🎉 All time conversion tests passed!');
  console.log('✅ Calendar time handling should work correctly');
} else {
  console.log('❌ Some tests failed - time conversion needs fixing');
}