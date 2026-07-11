import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

const PORT = process.env.PORT || 5000;
const groqKey = process.env.GROQ_API_KEY || '';
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .slice(0, 500)
    .replace(/[<>]/g, '')
    .replace(/SELECT\s+.*\s+FROM/gi, '')
    .replace(/System\s+Prompt|Ignore\s+previous\s+instructions/gi, '[Redacted]');
};

const crowdStateMetrics: Record<string, string> = {
  'Gate A Entrance': 'Low',
  'Gate B Entrance': 'High',
  'Main Food Court': 'Very High',
  'North Transit Terminal': 'Medium',
  'Medical Station Alpha': 'Low'
};

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai: groq ? 'groq-connected' : 'fallback',
    groqKeyLoaded: groqKey.length > 0,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, crowdOverride } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid message' });
    }

    const safeInput = sanitizeText(message);
    if (!safeInput) {
      return res.status(400).json({ error: 'Message empty after sanitization' });
    }

    const metricsContext = JSON.stringify(crowdOverride || crowdStateMetrics);

    const systemPrompt = `You are StadiumGPT, an AI co-pilot for FIFA World Cup 2026 stadium operations.
Current venue crowd levels: ${metricsContext}
Your job:
- Help fans navigate the stadium clearly
- Give crowd-aware routing (avoid Very High and High areas, suggest alternatives)
- Handle emergencies instantly: fire, medical, lost child → give evacuation steps
- Support accessibility needs (wheelchair, visual impairment)
- Promote sustainability (eco stations, reusable cups, solar transport)
- Answer in the language the user writes in
- Be concise, clear, and helpful. Max 3 sentences per response.`;

    if (groq) {
      try {
        const chatHistory = (history || [])
          .slice(-6)
          .map((h: { sender: string; text: string }) => ({
            role: h.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: h.text
          }));

        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: safeInput }
          ],
          max_tokens: 200,
          temperature: 0.3
        });

        const text = completion.choices[0]?.message?.content || 'No response generated.';
        return res.json({ text, source: 'groq' });

      } catch (aiError) {
        console.error('Groq error:', aiError);
      }
    }

    const lower = safeInput.toLowerCase();
    let text = '';

    const isEmergency = ['fire', 'emergency', 'lost child', 'medical', 'panic', 'fight']
      .some(k => lower.includes(k));

    if (isEmergency) {
      text = '🚨 EMERGENCY PROTOCOL ACTIVE. Security and medical units dispatched. Proceed immediately to the nearest EXIT GATE. Avoid Main Food Court — very high congestion.';
    } else if (lower.includes('wheelchair') || lower.includes('accessible')) {
      text = '♿ Accessible routes available at Gate A and Metro Link Terminal. Elevators operational. West Restrooms Block has wide automated entry.';
    } else if (lower.includes('food') || lower.includes('eat')) {
      text = '🍔 Main Food Court is Very High density. We recommend Gate A concession area which shows Low traffic right now.';
    } else if (lower.includes('gate a')) {
      text = '✅ Gate A Entrance shows Low congestion — great choice! Head straight from North Parking Lot for fastest entry.';
    } else if (lower.includes('metro') || lower.includes('transport')) {
      text = '🚇 Metro Link Terminal is at Medium density. Solar-powered rail links are active. Allow 10 extra minutes during match start times.';
    } else if (lower.includes('eco') || lower.includes('water') || lower.includes('refill')) {
      text = '🌱 Water Refill Station West near Gate A — Low traffic, free refills! Zero single-use plastic policy active at all stations.';
    } else {
      text = `StadiumGPT here! Gate A shows Low congestion, Medical Center Alpha is available, Metro Link is at Medium density. How can I help you?`;
    }

    return res.json({ text, source: 'fallback' });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`✅ StadiumGPT running on port ${PORT}`);
  console.log(`🤖 Groq AI: ${groq ? 'Connected ✅' : 'Fallback mode'}`);
  console.log(`🔑 Key loaded: ${groqKey ? 'Yes (' + groqKey.slice(0,8) + '...)' : 'No'}`);
});