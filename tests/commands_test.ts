import { assert } from 'https://deno.land/std@0.120.0/testing/asserts.ts';
import { komando } from '../mod.ts';

const { test } = Deno;
const NAME = 'test';
const VERSION = 'v0.0.0';

test('root command', () => {
  komando({
    name: NAME,
    version: VERSION,
    run() {
      assert(true)
    },
  }, []);
});

test('dev command', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      {
        name: 'dev',
        run() {
          assert(true)
        }
      },
    ],
  }, ['dev']);
});
