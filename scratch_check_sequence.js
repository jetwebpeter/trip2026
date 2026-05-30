const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let found = false;
let linesPrinted = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 815) {
      found = true;
    }
    if (found) {
      console.log(`--- Step ${data.step_index} ---`);
      console.log(`source: ${data.source}`);
      console.log(`type: ${data.type}`);
      if (data.tool_calls) console.log(`tool_calls:`, JSON.stringify(data.tool_calls, null, 2));
      if (data.content) console.log(`content starts with:`, JSON.stringify(data.content.slice(0, 100)));
      linesPrinted++;
      if (linesPrinted > 3) break;
    }
  } catch(e) {}
}
