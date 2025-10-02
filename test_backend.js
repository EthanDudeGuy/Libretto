/**
 * Simple Backend Test Script
 * Run this to test if your backend server is working properly
 */

const BACKEND_URL = 'http://localhost:8000';

async function testBackend() {
  console.log('🧪 Testing Backend Server...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test 2: Root endpoint
    console.log('\n2. Testing root endpoint...');
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Root endpoint passed:', rootData);
    } else {
      console.log('❌ Root endpoint failed:', rootResponse.status);
    }
    
    // Test 3: Chat endpoint (this will show if API key is configured)
    console.log('\n3. Testing chat endpoint...');
    const chatPayload = {
      session_id: "test-session",
      message: "Hello, this is a test message",
      book_data: {
        title: "Test Book",
        author: "Test Author",
        currentPage: 1,
        totalPages: 100,
        progress: 1,
        description: "A test book for API testing"
      },
      conversation_history: [],
      user: {
        firstName: "Test",
        name: "Test User",
        email: "test@example.com"
      }
    };
    
    const chatResponse = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatPayload)
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat endpoint passed');
      console.log('   Response format:', {
        success: chatData.success,
        hasMessage: !!chatData.message,
        sessionId: chatData.session_id
      });
      
      if (chatData.message && chatData.message.includes('API key')) {
        console.log('⚠️  API key not configured - chat will show error message');
      } else {
        console.log('🤖 Claude API is working!');
      }
    } else {
      console.log('❌ Chat endpoint failed:', chatResponse.status);
      const errorText = await chatResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Test 4: Summary endpoint
    console.log('\n4. Testing summary endpoint...');
    const summaryPayload = {
      session_id: "test-summary-session",
      book_data: {
        title: "Test Book",
        author: "Test Author",
        currentPage: 1,
        totalPages: 100,
        progress: 1,
        description: "A test book for API testing"
      },
      user: {
        firstName: "Test",
        name: "Test User",
        email: "test@example.com"
      }
    };
    
    const summaryResponse = await fetch(`${BACKEND_URL}/api/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(summaryPayload)
    });
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Summary endpoint passed');
      console.log('   Response format:', {
        success: summaryData.success,
        hasSummary: !!summaryData.summary,
        sessionId: summaryData.session_id
      });
    } else {
      console.log('❌ Summary endpoint failed:', summaryResponse.status);
      const errorText = await summaryResponse.text();
      console.log('   Error:', errorText);
    }
    
    console.log('\n🎉 Backend testing complete!');
    console.log('\nNext steps:');
    console.log('1. If API key is not configured, set your ANTHROPIC_API_KEY environment variable');
    console.log('2. Or edit the backend_server.py file and replace "your_api_key_here" with your actual key');
    console.log('3. Restart the backend server');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('\nMake sure your backend server is running:');
    console.log('cd src/services && python3 backend_server.py');
  }
}

// Run the test
testBackend();
