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

const ranges = [
  { start: 551, end: 569 },
  { start: 626, end: 629 },
  { start: 741, end: 749 },
  { start: 1056, end: 1120 }
];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file' && parseArg(tc.args.AbsolutePath)?.includes('HotelSearch.tsx')) {
          const start = parseInt(tc.args.StartLine || 1);
          const end = parseInt(tc.args.EndLine || 10000);
          
          for (const r of ranges) {
            if (start <= r.start && end >= r.end) {
              console.log(`Step ${data.step_index} covers ${r.start}-${r.end} (view range: ${start}-${end})`);
            }
          }
        }
      }
    }
  } catch(e) {}
}
