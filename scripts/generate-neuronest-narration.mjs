import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local'), override: true });

const apiKey = process.env.ELEVENLABS_API_KEY;
// River is a relaxed, neutral, informative English voice that fits the
// requested calm, warm premium-SaaS direction. Override it in .env.local if
// the project owner prefers another voice from their ElevenLabs library.
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'SAz9YHcvj6GT2YYXdXww';
const root = process.cwd();
const outputPath = path.join(root, 'public', 'audio', 'neuronest-narration.mp3');

if (!apiKey) {
  console.error('Missing ELEVENLABS_API_KEY. Add it to the private .env.local file; do not paste it into chat.');
  process.exit(1);
}

async function listVoices() {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  });
  if (!response.ok) throw new Error(`ElevenLabs voice lookup failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const voices = Array.isArray(payload.voices) ? payload.voices : [];
  for (const voice of voices.slice(0, 40)) {
    const labels = voice.labels ? ` ${JSON.stringify(voice.labels)}` : '';
    console.log(`${voice.voice_id}\t${voice.name}${labels}`);
  }
}

if (process.argv.includes('--list-voices')) {
  console.log('Available voices:');
  await listVoices();
}

const text = await fs.readFile(path.join(root, 'scripts', 'neuronest-brag-narration.txt'), 'utf8');
// 128 kbps is broadly available across ElevenLabs plans and is sufficient
// for a clear narration track once mixed beneath music.
const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: text.trim(),
    model_id: process.env.ELEVENLABS_MODEL || 'eleven_v4',
    voice_settings: {
      stability: 0.52,
      similarity_boost: 0.78,
      style: 0.22,
      use_speaker_boost: true,
    },
  }),
});

if (!response.ok) {
  throw new Error(`ElevenLabs speech generation failed: ${response.status} ${await response.text()}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
console.log(`Wrote ${path.relative(root, outputPath)}`);
