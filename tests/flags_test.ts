import { assertStrictEquals } from "https://deno.land/std@0.120.0/testing/asserts.ts";
import { komando } from "../mod.ts";

const { test } = Deno
const NAME = 'test'
const VERSION = 'v0.0.0'

test('root flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    flags: {
      flagA: {
        help: 'flagA help'
      },
      flagB: {
        help: 'flagB help'
      }
    },
    run(flags) {
      assertStrictEquals(flags.flagA, 'abc')
      assertStrictEquals(flags.flagB, 123)
    }
  }, ['--flagA', 'abc', '--flagB', '123'])
})

test('command flags', () => {
  komando({
    name: NAME,
    version: VERSION,
    commands: [
      {
        name: 'test',
        flags: {
          flagA: {
            help: 'flagA help'
          },
          flagB: {
            help: 'flagB help'
          }
        },
      }
    ],
    run(flags) {
      assertStrictEquals(flags.flagA, 'abc')
      assertStrictEquals(flags.flagB, 123)
    }
  }, ['test', '--flagA', 'abc', '--flagB', '123'])
})
