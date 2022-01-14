import { assert, assertThrows } from '../deps.ts';
import { defineCommand, komando } from '../mod.ts';

const { test } = Deno;
const name = import.meta.url;

test('root command', async (tc) => {
  await tc.step('default', () => {
    komando({
      name,
      run() {
        assert(true);
      },
    }, []);
  });

  await tc.step('no alias', () => {
    assertThrows(
      () => {
        komando({
          name,
          aliases: [],
        });
      },
      Error,
      'root command should not have aliases',
    );
  });
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
          aliases: ['d'],
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
          aliases: ['s1'],
          commands: [
            defineCommand({
              name: 'sub2',
              aliases: ['s2'],
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
