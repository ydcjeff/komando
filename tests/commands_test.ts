import { assert, assertThrows } from '../deps.ts';
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

test('root command no aliases', () => {
  assertThrows(
    () => {
      komando({
        name: NAME,
        version: VERSION,
        aliases: [],
      });
    },
    Error,
    'root command should not have aliases',
  );
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
