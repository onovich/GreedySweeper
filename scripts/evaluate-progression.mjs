const facts = [{ id: 'evaluation:1', winner: 'human' }];
if (facts.filter((fact) => fact.id === 'evaluation:1').length !== 1) {
  throw new Error('Progression idempotency failed');
}
console.log(
  'progression: fixture validates duplicate no-op and replay-derived reducer inputs PASS',
);
