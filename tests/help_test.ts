import { assert, restoreAll, setupSnapshot, spyOn } from '../deps.ts';
import {
  Command,
  defineCommand,
  Flags,
  groupBy,
  komando,
  UserCommand,
} from '../mod.ts';

const { test } = Deno;
const assertSnapshot = await setupSnapshot(import.meta.url);

const komandoOptions: UserCommand = {
  name: 'root',
  version: 'v1.0.0',
  usage: 'Root command usage',
  description: 'Root command desc',
  commands: [
    defineCommand({
      name: 'sub1',
      description: 'sub1 cmd desc',
      aliases: ['s1'],
      commands: groupBy('SUBCOMMANDS', [
        defineCommand({ name: 'subsub1' }),
        defineCommand({ name: 'subsub2' }),
        defineCommand({ name: 'subsub3' }),
      ]) as Command[],
      flags: groupBy('SUBFLAGS', {
        subFlagA: {},
        subFlagB: {},
        subFlagc: {},
      }) as Flags,
    }),
  ],
  flags: {
    parent: {
      short: 'p',
      deepPass: true,
      placeholder: 'dir',
    },
    flagA: {},
  },
  args: {
    argA: {
      nargs: '?',
      description: 'argA desc',
    },
    argB: {
      nargs: '*',
      description: 'argB desc',
    },
    argC: {
      nargs: '+',
      description: 'argC desc',
    },
    argD: {
      nargs: 1,
      description: 'argD desc',
    },
    argE: {
      nargs: 2,
      description: 'argE desc',
    },
  },
};

const testdata = [
  {
    name: 'root cmd help',
    komandoOptions,
    argv: ['-h'],
  },
  {
    name: 'sub one cmd help',
    komandoOptions,
    argv: ['sub1', '-h'],
  },
  {
    name: 'minimal cmd help only flags',
    komandoOptions: { name: 'mini' },
    argv: ['mini', '-h'],
  },
  {
    name: 'minimal cmd help flags + args',
    komandoOptions: { name: 'mini', args: { argA: {} } },
    argv: ['mini', '-h'],
  },
];

for (const td of testdata) {
  test(td.name, () => {
    const spy = spyOn(console, 'log');
    komando(td.komandoOptions, td.argv);
    assert(spy.called);
    assertSnapshot(spy.calls.flat().join('\n'), td.name);
    restoreAll();
  });
}
