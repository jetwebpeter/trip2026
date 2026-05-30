const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const lineOccurrences = {};
let lastViewedStep = null;

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
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls && data.step_index < 1133) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file' && parseArg(tc.args.AbsolutePath)?.includes('HotelSearch.tsx')) {
          lastViewedStep = data.step_index;
        }
      }
    }
    if (data.type === 'VIEW_FILE' && lastViewedStep !== null && data.step_index === lastViewedStep + 1) {
      lastViewedStep = null;
      const fileLines = data.content.split('\n');
      for (const fl of fileLines) {
        const match = fl.match(/^(\d+):\s(.*)$/);
        if (match) {
          const lineNum = parseInt(match[1]);
          const lineContent = match[2];
          if (lineNum >= 1120) {
            if (!lineOccurrences[lineNum]) lineOccurrences[lineNum] = [];
            lineOccurrences[lineNum].push({ step: data.step_index - 1, content: lineContent });
          }
        }
      }
    }
  } catch(e) {}
}

console.log(JSON.stringify(lineOccurrences, null, 2));
