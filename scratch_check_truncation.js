const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const parseArg = (val) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    try {
      return JSON.parse(val);
    } catch(e) {
      return val;
    }
  }
  return val;
};

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if ((tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') && parseArg(tc.args.TargetFile)?.includes('HotelSearch.tsx')) {
          let hasTruncation = false;
          if (tc.args.TargetContent && String(tc.args.TargetContent).includes('<truncated')) hasTruncation = true;
          if (tc.args.ReplacementContent && String(tc.args.ReplacementContent).includes('<truncated')) hasTruncation = true;
          if (tc.args.ReplacementChunks) {
            for (const chunk of tc.args.ReplacementChunks) {
              if (chunk.TargetContent && String(chunk.TargetContent).includes('<truncated')) hasTruncation = true;
              if (chunk.ReplacementContent && String(chunk.ReplacementContent).includes('<truncated')) hasTruncation = true;
            }
          }
          console.log(`Step ${data.step_index}: ${tc.name}, Has Truncation = ${hasTruncation}`);
        }
      }
    }
  } catch(e) {}
}
