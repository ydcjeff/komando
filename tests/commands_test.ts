import { assert } from 'https://deno.land/std@0.120.0/testing/asserts.ts';
import { defineCommand, komando } from '../mod.ts';

const { test } = Deno;
const NAME = 'test';
const VERSION = 'v0.0.0';

test('root command', () => {
  komando({
    name: NAME,
    version: VERSION,
    run() {
      assert(true);
    },
  }, []);
});

test('dev command', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      defineCommand({
        name: 'dev',
        run() {
          assert(true);
        },
      }),
    ],
  }, ['dev']);
});

test('dev command alias', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      defineCommand({
        name: 'dev',
        aliases: ['d'],
        run() {
          assert(true);
        },
      }),
    ],
  }, ['d']);
});
