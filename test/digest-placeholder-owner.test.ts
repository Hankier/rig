import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('digest placeholder owner', () => {
  it('does not skip rows with placeholder owner', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(runsDir, '2026-01-04.jsonl'),
      '{"at":"2026-01-04T01:00:00+01:00","job":"some/job","status":"ok","owner":"—"}\n',
    );
    const night = readNight(runsDir, '2026-01-04');
    expect(night?.rows.length).toBe(1);
    expect(night?.rows[0].job).toBe('some/job');
  });
});
