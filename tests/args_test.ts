import { assertEquals, assertThrows } from '../deps.ts';
import { komando } from '../mod.ts';

const { test } = Deno;
const NAME = 'test';
const VERSION = 'v0.0.0';

test('? nargs', () => {
  komando({
    name: NAME,
    version: VERSION,
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

test('? nargs - empty argv', () => {
  komando({
    name: NAME,
    version: VERSION,
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
});

test('* nargs', () => {
  komando({
    name: NAME,
    version: VERSION,
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

test('* nargs - empty argv', () => {
  komando({
    name: NAME,
    version: VERSION,
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
});

test('+ nargs', () => {
  komando({
    name: NAME,
    version: VERSION,
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

test('+ nargs expected at least one argument', () => {
  assertThrows(
    () => {
      komando({
        name: NAME,
        version: VERSION,
        args: {
          argA: {
            nargs: '+',
          },
          argB: {
            nargs: '+',
          },
        },
      }, []);
    },
    Error,
    'Argument argA expected at least one argument',
  );
});

test('1 nargs', () => {
  komando({
    name: NAME,
    version: VERSION,
    args: {
      argA: {
        nargs: 1,
      },
      argB: {
        nargs: 2,
      },
    },
    run(args) {
      assertEquals(args.argA, 'abc');
      assertEquals(args.argB, ['def', 'ghi']);
    },
  }, ['abc', 'def', 'ghi', 'klm', 'nop']);
});

test('1 nargs expected 1 arguments', () => {
  assertThrows(
    () => {
      komando({
        name: NAME,
        version: VERSION,
        args: {
          argA: {
            nargs: '?',
          },
          argB: {
            nargs: 1,
          },
        },
      }, []);
    },
    Error,
    'Argument argB expected 1 argument(s)',
  );
});

test('2 nargs', () => {
  komando({
    name: NAME,
    version: VERSION,
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

test('2 nargs expected 2 arguments', () => {
  assertThrows(
    () => {
      komando({
        name: NAME,
        version: VERSION,
        args: {
          argA: {
            nargs: '?',
          },
          argB: {
            nargs: 2,
          },
        },
      }, []);
    },
    Error,
    'Argument argB expected 2 argument(s)',
  );
});
