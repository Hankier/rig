import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('digest placeholder owner retention', () => {
  it('retains rows with placeholder owners', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(runsDir, '2026-03-01.jsonl'),
      '{"at":"2026-03-01T10:00:00+01:00","job":"retained/job","status":"ok","owner":"—"}\n'
    );
    const night = readNight(runsDir, '2026-03-01');
    expect(night?.rows.length).toBe(1);
    expect(night?.rows[0].job).toBe('retained/job');
  });
});
