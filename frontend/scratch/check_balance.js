import fs from 'fs';

const content = fs.readFileSync('src/pages/SampleDetail.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let balance = 0;

lines.forEach((line, i) => {
  const opening = (line.match(/<div/g) || []).length;
  const closing = (line.match(/<\/div/g) || []).length;
  const selfClosing = (line.match(/<div[^>]*\/>/g) || []).length;
  
  balance += (opening - selfClosing);
  balance -= closing;
  
  if (opening > 0 || closing > 0) {
     console.log(`Line ${i + 1}: ${balance} (opened ${opening}, self ${selfClosing}, closed ${closing}) - ${line.trim().substring(0, 40)}`);
  }
  
  if (balance < 0) {
    console.log(`NEGATIVE BALANCE at line ${i + 1}`);
  }
});

console.log(`Final balance: ${balance}`);
