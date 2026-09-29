require('dotenv').config();
const axios = require('axios');

async function testImagen() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
            {
                instances: [
                    { prompt: "A serene landscape with mountains and a lake" }
                ],
                parameters: {
                    sampleCount: 1
                }
            }
        );
        console.log("Success!");
        console.log("Image data length:", response.data.predictions[0].bytesBase64Encoded.length);
    } catch (err) {
        console.error("Error:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

testImagen();
