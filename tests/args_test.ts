import { assertEquals, assertThrows } from '../deps_test.ts';
import { komando } from '../mod.ts';

const { test } = Deno;
const name = import.meta.url;

test('? nargs with', async (tc) => {
  await tc.step('0 argv', () => {
    komando({
      name,
      args: {
        argA: {
          nargs: '?',
        },
        argB: {
          nargs: '?',
        },
      },
      run(args) {
        assertEquals(args.argA, undefined);
        assertEquals(args.argB, undefined);
      },
    }, []);
  }),
    await tc.step('1 argv', () => {
      komando({
        name,
        args: {
          argA: {
            nargs: '?',
          },
          argB: {
            nargs: '?',
          },
        },
        run(args) {
          assertEquals(args.argA, 'abc');
          assertEquals(args.argB, undefined);
        },
      }, ['abc']);
    });

  await tc.step('3 argv', () => {
    komando({
      name,
      args: {
        argA: {
          nargs: '?',
        },
        argB: {
          nargs: '?',
        },
      },
      run(args) {
        assertEquals(args.argA, 'abc');
        assertEquals(args.argB, 'def');
      },
    }, ['abc', 'def', 'ghi']);
  });
});

test('* nargs with', async (tc) => {
  await tc.step('0 argv', () => {
    komando({
      name,
      args: {
        argA: {
          nargs: '*',
        },
        argB: {
          nargs: '*',
        },
      },
      run(args) {
        assertEquals(args.argA, []);
        assertEquals(args.argB, undefined);
      },
    }, []);
  }),
    await tc.step('1 argv', () => {
      komando({
        name,
        args: {
          argA: {
            nargs: '*',
          },
          argB: {
            nargs: '*',
          },
        },
        run(args) {
          assertEquals(args.argA, ['abc']);
          assertEquals(args.argB, undefined);
        },
      }, ['abc']);
    });

  await tc.step('2 argv', () => {
    komando({
      name,
      args: {
        argA: {
          nargs: '*',
        },
        argB: {
          nargs: '*',
        },
      },
      run(args) {
        assertEquals(args.argA, ['abc', 'def']);
        assertEquals(args.argB, undefined);
      },
    }, ['abc', 'def']);
  });
});

test('+ nargs with', async (tc) => {
  await tc.step('0 argv', () => {
    assertThrows(
      () => {
        komando({
          name,
          args: {
            argA: {
              nargs: '?',
            },
            argB: {
              nargs: '+',
            },
          },
          run() {},
        }, []);
      },
      Error,
      'Argument argB expected at least one argument',
    );
  }),
    await tc.step('1 argv', () => {
      komando({
        name,
        args: {
          argA: {
            nargs: '+',
          },
          argB: {
            nargs: '+',
          },
        },
        run(args) {
          assertEquals(args.argA, ['abc']);
          assertEquals(args.argB, undefined);
        },
      }, ['abc']);
    });

  await tc.step('2 argv', () => {
    komando({
      name,
      args: {
        argA: {
          nargs: '+',
        },
        argB: {
          nargs: '+',
        },
      },
      run(args) {
        assertEquals(args.argA, ['abc', 'def']);
        assertEquals(args.argB, undefined);
      },
    }, ['abc', 'def']);
  });
});

test('1 nargs with', async (tc) => {
  await tc.step('0 argv', () => {
    assertThrows(
      () => {
        komando({
          name,
          args: {
            argA: {
              nargs: '?',
            },
            argB: {
              nargs: 1,
            },
          },
          run() {},
        }, []);
      },
      Error,
      'Argument argB expected 1 argument(s)',
    );
  }),
    await tc.step('3 argv', () => {
      komando({
        name,
        args: {
          argA: {
            nargs: 1,
          },
          argB: {
            nargs: 1,
          },
        },
        run(args) {
          assertEquals(args.argA, 'abc');
          assertEquals(args.argB, 'def');
        },
      }, ['abc', 'def', 'ghi']);
    });
});

test('2 nargs with', async (tc) => {
  await tc.step('0 argv', () => {
    assertThrows(
      () => {
        komando({
          name,
          args: {
            argA: {
              nargs: '?',
            },
            argB: {
              nargs: 2,
            },
          },
          run() {},
        }, []);
      },
      Error,
      'Argument argB expected 2 argument(s)',
    );
  }),
    await tc.step('5 argv', () => {
      komando({
        name,
        args: {
          argA: {
            nargs: 2,
          },
          argB: {
            nargs: 2,
          },
        },
        run(args) {
          assertEquals(args.argA, ['abc', 'def']);
          assertEquals(args.argB, ['ghi', 'klm']);
        },
      }, ['abc', 'def', 'ghi', 'klm', 'nop']);
    });
});

test('? 1 2 3 * + nargs', () => {
  komando({
    name,
    args: {
      argA: { nargs: '?' },
      argB: { nargs: 1 },
      argC: { nargs: 2 },
      argD: { nargs: 3 },
      argE: { nargs: '*' },
      argF: { nargs: '+' },
    },
    run(args) {
      assertEquals(args.argA, 'abc');
      assertEquals(args.argB, 'def');
      assertEquals(args.argC, ['ghi', 'klm']);
      assertEquals(args.argD, ['nop', 'qrs', 'tuv']);
      assertEquals(args.argE, ['wxyz']);
      assertEquals(args.argF, undefined);
    },
  }, ['abc', 'def', 'ghi', 'klm', 'nop', 'qrs', 'tuv', 'wxyz']);
});
