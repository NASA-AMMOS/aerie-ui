/* eslint-disable no-undef */

import { SeqLanguage } from '../dist/index.js';
import { fileTests } from '@lezer/generator/dist/test';
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const caseDir = path.dirname(fileURLToPath(import.meta.url));

for (const file of readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue;

  const name = /^[^.]*/.exec(file)[0];
  describe(name, () => {
    for (const { name, run } of fileTests(readFileSync(path.join(caseDir, file), 'utf8'), file)) {
      it(name, () => run(SeqLanguage.parser));
    }
  });
}
