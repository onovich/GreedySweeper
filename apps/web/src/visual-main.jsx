import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixtureLunarConsole } from './ui/lunar/FixtureLunarConsole';
import { getGameUiFixture } from './ui/fixtures/game-ui-fixtures';
import './visual.css';

const fixtureId =
  new URLSearchParams(window.location.search).get('fixture') ?? 'local-greed-player-x3-pot18';
let fixture;
try {
  fixture = getGameUiFixture(fixtureId);
} catch (error) {
  document.body.textContent = error.message;
  throw error;
}

createRoot(document.getElementById('visual-root')).render(
  <StrictMode>
    <div data-visual-ready="true" data-fixture-id={fixtureId}>
      <FixtureLunarConsole viewModel={fixture} />
    </div>
  </StrictMode>,
);
