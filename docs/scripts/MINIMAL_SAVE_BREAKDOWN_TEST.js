// MINIMAL SAVE BREAKDOWN TEST
// Test the save-breakdown API with minimal data to isolate the issue

const testSaveBreakdown = async () => {
  console.log('🧪 Testing save-breakdown API...');
  
  // Minimal test data
  const testData = {
    userId: 'test-user-id', // Replace with actual user ID
    breakdown: [
      {
        step: 'Test step 1',
        difficulty: 'EASY',
        estimatedMinutes: 15,
        order: 1,
        completionCriteria: 'Complete the test'
      }
    ],
    taskTitle: 'Test AI Breakdown',
    selectedSubjectId: null,
    newSubjectName: 'Test Subject',
    createNewSubject: true,
    saveTasksToInbox: true
  };
  
  try {
    console.log('📤 Sending request with data:', testData);
    
    const response = await fetch('/api/ai/save-breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', result);
    
    if (!response.ok) {
      console.error('❌ API Error:', result.error);
    } else {
      console.log('✅ API Success:', result);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testSaveBreakdown();

// Instructions:
// 1. Open browser console on your app
// 2. Copy and paste this entire script
// 3. Replace 'test-user-id' with your actual user ID
// 4. Run it and check the console output