const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.content && data.content.includes('Tab 3')) {
      console.log(`Step ${data.step_index} contains 'Tab 3'`);
      const idx = data.content.indexOf('Tab 3');
      console.log(data.content.slice(Math.max(0, idx - 100), Math.min(data.content.length, idx + 200)));
    }
  } catch(e) {}
}
