import { assert, assertEquals, restoreAll, spyOn } from '../deps.ts';
import { defineCommand, komando } from '../mod.ts';
const { test } = Deno;

test('show default help', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'help_test',
  }, ['-h']);
  assert(spy.called);
  assertEquals(spy.callCount, 2);
  assertEquals(
    spy.calls.flat().join('\n'),
    `
  Usage
    $ help_test [flags]

  Flags
    -h, --help    Show this message`,
  );
  restoreAll();
});

test('show command help', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'help_test',
    commands: [
      defineCommand({
        name: 'cmd',
        usage: '$ help_test cmd [flags]',
      }),
    ],
  }, ['cmd', '--help']);
  assert(spy.called);
  assertEquals(spy.callCount, 2);
  assertEquals(
    spy.calls.flat().join('\n'),
    `
  Usage
    $ help_test cmd [flags]

  Flags
    -h, --help    Show this message`,
  );
  restoreAll();
});

test('show help + epilog', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'help_test',
    epilog: '\n  Env Variables\n    CI: true',
  }, ['-h']);
  assert(spy.called);
  assertEquals(spy.callCount, 3);
  assertEquals(
    spy.calls.flat().join('\n'),
    `
  Usage
    $ help_test [flags]

  Flags
    -h, --help    Show this message

  Env Variables
    CI: true`,
  );
  restoreAll();
});

test('show help + inherited', () => {
  const spy = spyOn(console, 'log');
  komando({
    name: 'help_test',
    flags: { parent: { deepPass: true } },
    commands: [
      defineCommand({
        name: 'child',
        flags: { child: {} },
      }),
    ],
  }, ['child', '-h']);
  assert(spy.called);
  assertEquals(spy.callCount, 3);
  assertEquals(
    spy.calls.flat().join('\n'),
    `
  Usage
    $ help_test [flags]

  Flags
        --child [child]
    -h, --help               Show this message

  Inherited Flags
        --parent [parent]`,
  );
  restoreAll();
});
