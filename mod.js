/// <reference types="./mod.d.ts" />

import { parse } from './deps.ts';

/**
 * @typedef {import('./mod.d.ts').Command} Command
 * @typedef {import('./mod.d.ts').Flags} Flags
 * @typedef {import('./mod.d.ts').Args} Args
 */

/**
 * @template F, A
 * @param {import('./mod.d.ts').CommandOptions<F, A>} options
 * @param {string[]} argv
 */
export function komando(options, argv = Deno.args) {
  const resolved = defineCommand(options);
  if (!resolved.showVersion) {
    /** @param {string} name @param {string} version */
    resolved.showVersion = (name, version) => console.log(`${name}@${version}`);
  }
  komandoImpl(resolved, argv);
}

/**
 * @template F, A
 * @param {import('./mod.d.ts').CommandOptions<F, A>} options
 * @returns {Command}
 */
export function defineCommand(options) {
  const resolved = {
    commands: [],
    flags: {},
    args: {},
    ...options,
  };

  if (
    new Set(resolved.commands.map((v) => v.name)).size !==
      resolved.commands.length
  ) {
    throw new Error(
      `Duplicate subcommand found in: "${resolved.name}" command.`,
    );
  }

  const alias = resolved.commands.map((v) => v.alias).filter((v) => v);
  if (alias) {
    if (new Set(alias).size !== alias.length) {
      throw new Error(
        `Duplicate alias found in: "${resolved.name}" command.`,
      );
    }
  }

  groupBy('Commands', resolved.commands);
  groupBy('Flags', resolved.flags);

  for (const key in resolved.flags) {
    // @ts-expect-error flags is not empty
    const val = resolved.flags[key];

    const typeFn = Array.isArray(val.typeFn) ? val.typeFn[0] : val.typeFn;
    if (!val.placeholder && typeFn !== Boolean) val.placeholder = key;
    if (typeFn === Boolean) {
      val.placeholder = undefined;
    }
  }

  for (const val of Object.values(resolved.args)) {
    if (!val.nargs) val.nargs = '1';
  }

  // @ts-expect-error it is compatible tho
  return resolved;
}

/**
 * @template T
 * @param {string} name
 * @param {T} toGroup
 * @returns T
 */
export function groupBy(name, toGroup) {
  for (const val of Object.values(toGroup)) {
    if (!val.groupName) val.groupName = name;
  }
  return toGroup;
}

/**
 * @param {Command} currentCommand
 * @param {string[]} argv
 */
function komandoImpl(currentCommand, argv) {
  const { name: bin, version, showVersion } = currentCommand;
  let { name } = currentCommand;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    // @ts-expect-error showVersion exist
    showVersion(name, version);
    return;
  }

  argv = [...argv]; // Deno.args is read only, copy it

  if (argv.length) {
    // filter out the matched commands
    let hasSubCommands = false;
    do {
      // reset here
      hasSubCommands = false;
      // @ts-expect-error commands exist
      for (const cmd of currentCommand.commands) {
        const val = argv[0];
        if (cmd.name === val || val && cmd.alias === val) {
          currentCommand = cmd;
          name += ' ' + currentCommand.name;
          argv.shift();
          hasSubCommands = !!cmd.commands;
          break;
        }
      }
    } while (hasSubCommands);
  }

  if (argv.includes('-h') || argv.includes('--help')) {
    showHelp(bin, name, currentCommand, version);
    return;
  }

  if (!currentCommand.run) {
    showHelp(bin, name, currentCommand, version);
    Deno.exit(1);
  }

  /** @type {Record<string, unknown>} */
  const unknowns = {};
  const flags = currentCommand.flags;
  const args = currentCommand.args;
  const run = currentCommand.run;

  const { _: inputArgs, '--': inputDoubleDash, ...inputFlags } = parse(argv, {
    '--': true,
    alias: Object.fromEntries(
      // @ts-expect-error flags is not undefined
      Object.entries(flags).map(([k, v]) => {
        return [
          k,
          [camelCaseRE.test(k) ? toKebabCase(k) : '', v.short ?? ''].filter(
            (v) => v,
          ),
        ];
      }),
    ),
    // @ts-expect-error flags is not undefined
    boolean: Object.entries(flags).filter(([_, v]) => {
      const typeFn = Array.isArray(v.typeFn) ? v.typeFn[0] : v.typeFn;
      return typeFn === Boolean;
    }).map(([k, _]) => k),
    default: Object.fromEntries(
      // @ts-expect-error flags is not undefined
      Object.entries(flags).map(([k, v]) => [k, v.defaultV ?? undefined]),
    ),
    unknown(arg, _, v) {
      // only collect unknown flags
      if (arg.startsWith('-')) {
        unknowns[arg] = v;
        return false;
      }
    },
  });

  if (Object.keys(unknowns).length) {
    console.table(unknowns);
    error('Unknown flags found. See the above table.');
  }

  const parsedFlags = {};
  for (const iflag in inputFlags) {
    // @ts-expect-error flags is not undefined
    if (iflag in flags) {
      const val = inputFlags[iflag];
      // @ts-expect-error flags is not undefined
      const { typeFn } = flags[iflag];
      if (Array.isArray(typeFn)) {
        // @ts-expect-error any is not assignable to type never
        parsedFlags[iflag] = val ? val.split(',').map(typeFn[0]) : val;
      } else {
        // @ts-expect-error any is not assignable to type never
        parsedFlags[iflag] = val ? typeFn(val) : val;
      }
    }
  }

  /** @type {{'--': any, [key: string]: unknown}} */
  const parsedArgs = { '--': inputDoubleDash };
  for (const arg in args) {
    // @ts-expect-error args is not undefined
    const nargs = args[arg].nargs;

    if (nargs === '1' && inputArgs.length < +nargs) {
      throw new Error(`Argument "${arg}" expected 1 argument.`);
    }

    if (nargs === '?' || nargs === '1') {
      parsedArgs[arg] = inputArgs.shift();
    } else if (nargs === '*') {
      parsedArgs[arg] = [...inputArgs];
      break;
    } else if (nargs === '+') {
      if (inputArgs.length < 1) {
        throw new Error(`Argument "${arg}" expected at least one argument`);
      }
      parsedArgs[arg] = [...inputArgs];
      break;
    }
  }

  if (typeof run === 'function') run(parsedArgs, parsedFlags);
}

