const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const basePath = '/Users/jetwebpeter/claude/b2b2c-tour/frontend/src/components/HotelSearch.tsx';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const reconstructedLines = new Array(1200).fill(null);

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

let lastViewedStep = null;

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    
    // 1. If it's a PLANNER_RESPONSE requesting to view HotelSearch.tsx before step 1133
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls && data.step_index < 1133) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file' && parseArg(tc.args.AbsolutePath)?.includes('HotelSearch.tsx')) {
          lastViewedStep = data.step_index;
        }
      }
    }
    
    // 2. If it's a VIEW_FILE response to that request
    if (data.type === 'VIEW_FILE' && lastViewedStep !== null && data.step_index === lastViewedStep + 1) {
      lastViewedStep = null; // consume
      
      const fileLines = data.content.split('\n');
      for (const fl of fileLines) {
        const match = fl.match(/^(\d+):\s(.*)$/);
        if (match) {
          const lineNum = parseInt(match[1]);
          const lineContent = match[2];
          reconstructedLines[lineNum] = lineContent;
        } else {
          const matchEmpty = fl.match(/^(\d+):$/);
          if (matchEmpty) {
            const lineNum = parseInt(matchEmpty[1]);
            reconstructedLines[lineNum] = '';
          }
        }
      }
    }
  } catch(e) {}
}

// Find the maximum line number that has been filled
let maxLine = 0;
for (let i = 1; i < reconstructedLines.length; i++) {
  if (reconstructedLines[i] !== null) {
    maxLine = i;
  }
}

console.log('Max line index filled:', maxLine);

// Find gaps
let gaps = [];
for (let i = 1; i <= maxLine; i++) {
  if (reconstructedLines[i] === null) {
    gaps.push(i);
  }
}
console.log('Total gaps:', gaps.length);
if (gaps.length > 0) {
  console.log('Gaps:', JSON.stringify(gaps));
} else {
  console.log('No gaps! Writing file...');
  const finalContent = reconstructedLines.slice(1, maxLine + 1).join('\n');
  fs.writeFileSync(basePath, finalContent, 'utf8');
  console.log('File successfully reconstructed and written!');
}
