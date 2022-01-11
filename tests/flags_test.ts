import { assertEquals } from 'https://deno.land/std@0.120.0/testing/asserts.ts';
import { komando } from '../mod.ts';

const { test } = Deno;
const NAME = 'test';
const VERSION = 'v0.0.0';

test('no help in flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    run(_, flags) {
      assertEquals(flags, {});
    },
  }, []);
});

test('root long flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    flags: {
      flagA: {
        help: 'flagA help',
      },
      flagB: {
        help: 'flagB help',
      },
    },
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 123);
    },
  }, ['--flagA', 'abc', '--flagB', '123']);
});

test('root short flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    flags: {
      flagA: {
        alias: 'A',
        help: 'flagA help',
      },
      flagB: {
        alias: 'B',
        help: 'flagB help',
      },
    },
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 123);
    },
  }, ['-A', 'abc', '-B', '123']);
});

test('command long flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      {
        name: 'test',
        flags: {
          flagA: {
            help: 'flagA help',
          },
          flagB: {
            help: 'flagB help',
          },
        },
      },
    ],
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 123);
    },
  }, ['test', '--flagA', 'abc', '--flagB', '123']);
});

test('command short flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      {
        name: 'test',
        flags: {
          flagA: {
            alias: 'A',
            help: 'flagA help',
          },
          flagB: {
            alias: 'B',
            help: 'flagB help',
          },
        },
      },
    ],
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 124);
    },
  }, ['test', '-A', 'abc', '-B', '123']);
});
