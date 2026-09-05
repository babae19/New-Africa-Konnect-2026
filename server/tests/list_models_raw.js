const https = require('https');
require('dotenv').config();

const apiKey = process.env.AI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else {
                console.log("Available Models:");
                if (json.models) {
                    json.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
                } else {
                    console.log("No models found in response:", json);
                }
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw Response:", data);
        }
    });

}).on("error", (err) => {
    console.error("Error:", err.message);
});
