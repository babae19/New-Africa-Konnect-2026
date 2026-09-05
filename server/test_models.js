const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const listModels = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
        // Direct access to model list might not be exposed easily in high-level SDK, 
        // but let's try a standard model guess or just print error details better.
        // Actually, the error message said: "Call ListModels to see the list..."
        // The SDK might not have a simple listModels method exposed on genAI instance directly in v0.1.

        console.log("Attempting to use 'gemini-1.5-flash-latest'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        try {
            const result = await model.generateContent("Test");
            console.log("Success with gemini-1.5-flash-latest");
        } catch (e) {
            console.log("Failed with gemini-1.5-flash-latest:", e.message);
        }

        console.log("Attempting to use 'gemini-1.0-pro'...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        try {
            const result = await model2.generateContent("Test");
            console.log("Success with gemini-1.0-pro");
        } catch (e) {
            console.log("Failed with gemini-1.0-pro:", e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

listModels();
