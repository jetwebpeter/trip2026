const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if ([1086, 1088, 1090].includes(data.step_index)) {
      console.log(`\n--- Step ${data.step_index} ---`);
      console.log(data.content);
    }
  } catch(e) {}
}
