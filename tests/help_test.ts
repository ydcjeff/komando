import { assert, assertEquals, restoreAll, spyOn } from '../deps.ts';
import { komando } from '../mod.ts';
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
      {
        name: 'cmd',
        usage: '$ help_test cmd [flags]',
        commands: [],
        flags: {},
        args: {},
      },
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