const camelCaseRE = /\B([A-Z])/g;
/** @param {string} str */
function toKebabCase(str) {
  return str.replace(camelCaseRE, '-$1').toLowerCase();
}

/**
 * @param {string} bin
 * @param {string} name
 * @param {Command} command
 * @param {string=} version
 */
function showHelp(bin, name, command, version) {
  /** @type {Record<string, string | string[]>} */
  const out = {};
  const { columns } = Deno.consoleSize();
  const { description, example, commands, usage, alias, epilog } = command;

  const flags = command.flags;
  const args = command.args;
  const isBin = bin === name;

  // @ts-expect-error flags is not undefined
  flags.help = {
    typeFn: Boolean,
    defaultV: false,
    short: 'h',
    description: 'Show this message',
    groupName: isBin ? 'Flags' : 'Inherited Flags',
  };

  if (version) {
    // @ts-expect-error flags is not undefined
    flags.version = {
      typeFn: Boolean,
      defaultV: false,
      short: 'V',
      description: 'Show version info',
      groupName: isBin ? 'Flags' : 'Inherited Flags',
    };
  }

  /** @param {string} str */
  const indent = (str) => '    ' + str;
  /** @param {string} title @param {string} body */
  const fmt = (title, body) => {
    if (!out[title]) out[title] = '';
    out[title] += '\n' + indent(body);
  };

  if (description) fmt('Description', description);
  if (alias) fmt('Alias', alias);

  fmt(
    'Usage',
    usage ? usage : '$ ' + name +
      (commands?.length ? ' [command]' : '') +
      (args && Object.keys(args).length ? ' [args]' : '') +
      ' [flags]',
  );

  if (example) fmt('Example', example);

  const maxLen = Math.max(
    // @ts-expect-error flags is not undefined
    ...Object.entries(flags).map(([k, v]) => {
      k = toKebabCase(k);
      const { short, placeholder, typeFn } = v;
      const nargs = Array.isArray(typeFn) ? '+' : '1';
      const temp = (short ? `-${short}, ` : '    ') + `--${k}` +
        (placeholder ? ' ' + formatNargs(nargs, placeholder) : '');
      return temp.length;
    }),
  ) + 4; // 4 here is gap between commands/flags/args and desc;

  // 4 here is commands/flags/args indentation
  const descIndent = maxLen + 4;
  const descWidth = columns - descIndent - 2; // right padding for scrollbar
  // https://stackoverflow.com/a/51506718
  const wrapRE = new RegExp(
    `(?![^\\n]{1,${descWidth}}$)([^\\n]{1,${descWidth}})\\s`,
    'g',
  );
  /** @param {string} str */
  const wrapAndIndent = (str) =>
    str.replace(wrapRE, `$1\n${' '.repeat(descIndent)}`);

  if (commands?.length) {
    for (const cmd of commands) {
      const { name, alias, description, groupName } = cmd;
      let temp = name + (alias ? `, ${alias}` : '');
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      // @ts-expect-error groupName is not undefined
      fmt(groupName, temp);
    }
  }

  for (const flag in flags) {
    const { description, defaultV, placeholder, short, groupName, typeFn } =
      // @ts-expect-error flags is not undefined
      flags[flag];
    let temp = (short ? `-${short},` : '   ') + ` --${toKebabCase(flag)}`;
    if (placeholder) {
      temp += ' ' +
        formatNargs(Array.isArray(typeFn) ? '+' : '1', placeholder);
    }
    if (description || defaultV) temp += ' '.padEnd(maxLen - temp.length);
    temp += wrapAndIndent(
      (description ? description : '') +
        (defaultV ? ` (default: ${defaultV})` : ''),
    );
    fmt(groupName, temp);
  }

  if (args && Object.keys(args).length) {
    for (const arg in args) {
      // @ts-expect-error args is not undefined
      const { description, nargs } = args[arg];
      let temp = formatNargs(nargs, arg);
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      fmt('Arguments', temp);
    }
  }

  for (const key in out) {
    console.log('\n  ' + key + out[key]);
  }
  if (epilog) console.log('\n' + epilog);
}

/**
 * @param {'1' | '?' | '*' | '+'} nargs
 * @param {string} placeholder
 */
function formatNargs(nargs, placeholder) {
  return nargs === '?'
    ? `[${placeholder}]`
    : nargs === '*'
    ? `[${placeholder}...]`
    : nargs === '+'
    ? `<${placeholder}>...`
    : nargs === '1'
    ? `<${placeholder}>`
    : placeholder;
}

/** @param {string} msg */
function error(msg) {
  console.error('Error: ' + msg);
  console.error('Try --help for more info.');
  Deno.exit(1);
}
