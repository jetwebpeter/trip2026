const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 827) {
      const tc = data.tool_calls[0];
      console.log('typeof TargetContent:', typeof tc.args.TargetContent);
      console.log('val startsWith quote:', tc.args.TargetContent.startsWith('"'));
      console.log('val endsWith quote:', tc.args.TargetContent.endsWith('"'));
      console.log('actual value length:', tc.args.TargetContent.length);
      console.log('first 40 chars:', JSON.stringify(tc.args.TargetContent.slice(0, 40)));
    }
  } catch(e) {}
}
