const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.content && data.content.includes('cleanImageUrl')) {
      // Find where it's defined (e.g. const cleanImageUrl = ...)
      const idx = data.content.indexOf('cleanImageUrl');
      console.log(`Step ${data.step_index} contains 'cleanImageUrl' around:`);
      console.log(data.content.slice(Math.max(0, idx - 100), Math.min(data.content.length, idx + 300)));
    }
  } catch(e) {}
}
