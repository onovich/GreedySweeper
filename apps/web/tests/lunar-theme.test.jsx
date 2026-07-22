import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { LunarButton, LunarPanel, StatusText } from '../src/ui/lunar/primitives';
import fontManifest from '../src/ui/theme/fonts/manifest.json';

const sourcePath = (...parts) => resolve(process.cwd(), 'apps', 'web', 'src', 'ui', ...parts);
const tokenSource = readFileSync(sourcePath('theme', 'tokens.css'), 'utf8');
const primitiveSource = readFileSync(sourcePath('lunar', 'primitives.css'), 'utf8');

describe('Lunar Console tokens and primitives', () => {
  afterEach(cleanup);

  it('defines the approved palette only in the token source', () => {
    for (const color of [
      '#071416',
      '#d6d4c3',
      '#102e2d',
      '#173f3c',
      '#3182e8',
      '#d45248',
      '#f0a62e',
      '#e9e7d8',
      '#79918c',
    ]) {
      expect(tokenSource).toContain(color);
    }
    expect(tokenSource).toContain('--gs-motion-bank: 800ms');
    expect(tokenSource).toContain('--gs-cell-touch: 44px');
    expect(primitiveSource).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('renders semantic primitives without inline styles', () => {
    const { container } = render(
      <LunarPanel aria-label="终端面板">
        <StatusText tone="reward">奖励待入账</StatusText>
        <LunarButton variant="reward">收手</LunarButton>
      </LunarPanel>,
    );
    expect(screen.getByRole('region', { name: '终端面板' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '收手' }).className).toContain('gs-button--reward');
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('ships only local font assets with recorded hashes and licenses', () => {
    for (const asset of fontManifest.assets) {
      const bytes = readFileSync(sourcePath('theme', 'fonts', asset.file));
      expect(createHash('sha256').update(bytes).digest('hex').toUpperCase()).toBe(asset.sha256);
      expect(tokenSource).toContain(asset.file);
    }
    expect(readFileSync(sourcePath('theme', 'fonts', 'OFL-Noto-Sans-SC.txt'), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE',
    );
    expect(readFileSync(sourcePath('theme', 'fonts', 'OFL-IBM-Plex-Mono.txt'), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE',
    );
  });

  it('declares every shipped Lunar Console CJK glyph in the UI subset', () => {
    const glyphs = readFileSync(sourcePath('theme', 'fonts', 'glyphs.txt'), 'utf8');
    const componentText = readdirSync(sourcePath('lunar'))
      .filter((file) => file.endsWith('.jsx'))
      .map((file) => readFileSync(sourcePath('lunar', file), 'utf8'))
      .join('');
    const missing = [...new Set(componentText.match(/[\u3400-\u9fff]/gu) ?? [])].filter(
      (character) => !glyphs.includes(character),
    );
    expect(missing).toEqual([]);
  });
});
