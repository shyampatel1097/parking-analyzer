import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// API endpoint for analyzing parking signs
app.post('/api/analyze', async (req, res) => {
    try {
        const { images } = req.body;
        
        const messages = [
            {
                "role": "system",
                "content": `You are a parking sign analysis system. Analyze the provided parking sign images and determine:
                1. Whether parking is currently allowed (considering current time and day)
                2. Any time restrictions or limits
                3. Special conditions or exceptions
                4. Payment requirements if any`
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Can I park here right now? Analyze these parking signs."
                    },
                    ...images.map(img => ({
                        "type": "image_url",
                        "image_url": img
                    }))
                ]
            }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4-vision-preview",
                messages,
                max_tokens: 500,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API responded with ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        const analysis = JSON.parse(content);
        res.json(analysis);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze parking signs',
            details: error.message 
        });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
