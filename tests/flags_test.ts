import { assert, assertEquals, restoreAll, spyOn } from '../deps_test.ts';
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

test('root long flags', () => {
  komando({
    name,
    flags: {
      flagA: { typeFn: String },
      flagB: { typeFn: Number },
      flagC: { typeFn: Number },
    },
    run(_, flags) {
      assertEquals(flags.flagA, 'abc');
      assertEquals(flags.flagB, 123);
      assertEquals(flags.flagC, undefined);
    },
  }, ['--flagA', 'abc', '--flagB', '123']);
});

test('root short flags', () => {
  komando({
    name,
    flags: {
      flagA: { typeFn: String, short: 'A' },
      flagB: { typeFn: Number, short: 'B' },
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
          flagA: { typeFn: String },
          flagB: { typeFn: Number },
        },
        run(_, flags) {
          assertEquals(flags.flagA, 'abc');
          assertEquals(flags.flagB, 123);
        },
      }),
    ],
  }, ['test', '--flagA', 'abc', '--flagB', '123']);
});

test('sub command short flags', () => {
  komando({
    name,
    commands: [
      defineCommand({
        name: 'test',
        flags: {
          flagA: { typeFn: String, short: 'A' },
          flagB: { typeFn: Number, short: 'B' },
        },
        run(_, flags) {
          assertEquals(flags.flagA, 'abc');
          assertEquals(flags.flagB, 123);
        },
      }),
    ],
  }, ['test', '-A', 'abc', '-B', '123']);
});

test('sub sub command after flags', () => {
  komando({
    name,
    commands: [
      defineCommand({
        name: 'sub1',
        flags: {
          flagA: { typeFn: String },
        },
        commands: [
          defineCommand({
            name: 'sub2',
          }),
        ],
        run(_, flags) {
          assertEquals(flags.flagA, 'sub2');
        },
      }),
    ],
  }, ['sub1', '--flagA', 'sub2']);
});

test('kebab case long flags', () => {
  komando({
    name,
    flags: { camelCase: { typeFn: Boolean } },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['--camel-case']);
});

test('kebab case short flags', () => {
  komando({
    name,
    flags: { camelCase: { typeFn: Boolean, short: 'C' } },
    run(_, flags) {
      assert(flags.camelCase);
    },
  }, ['-C']);
});

test('flags multiple args undefined', () => {
  komando({
    name,
    flags: { zeroOrOne: { typeFn: [String] } },
    run(_, flags) {
      assertEquals(flags.zeroOrOne, undefined);
    },
  }, []);
});

test('flags multiple args', () => {
  komando({
    name,
    flags: { zeroOrOne: { typeFn: [Number] } },
    run(_, flags) {
      assertEquals(flags.zeroOrOne, [1, 2]);
    },
  }, ['--zero-or-one', '1,2']);
});

test('no kebab case + no short flag', () => {
  komando({
    name,
    flags: { open: { typeFn: Boolean } },
    run(_, flags) {
      assert(flags.open);
    },
  }, ['--open']);
});
