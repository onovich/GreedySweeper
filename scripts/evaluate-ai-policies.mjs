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
  {
    fixture: 'greed-bank',
    certainSafe: 'continue before Bank',
    conservative: 'Bank at public risk >= 0.30',
    greedy: 'Bank only with pot >= 12 and public risk >= 0.50',
    easy: 'injected RNG gives a 25% Bank branch',
  },
];

for (const scenario of scenarios) {
  console.log(`${scenario.fixture}: ${JSON.stringify(scenario)}`);
}
