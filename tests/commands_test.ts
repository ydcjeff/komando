import { defineCommand, komando } from '../mod.js';
import { assert, assertThrows } from '../deps_test.ts';

const { test } = Deno;
const name = import.meta.url;

test('root command', () => {
  komando({
    name,
    run() {
      assert(true);
    },
  }, []);
});

test('sub command', async (tc) => {
  await tc.step('default', () => {
    komando({
      name,
      commands: [
        defineCommand({
          name: 'dev',
          run() {
            assert(true);
          },
        }),
      ],
      run() {
        assert(false, 'sub command run should be called, not this run');
      },
    }, ['dev']);
  });

  await tc.step('alias', () => {
    komando({
      name,
      commands: [
        defineCommand({
          name: 'dev',
          alias: 'd',
          run() {
            assert(true);
          },
        }),
      ],
      run() {
        assert(false, 'sub command run should be called, not this run');
      },
    }, ['d']);
  });
});

test('sub sub command', async (tc) => {
  await tc.step('default', () => {
    komando({
      name,
      commands: [
        defineCommand({
          name: 'sub1',
          commands: [
            defineCommand({
              name: 'sub2',
              run() {
                assert(true);
              },
            }),
          ],
          run() {
            assert(false, 'sub sub command run should be called, not this run');
          },
        }),
      ],
      run() {
        assert(false, 'sub command run should be called, not this run');
      },
    }, ['sub1', 'sub2']);
  });

  await tc.step('alias', () => {
    komando({
      name,
      commands: [
        defineCommand({
          name: 'sub1',
          alias: 's1',
          commands: [
            defineCommand({
              name: 'sub2',
              alias: 's2',
              run() {
                assert(true);
              },
            }),
          ],
          run() {
            assert(false, 'sub sub command run should be called, not this run');
          },
        }),
      ],
      run() {
        assert(false, 'sub command run should be called, not this run');
      },
    }, ['s1', 's2']);
  });
});

test('duplicate commands', () => {
  assertThrows(
    () => {
      komando({
        name,
        commands: [
          defineCommand({ name: 'dupli' }),
          defineCommand({ name: 'dupli' }),
        ],
      });
    },
    Error,
    'Duplicate subcommand found in',
  );
});

test('duplicate commands alias', () => {
  assertThrows(
    () => {
      komando({
        name,
        commands: [
          defineCommand({ name: 'abc', alias: 'd' }),
          defineCommand({ name: 'def', alias: 'd' }),
        ],
      });
    },
    Error,
    'Duplicate alias found in',
  );
});
