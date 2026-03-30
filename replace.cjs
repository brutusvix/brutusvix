const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/bg-\[#141414\]/g, 'bg-zinc-900/50 backdrop-blur-sm');
  content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-zinc-800/50');
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-zinc-950');
  content = content.replace(/border-zinc-800\/60/g, 'border-zinc-800/50');
  fs.writeFileSync(filePath, content);
});
