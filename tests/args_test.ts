import {
  assertEquals,
  assertThrows,
} from 'https://deno.land/std@0.120.0/testing/asserts.ts';
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
        help: 'arg a help',
        nargs: '?',
      },
      argB: {
        help: 'arg b help',
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
        help: 'arg a help',
        nargs: '?',
      },
      argB: {
        help: 'arg b help',
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
        help: 'arg a help',
        nargs: '*',
      },
      argB: {
        help: 'arg b help',
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
        help: 'arg a help',
        nargs: '*',
      },
      argB: {
        help: 'arg b help',
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
        help: 'arg a help',
        nargs: '+',
      },
      argB: {
        help: 'arg b help',
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
            help: 'arg a help',
            nargs: '+',
          },
          argB: {
            help: 'arg b help',
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
        help: 'arg a help',
        nargs: 1,
      },
      argB: {
        help: 'arg b help',
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
            help: 'arg a help',
            nargs: '?',
          },
          argB: {
            help: 'arg b help',
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
        help: 'arg a help',
        nargs: 2,
      },
      argB: {
        help: 'arg b help',
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
            help: 'arg a help',
            nargs: '?',
          },
          argB: {
            help: 'arg b help',
            nargs: 2,
          },
        },
      }, []);
    },
    Error,
    'Argument argB expected 2 argument(s)',
  );
});
