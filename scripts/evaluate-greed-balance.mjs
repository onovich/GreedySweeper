const points = [1, 2, 3, 4, 5];
const cap = 3;
let pot = 0;

for (let index = 0; index < points.length; index += 1) {
  const streak = index + 1;
  const multiplier = Math.min(Math.max(streak - 1, 0), cap);
  const added = points[index] * multiplier;
  pot += added;
  console.log(`safe ${streak}: base=${points[index]} multiplier=${multiplier} pot=${pot}`);
}

if (pot !== 35) {
  throw new Error(`Unexpected deterministic pot total: ${pot}`);
}

console.log('bank: legal after first safe reveal; zero-pot Bank ends a turn without score gain');
console.log(
  'loss: wrong flag and explosion clear the unbanked pot; multiplier remains capped at 3',
);
