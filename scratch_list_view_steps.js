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
    
    // 1. If it's a PLANNER_RESPONSE requesting to view HotelSearch.tsx
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file' && parseArg(tc.args.AbsolutePath)?.includes('HotelSearch.tsx')) {
          lastViewedStep = data.step_index;
        }
      }
    }
    
    // 2. If it's a VIEW_FILE response to the previous step's request
    if (data.type === 'VIEW_FILE' && lastViewedStep !== null && data.step_index === lastViewedStep + 1) {
      lastViewedStep = null; // consume
      
      const fileLines = data.content.split('\n');
      for (const fl of fileLines) {
        const match = fl.match(/^(\d+):\s(.*)$/);
        if (match) {
          const lineNum = parseInt(match[1]);
          const lineContent = match[2];
          if (!lineOccurrences[lineNum]) lineOccurrences[lineNum] = [];
          lineOccurrences[lineNum].push(lineContent);
        } else {
          const matchEmpty = fl.match(/^(\d+):$/);
          if (matchEmpty) {
            const lineNum = parseInt(matchEmpty[1]);
            if (!lineOccurrences[lineNum]) lineOccurrences[lineNum] = [];
            lineOccurrences[lineNum].push('');
          }
        }
      }
    }
  } catch(e) {}
}

const keys = Object.keys(lineOccurrences).map(Number).sort((a, b) => a - b);
console.log('Filtered unique lines captured:', keys.length);
console.log('Filtered captured range start:', keys[0], 'end:', keys[keys.length - 1]);

// Let's check gaps
let last = 0;
let gaps = [];
for (const k of keys) {
  if (k > last + 1) {
    gaps.push({ start: last + 1, end: k - 1 });
  }
  last = k;
}
console.log('Gaps:', JSON.stringify(gaps));

// Let's check conflicts now
let conflicts = [];
for (const k of keys) {
  const uniqContents = [...new Set(lineOccurrences[k])];
  if (uniqContents.length > 1) {
    conflicts.push({ line: k, count: uniqContents.length, contents: uniqContents });
  }
}
console.log('Conflicts count:', conflicts.length);
if (conflicts.length > 0) {
  console.log('Sample conflict (first 3):', JSON.stringify(conflicts.slice(0, 3), null, 2));
}
