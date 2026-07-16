const scenarios = [
  {
    fixture: 'certain-mine',
    easy: 'random legal reveal',
    normal: 'flag certain mine',
    hard: 'flag certain mine',
  },
  {
    fixture: 'certain-safe',
    easy: 'random legal reveal',
    normal: 'reveal certain safe',
    hard: 'reveal certain safe',
  },
  {
    fixture: 'public-risk',
    easy: 'seeded random',
    normal: 'seeded random',
    hard: 'lowest public risk',
  },
  {
    fixture: 'style-risk',
    conservative: 'lowest public risk',
    greedy: 'highest risk at or below 0.75',
  },
];

for (const scenario of scenarios) {
  console.log(`${scenario.fixture}: ${JSON.stringify(scenario)}`);
}
