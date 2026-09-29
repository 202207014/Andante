const axios = require('axios');

async function testPollinations() {
    try {
        const response = await axios.get(
            `https://image.pollinations.ai/prompt/A%20beautiful%20sunset`,
            { responseType: 'arraybuffer' }
        );
        console.log("Success! Image length:", response.data.byteLength);
    } catch (err) {
        console.error("Error:", err.message);
    }
}
testPollinations();
