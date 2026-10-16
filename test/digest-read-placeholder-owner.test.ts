import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('digest readNight placeholder owner behavior', () => {
  it('does not filter out lines with placeholder owner', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(runsDir, '2026-05-01.jsonl'),
      '{"at":"2026-05-01T12:00:00+01:00","job":"job/with-placeholder","status":"ok","owner":"—"}\n'
    );
    const night = readNight(runsDir, '2026-05-01');
    expect(night).not.toBeNull();
    expect(night?.rows.length).toBe(1);
    expect(night?.rows[0].job).toBe('job/with-placeholder');
  });
});
