require('dotenv').config();
const aiController = require('./controllers/aiController');

const testHelper = async () => {
    try {
        console.log('Testing AI Controller initialization...');
        if (!process.env.RAPIDAPI_KEY) {
            console.error('Error: RAPIDAPI_KEY is missing in .env');
            process.exit(1);
        }

        // Simple mock request/response
        const req = { body: { message: "Hello", context: { role: "admin" } } };
        const res = {
            json: (data) => console.log('Response:', data),
            status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
        };

        console.log('Testing chat function...');
        await aiController.chat(req, res);
        console.log('Test complete.');
    } catch (error) {
        console.error('Test failed:', error);
    }
};

testHelper();
