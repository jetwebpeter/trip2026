const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'run_command' && tc.args.CommandLine.includes('git')) {
          console.log(`Step ${data.step_index}: run_command: ${tc.args.CommandLine}`);
        }
      }
    }
  } catch(e) {}
}
