import {
  assert,
  assertEquals,
  assertThrows,
  restoreAll,
  spyOn,
} from '../deps.ts';
import { defineCommand, komando } from '../mod.ts';

const { test } = Deno;
const name = import.meta.url;

test('version -V flag', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'flags_test',
    version: 'v1.0.0',
  }, ['-V']);
  assert(spy.called);
  assertEquals(spy.callCount, 1);
  assertEquals(spy.calls[0][0], 'flags_test@v1.0.0');
  restoreAll();
});

test('version --version flag', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'flags_test',
    version: 'v1.0.0',
  }, ['--version']);
  assert(spy.called);
  assertEquals(spy.callCount, 1);
  assertEquals(spy.calls[0][0], 'flags_test@v1.0.0');
  restoreAll();
});

test('version custom log', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'flags_test',
    version: 'v1.0.0',
    showVersion(name, version) {
      console.log(`${name} ${version} Deno`);
    },
  }, ['--version']);
  assert(spy.called);
  assertEquals(spy.callCount, 1);
  assertEquals(spy.calls[0][0], 'flags_test v1.0.0 Deno');
  restoreAll();
});

test('version unknow flag', () => {
  assertThrows(
    () => {
      komando({
        name,
        run() {},
      }, ['-V']);
    },
    Error,
    'Unknown flags found. See the above table.',
  );
});

test('no help in flags', () => {
  komando({
    name,
    run(_, flags) {
      assertEquals(flags, {});
    },
  }, []);
});

test('root long flags', () => {
  komando({
    name,
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
    name,
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

test('sub command long flags', () => {
  komando({
    name,
    commands: [
      defineCommand({
        name: 'test',
        flags: {
          flagA: {},
          flagB: {},
        },
        run(_, flags) {
          assertEquals(flags.flagA, 'abc');
          assertEquals(flags.flagB, 123);
        },
      }),
    ],
    run() {
      assert(false, 'sub command run should be called, not this run');
    },
  }, ['test', '--flagA', 'abc', '--flagB', '123']);
});

test('sub command short flags', () => {
  komando({
    name,
    commands: [
      defineCommand({
        name: 'test',
        flags: {
          flagA: { short: 'A' },
          flagB: { short: 'B' },
        },
        run(_, flags) {
          assertEquals(flags.flagA, 'abc');
          assertEquals(flags.flagB, 123);
        },
      }),
    ],
    run() {
      assert(false, 'sub command run should be called, not this run');
    },
  }, ['test', '-A', 'abc', '-B', '123']);
});

test('sub sub command after flags', () => {
  komando({
    name,
    commands: [
      defineCommand({
        name: 'sub1',
        flags: {
          flagA: {},
        },
        commands: [
          defineCommand({
            name: 'sub2',
            run() {
              assert(
                false,
                'parent command run should be called, not this run',
              );
            },
          }),
        ],
        run(_, flags) {
          assertEquals(flags.flagA, 'sub2');
        },
      }),
    ],
    run() {
      assert(false, 'sub command run should be called, not this run');
    },
  }, ['sub1', '--flagA', 'sub2']);
});

test('unknown flags found', () => {
  assertThrows(
    () => {
      komando({
        name,
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
    name,
    flags: { camelCase: {} },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['--camel-case']);
});

test('kebab case short flags', () => {
  komando({
    name,
    flags: { camelCase: { short: 'C' } },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['-C']);
});

test('duplicate flags', () => {
  assertThrows(
    () => {
      komando({
        name,
        flags: { flagA: { deepPass: true } },
        commands: [
          defineCommand({
            name: 'duplicate',
            flags: { flagA: {} },
          }),
        ],
      }, ['duplicate']);
    },
    Error,
    'Found duplicate flags when merging inherited and child flags:',
  );
});

test('inherited flags', () => {
  komando({
    name,
    flags: { parent: { deepPass: true } },
    commands: [
      defineCommand({
        name: 'child',
        flags: { child: {} },
        run(_, flags) {
          assertEquals(flags.parent, true);
        },
      }),
    ],
    run() {
      assert(false, 'sub command run should be called, not this run');
    },
  }, ['child', '--parent']);
});
