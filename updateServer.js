const fs = require('fs'); let js = fs.readFileSync('c:/Users/SHIN/Desktop/AI/server.js', 'utf8'); const regex = /app\.get\('\/api\/music', async \(req, res\) => \{[\s\S]*?catch \(error\) \{\s*console\.error\('\\[Jamendo BFF Error\\]', error\.message\);\s*res\.status\(500\)\.json\(\{ error: 'JAMENDO_API_ERROR' \}\);\s*\}\s*\}\);/; const newData = \pp.get('/api/music', async (req, res) => {
    try {
        const client_id = process.env.JAMENDO_CLIENT_ID || '39d0c23d'; // Fallback to test key if env is missing
        const requestedTag = req.query.tag;
        const requestedId = req.query.id;
        
        if (requestedId) {
            // Search by exact track ID
            const url = \\\https://api.jamendo.com/v3.0/tracks/?client_id=\\\&format=json&id[]=\\\\\\;
            const response = await axios.get(url);
            const results = response.data.results;
            if (results && results.length > 0) {
                const track = results[0];
                return res.json({
                    success: true,
                    track: {
                        id: track.id,
                        name: track.name,
                        artist_name: track.artist_name,
                        audio: track.audio.replace(/^http:\\\\/\\\\//i, 'https://'),
                        image: track.image
                    }
                });
            }
            return res.status(404).json({ error: 'NO_RESULTS_FOUND' });
        }

        // Search by Tag
        const tag = requestedTag || 'chill';
        async function attemptFetch(searchTag) {
            const cacheKey = \\\jamendo_\\\\\\;
            const now = Date.now();
            const cached = jamendoCache.get(cacheKey);
            if (cached && cached.expiresAt > now) {
                return cached.data;
            }

            const url = \\\https://api.jamendo.com/v3.0/tracks/?client_id=\\\&format=json&limit=30&tags=\\\\\\;
            const response = await axios.get(url);
            const results = response.data.results;
            
            if (results && results.length > 0) {
                jamendoCache.set(cacheKey, { data: results, expiresAt: now + CACHE_TTL });
                return results;
            }
            return null;
        }

        let results = await attemptFetch(tag);

        if (!results) {
            const safeTag = TAG_FALLBACK_CHAIN[tag] || 'chill';
            console.warn(\\\[Jamendo BFF] 0 results for \\\, retrying with safe tag: \\\\\\);
            results = await attemptFetch(safeTag);
        }

        if (!results) {
            return res.status(404).json({ error: 'NO_RESULTS_FOUND' });
        }

        const randomIdx = Math.floor(Math.random() * results.length);
        const track = results[randomIdx];
        const normalizedAudioUrl = track.audio.replace(/^http:\\\\/\\\\//i, 'https://');

        return res.json({
            success: true,
            track: {
                id: track.id,
                name: track.name,
                artist_name: track.artist_name,
                audio: normalizedAudioUrl,
                image: track.image
            }
        });

    } catch (error) {
        console.error('[Jamendo BFF Error]', error.message);
        res.status(500).json({ error: 'JAMENDO_API_ERROR' });
    }
});

// --- NEW FREESOUND BFF ---
app.get('/api/freesound', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ error: 'query parameter is required' });
        
        // Use environment variable, fallback to the hardcoded key for the user's convenience if not set yet
        const apiKey = process.env.FREESOUND_API_KEY || 'x6p0xIMBjuswaNGwaQ0P3WO4fEMoPN2GeELTQFAu';
        
        const url = \\\https://freesound.org/apiv2/search/text/?query=\\\&token=\\\&fields=id,name,previews&filter=tag:music\\\;
        const response = await axios.get(url);
        
        return res.json(response.data);
    } catch (error) {
        console.error('[Freesound BFF Error]', error.message);
        res.status(500).json({ error: 'FREESOUND_API_ERROR' });
    }
});\; js = js.replace(regex, newData); fs.writeFileSync('c:/Users/SHIN/Desktop/AI/server.js', js);
