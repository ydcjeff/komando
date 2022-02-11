import { defineCommand, groupBy, komando } from '../mod.js';
import { assert, restoreAll, setupSnapshot, spyOn } from '../deps_test.ts';

const { test } = Deno;
const assertSnapshot = await setupSnapshot(import.meta.url);

const komandoOptions = {
  name: 'root',
  version: 'v1.0.0',
  usage: 'Root command usage',
  description: 'Root command desc',
  example: `root sub1 --parent
    root s1 subsub1
    root deno.json -p deps`,
  epilog: '  EPILOG TEXT\n    This section is useful for more info.',
  commands: [
    defineCommand({
      name: 'sub1',
      description: 'sub1 cmd desc',
      alias: 's1',
      commands: groupBy('SUBCOMMANDS', [
        defineCommand({ name: 'subsub1' }),
        defineCommand({ name: 'subsub2' }),
        defineCommand({ name: 'subsub3' }),
      ]),
      flags: groupBy('SUBFLAGS', {
        subFlagA: { typeFn: String },
        subFlagB: { typeFn: String },
        subFlagc: { typeFn: [String] },
      }),
    }),
  ],
  flags: {
    parent: {
      typeFn: String,
      short: 'p',
      description: 'some dir',
      placeholder: 'dir',
      defaultV: 'dist',
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
    argv: ['-h'],
  },
  {
    name: 'minimal cmd help flags + args',
    komandoOptions: { name: 'mini', args: { argA: {} } },
    argv: ['-h'],
  },
  // https://github.com/ydcjeff/komando/issues/25
  {
    name: 'sub sub command help',
    komandoOptions: {
      name: 'doci',
      commands: [
        defineCommand({
          name: 'pipeline',
          commands: [
            defineCommand({
              name: 'build',
            }),
          ],
        }),
      ],
    },
    argv: ['pipeline', 'build', '-h'],
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
