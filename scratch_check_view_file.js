const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let count = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    // Let's find any step that represents a view_file output or call
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file') {
          console.log(`Step ${data.step_index}: view_file of ${tc.args.AbsolutePath}`);
          count++;
          if (count > 20) break;
        }
      }
    }
  } catch(e) {}
}
