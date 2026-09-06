const fs = require('fs');
const path = require('path');

const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/gu;
const counts = new Map();
const files = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const matches = text.match(re);
      if (matches) {
        files.set(full.split(path.sep).join('/'), matches.length);
        for (const ch of matches) counts.set(ch, (counts.get(ch) || 0) + 1);
      }
    }
  }
}

walk(process.argv[2] || '.');

console.log(`=== files (${files.size}) ===`);
[...files.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([f, n]) => console.log(`${String(n).padStart(3)}  ${f}`));

console.log(`\n=== distinct emoji (${counts.size}) ===`);
console.log(
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}=${n}`)
    .join('  '),
);
