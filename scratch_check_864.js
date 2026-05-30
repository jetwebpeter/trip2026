const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 864) {
      console.log('Step 864 tool call args:');
      console.log(JSON.stringify(data.tool_calls[0].args, null, 2));
    }
  } catch(e) {}
}
