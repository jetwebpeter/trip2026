const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

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
      const stepIdx = lastViewedStep;
      lastViewedStep = null;
      
      const fileLines = data.content.split('\n');
      let containsTarget = false;
      for (const fl of fileLines) {
        const match = fl.match(/^(\d+):\s(.*)$/);
        if (match) {
          const lineNum = parseInt(match[1]);
          if (lineNum >= 360 && lineNum <= 400) {
            containsTarget = true;
          }
        }
      }
      if (containsTarget) {
        console.log(`\n--- View from Step ${stepIdx} ---`);
        for (const fl of fileLines) {
          const match = fl.match(/^(\d+):\s(.*)$/);
          if (match) {
            const lineNum = parseInt(match[1]);
            if (lineNum >= 360 && lineNum <= 400) {
              console.log(`${lineNum}: ${match[2]}`);
            }
          }
        }
      }
    }
  } catch(e) {}
}
