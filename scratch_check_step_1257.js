const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 1257) {
      console.log('Step 1257 type:', data.type);
      console.log('Step 1257 tool_calls:', JSON.stringify(data.tool_calls, null, 2));
    }
    if (data.step_index === 1258) {
      console.log('Step 1258 type:', data.type);
      console.log('Step 1258 content lines range:', data.content.split('\n')[2]);
    }
  } catch(e) {}
}
