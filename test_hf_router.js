require('dotenv').config();
const axios = require('axios');

async function testHFRouter() {
    try {
        const apiKey = process.env.HF_API_KEY;
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/v1/images/generations',
            { 
                model: "black-forest-labs/FLUX.1-dev",
                prompt: "A beautiful sunset"
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Success!");
    } catch (err) {
        console.error("Error:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}
testHFRouter();
