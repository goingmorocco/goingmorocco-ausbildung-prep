#!/usr/bin/env node
/**
 * Generates real German audio for every Hoeren (listening) section, from
 * the same transcripts already used as the text fallback in the app.
 *
 * WHY THIS EXISTS
 * Listening sections currently show a transcript labeled "read this as if
 * you were hearing it" -- an honest placeholder, not real practice. This
 * script converts each transcript to speech via OpenAI's TTS API and saves
 * the result under public/audio/. The app already knows how to find these
 * files (see api/testsContent.js -> section.audio_url) and will start
 * playing real audio automatically as soon as the files exist -- no other
 * code changes needed.
 *
 * SETUP (one-time)
 *   1. Get an API key at https://platform.openai.com/api-keys
 *      (Text-to-speech is billed per character; this whole library is
 *      roughly 20,000 characters, i.e. well under $1 total, one-time --
 *      not a per-student cost, since the files are generated once and
 *      served as static audio to everyone.)
 *   2. Set it as an environment variable:
 *        export OPENAI_API_KEY="sk-..."
 *   3. Run:
 *        node scripts/generate-audio.js
 *
 * The script is resumable: it skips any file that already exists, so if
 * it's interrupted (or you add new listening content later) you can just
 * run it again and it will only generate what's missing. Pass --force to
 * regenerate everything anyway.
 *
 * Swap TTS providers: the only thing that talks to the network is
 * synthesizeSpeech() below. To use Google Cloud TTS or ElevenLabs instead,
 * replace that one function -- everything else (content discovery, file
 * naming, resumability) stays the same.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { mockTests, mockContent } = require('../api/testsContent');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio');
const FORCE = process.argv.includes('--force');

// tts-1-hd = higher quality, worth it for prep material students will
// replay. "onyx" is a calmer, clearer voice that tends to read non-English
// text more steadily than the brighter voices -- swap freely.
const MODEL = 'tts-1-hd';
const VOICE = 'onyx';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable.');
  console.error('Get a key at https://platform.openai.com/api-keys, then:');
  console.error('  export OPENAI_API_KEY="sk-..."');
  process.exit(1);
}

/**
 * Turns a transcript formatted for on-screen reading (numbered lines,
 * "A:"/"B:" speaker tags, a title line before a colon, wrapping quotes)
 * into plain text that reads naturally aloud.
 */
function cleanForSpeech(passage) {
  // Strip quote characters first -- they often wrap the whole dialogue and
  // would otherwise sit at the start of a line, breaking the speaker-tag
  // match below (e.g. a line literally starting with `"Moderator: ...`).
  let text = passage.replace(/["“”]/g, '');

  // Drop a short leading title line ending in ":" (e.g. "Telefongespraech
  // im Buero:") -- it's a label for the reader's eyes, not part of speech.
  const lines = text.split('\n');
  if (lines.length > 1 && lines[0].length < 60 && lines[0].trim().endsWith(':')) {
    lines.shift();
    text = lines.join('\n');
  }

  text = text
    .replace(/^\d+\.\s*/gm, '')        // "1. " list numbering
    .replace(/^[A-ZÄÖÜ][a-zäöüß]*(\s[A-ZÄÖÜ][a-zäöüß]*)?:\s*/gm, '')  // "A:", "Moderator:", "Herr Wagner:" speaker tags
    .replace(/\n+/g, ' ')              // newlines -> natural pause via space
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text;
}

function synthesizeSpeech(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ model: MODEL, voice: VOICE, input: text, response_format: 'mp3' });

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => reject(new Error(`OpenAI TTS ${res.statusCode}: ${body}`)));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jobs = [];
  mockTests.forEach((test) => {
    const content = mockContent[test.id];
    if (!content) return;
    content.sections.forEach((section) => {
      if (section.type === 'listening' && section.passage && section.audio_url) {
        const filename = path.basename(section.audio_url);
        jobs.push({ testId: test.id, sectionKey: section.key, filename, passage: section.passage });
      }
    });
  });

  console.log(`Found ${jobs.length} listening sections.`);
  const totalChars = jobs.reduce((sum, j) => sum + cleanForSpeech(j.passage).length, 0);
  console.log(`Total characters to synthesize (skipping already-generated files): ~${totalChars}`);
  console.log(`Estimated one-time cost at $15/1M chars (tts-1-hd): ~$${((totalChars / 1_000_000) * 15).toFixed(2)}\n`);

  let generated = 0;
  let skipped = 0;

  for (const job of jobs) {
    const outPath = path.join(OUTPUT_DIR, job.filename);
    if (!FORCE && fs.existsSync(outPath)) {
      console.log(`skip   ${job.filename} (already exists)`);
      skipped++;
      continue;
    }

    const spoken = cleanForSpeech(job.passage);
    try {
      process.stdout.write(`build  ${job.filename} ... `);
      const audio = await synthesizeSpeech(spoken);
      fs.writeFileSync(outPath, audio);
      console.log(`done (${(audio.length / 1024).toFixed(0)} KB)`);
      generated++;
      // Small pause between requests -- polite to the API, not required.
      await sleep(300);
    } catch (err) {
      console.log('FAILED');
      console.error(`  ${job.testId} / ${job.sectionKey}:`, err.message);
    }
  }

  console.log(`\nDone. Generated ${generated}, skipped ${skipped} (already present).`);
  console.log(`Audio files are in: ${OUTPUT_DIR}`);
  console.log('They are served automatically at /audio/<filename>.mp3 by the existing Express static middleware.');
}

main();
