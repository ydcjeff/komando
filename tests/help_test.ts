import { assert, restoreAll, setupSnapshot, spyOn } from '../deps_test.ts';
import { defineCommand, groupBy, komando } from '../mod.ts';

const { test } = Deno;
const assertSnapshot = await setupSnapshot(import.meta.url);

const komandoOptions = {
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
      ]),
      flags: groupBy('SUBFLAGS', {
        subFlagA: { typeFn: String },
        subFlagB: { typeFn: String },
        subFlagc: { typeFn: String },
      }),
    }),
  ],
  flags: {
    parent: {
      typeFn: String,
      short: 'p',
      placeholder: 'dir',
    },
    flagA: { typeFn: String },
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
      nargs: '1',
      description: 'argD desc',
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
