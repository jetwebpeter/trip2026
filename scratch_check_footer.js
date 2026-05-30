const fs = require('fs');
const basePath = '/Users/jetwebpeter/claude/b2b2c-tour/frontend/src/components/HotelSearch.tsx';
const content = fs.readFileSync(basePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('前往預訂')) {
    console.log(`Found '前往預訂' at line ${i + 1}:`);
    for (let j = i - 2; j <= i + 10; j++) {
      if (lines[j]) {
        console.log(`${j + 1}: ${JSON.stringify(lines[j])}`);
      }
    }
  }
}
