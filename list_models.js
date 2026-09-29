require('dotenv').config();
const axios = require('axios');

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("Models supporting image generation:");
        const models = response.data.models;
        models.forEach(m => {
            console.log(m.name, m.supportedGenerationMethods);
        });
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
listModels();
