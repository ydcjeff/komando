import { assert, assertEquals, assertThrows, spyOn, restoreAll } from '../deps.ts';
import { defineCommand, komando } from '../mod.ts';

const { test } = Deno;
const NAME = 'test';
const VERSION = 'v0.0.0';

test('version -V flag', () => {
  const spy = spyOn(console, 'log')
  komando({
    name: 'flags_test',
    version: 'v1.0.0'
  }, ['-V'])
  assert(spy.called)
  assertEquals(spy.callCount, 1)
  assertEquals(spy.calls[0][0], 'flags_test@v1.0.0')
  restoreAll()
})

test('version --version flag', () => {
  const spy = spyOn(console, 'log')
  komando({
    name: 'flags_test',
    version: 'v1.0.0'
  }, ['--version'])
  assert(spy.called)
  assertEquals(spy.callCount, 1)
  assertEquals(spy.calls[0][0], 'flags_test@v1.0.0')
  restoreAll()
})

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
      flagA: {},
      flagB: {},
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
      flagA: { short: 'A' },
      flagB: { short: 'B' },
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
      defineCommand({
        name: 'test',
        flags: {
          flagA: {},
          flagB: {},
        },
      }),
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
      defineCommand({
        name: 'test',
        flags: {
          flagA: { short: 'A' },
          flagB: { short: 'B' },
        },
      }),
    ],
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 124);
    },
  }, ['test', '-A', 'abc', '-B', '123']);
});

test('unknown flags found', () => {
  assertThrows(
    () => {
      komando({
        name: 'unknown',
        flags: { known: {} },
        run() {},
      }, ['--unknown']);
    },
    Error,
    'Unknown flags found. See the above table.',
  );
});

test('kebab case long flags', () => {
  komando({
    name: import.meta.url,
    flags: { camelCase: {} },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['--camel-case']);
});

test('kebab case short flags', () => {
  komando({
    name: import.meta.url,
    flags: { camelCase: { short: 'C' } },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['-C']);
});
