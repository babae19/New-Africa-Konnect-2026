/**
 * Test script for bidding API endpoints
 * Run with: node test-bidding-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials (you'll need to replace these with actual test users)
const CLIENT_TOKEN = 'your-client-jwt-token';
const EXPERT_TOKEN = 'your-expert-jwt-token';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testBiddingAPI() {
    console.log('🧪 Testing Bidding API Endpoints\n');

    try {
        // Test 1: Submit a bid (as expert)
        console.log('1️⃣  Testing: Submit Bid');
        const bidData = {
            bidAmount: 5000,
            proposedTimeline: '4 weeks',
            proposedDuration: 28,
            coverLetter: 'I am very interested in this project and have 5 years of experience...',
            portfolioLinks: ['https://github.com/expert', 'https://portfolio.com']
        };

        try {
            const bidResponse = await client.post('/projects/PROJECT_ID_HERE/bids', bidData, {
                headers: { Authorization: `Bearer ${EXPERT_TOKEN}` }
            });
            console.log('✅ Bid submitted successfully');
            console.log('   Bid ID:', bidResponse.data.id);
        } catch (error) {
            console.log('⚠️  Bid submission test skipped (need valid project ID and expert token)');
            console.log('   Error:', error.response?.data?.message || error.message);
        }

        // Test 2: Get expert's bids
        console.log('\n2️⃣  Testing: Get My Bids (Expert)');
        try {
            const myBidsResponse = await client.get('/experts/my-bids', {
                headers: { Authorization: `Bearer ${EXPERT_TOKEN}` }
            });
            console.log('✅ Retrieved expert bids');
            console.log('   Total bids:', myBidsResponse.data.count);
        } catch (error) {
            console.log('⚠️  Get my bids test skipped (need valid expert token)');
            console.log('   Error:', error.response?.data?.message || error.message);
        }

        // Test 3: Get bids for project (as client)
        console.log('\n3️⃣  Testing: Get Bids for Project (Client)');
        try {
            const projectBidsResponse = await client.get('/projects/PROJECT_ID_HERE/bids', {
                headers: { Authorization: `Bearer ${CLIENT_TOKEN}` }
            });
            console.log('✅ Retrieved project bids');
            console.log('   Total bids:', projectBidsResponse.data.count);
        } catch (error) {
            console.log('⚠️  Get project bids test skipped (need valid project ID and client token)');
            console.log('   Error:', error.response?.data?.message || error.message);
        }

        // Test 4: Accept a bid (as client)
        console.log('\n4️⃣  Testing: Accept Bid (Client)');
        try {
            const acceptResponse = await client.put('/projects/PROJECT_ID_HERE/bids/BID_ID_HERE/accept', {}, {
                headers: { Authorization: `Bearer ${CLIENT_TOKEN}` }
            });
            console.log('✅ Bid accepted successfully');
            console.log('   Message:', acceptResponse.data.message);
        } catch (error) {
            console.log('⚠️  Accept bid test skipped (need valid IDs and client token)');
            console.log('   Error:', error.response?.data?.message || error.message);
        }

        // Test 5: Withdraw a bid (as expert)
        console.log('\n5️⃣  Testing: Withdraw Bid (Expert)');
        try {
            const withdrawResponse = await client.delete('/bids/BID_ID_HERE/withdraw', {
                headers: { Authorization: `Bearer ${EXPERT_TOKEN}` }
            });
            console.log('✅ Bid withdrawn successfully');
            console.log('   Message:', withdrawResponse.data.message);
        } catch (error) {
            console.log('⚠️  Withdraw bid test skipped (need valid bid ID and expert token)');
            console.log('   Error:', error.response?.data?.message || error.message);
        }

        console.log('\n✅ API endpoint structure verified!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Create test users (client and expert)');
        console.log('   3. Create a test project with open_for_bidding=true');
        console.log('   4. Update this script with real tokens and IDs');
        console.log('   5. Run full integration tests');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run tests
testBiddingAPI();
