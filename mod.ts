import { parse } from './deps.ts';
import { Args, Command, CommandOptions, Flags, ParseFlags } from './types.ts';

/**
 * Komando main function to define a CLI app.
 *
 * @param options Root options to define
 * @param argv Argument values from Deno (Deno.args)
 */
export function komando<F extends Flags, A extends Args>(
  options: CommandOptions<F, A>,
  argv = Deno.args,
) {
  const resolved = defineCommand(options);
  if (!resolved.showVersion) {
    resolved.showVersion = (name, version) => console.log(`${name}@${version}`);
  }

  komandoImpl(resolved, argv);
}

/**
 * A function to create a sub-command.
 *
 * @param options Sub-command options to define
 * @returns The sub-command with required properties defined
 */
export function defineCommand<F extends Flags, A extends Args>(
  options: CommandOptions<F, A>,
): Command {
  const resolved = {
    commands: [],
    flags: {} as Flags,
    args: {} as Args,
    ...options,
  };

  groupBy('Commands', resolved.commands);
  groupBy('Flags', resolved.flags);

  for (const key in resolved.flags) {
    const val = resolved.flags[key];
    if (!val.placeholder && val.typeFn !== Boolean) val.placeholder = key;
    if (val.typeFn === Boolean) {
      val.placeholder = undefined;
      val.defaultV = false;
    }
  }

  for (const val of Object.values(resolved.args)) {
    if (!val.nargs) val.nargs = 1;
  }

  return resolved as Command;
}

/**
 * Helper function that set `groupName` property of Array of `Command` or `Flags`
 * This function is used to group many commands or flags.
 *
 * @param name Group name
 * @param toGroup Array of `Command` or `Flags` to group
 * @returns Array of Commands or Flags with `groupName` defined
 */
export function groupBy<T>(name: string, toGroup: T) {
  for (const val of Object.values(toGroup)) {
    if (!val.groupName) val.groupName = name;
  }
  return toGroup;
}

function komandoImpl(currentCommand: Command, argv: string[]) {
  const { name, version, showVersion } = currentCommand;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    showVersion!(name, version);
    return;
  }

  argv = [...argv]; // Deno.args is read only, copy it

  // filter out the matched commands
  let hasSubCommands = false;
  do {
    // reset here
    hasSubCommands = false;
    for (const cmd of currentCommand.commands!) {
      const val = argv[0];
      if (cmd.name === val || cmd.aliases?.includes(val as string)) {
        currentCommand = cmd;
        argv.shift();
        hasSubCommands = !!cmd.commands;
        break;
      }
    }
  } while (hasSubCommands);

  if (argv.includes('-h') || argv.includes('--help') || !currentCommand.run) {
    showHelp(name, currentCommand, version);
    return;
  }

  const unknowns: Record<string, unknown> = {};
  const flags = currentCommand.flags as Flags;
  const args = currentCommand.args as Args;
  const run = currentCommand.run;

  const { _: inputArgs, ...inputFlags } = parse(argv, {
    alias: Object.fromEntries(
      Object.entries(flags).map((
        [k, v],
      ) => [k, [camelCaseRE.test(k) ? toKebabCase(k) : '', v.short ?? '']]),
    ),
    boolean: Object.entries(flags).filter(([_, v]) => v.typeFn === Boolean).map(
      ([k, _]) => k,
    ),
    default: Object.fromEntries(
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
    throw new Error('Unknown flags found. See the above table.');
  }

  const parsedFlags: ParseFlags<typeof flags> = {};
  for (const iflag in inputFlags) {
    if (iflag in flags!) {
      const val = inputFlags[iflag];
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

  const parsedArgs: Record<string, unknown> = {};
  for (const arg in args) {
    const nargs = args[arg].nargs;

    if (nargs === '?') {
      parsedArgs[arg] = inputArgs.shift();
    } else if (nargs === '*') {
      parsedArgs[arg] = [...inputArgs];
      break;
    } else if (nargs === '+') {
      if (inputArgs.length < 1) {
        throw new Error(`Argument ${arg} expected at least one argument`);
      }
      parsedArgs[arg] = [...inputArgs];
      break;
    } else if (typeof nargs === 'number') {
      if (inputArgs.length < nargs) {
        throw new Error(`Argument ${arg} expected ${nargs} argument(s).`);
      }
      parsedArgs[arg] = nargs === 1
        ? inputArgs.shift()
        : inputArgs.splice(0, nargs);
    }
  }

  if (typeof run === 'function') {
    run(parsedArgs, parsedFlags);
  }
}

const camelCaseRE = /\B([A-Z])/g;
function toKebabCase(str: string) {
  return str.replace(camelCaseRE, '-$1').toLowerCase();
}

function showHelp(bin: string, command: Command, version?: string) {
  const out: Record<string, string | string[]> = {};
  const { columns } = Deno.consoleSize(Deno.stdout.rid);
  const {
    description,
    example,
    commands,
    usage,
    aliases,
    epilog,
    name,
  } = command;

  const flags = command.flags as Flags;
  const args = command.args as Args;

  flags.help = {
    typeFn: Boolean,
    defaultV: false,
    short: 'h',
    description: 'Show this message',
    groupName: bin === name ? 'Flags' : 'Inherited Flags',
  };

  if (version) {
    flags.version = {
      typeFn: Boolean,
      defaultV: false,
      short: 'V',
      description: 'Show version info',
      groupName: bin === name ? 'Flags' : 'Inherited Flags',
    };
  }

  const indent = (str: string) => '    ' + str;
  const fmt = (title: string, body: string) => {
    if (!out[title]) out[title] = '';
    out[title] += '\n' + indent(body);
  };

  if (description) fmt('Description', description);
  if (aliases?.length) fmt('Aliases', aliases.join(', '));

  fmt(
    'Usage',
    usage
      ? `${usage}`
      : `$ ${bin}${commands?.length ? ' [command]' : ''}${
        args &&
          Object.keys(args).length
          ? ' [args]'
          : ''
      } [flags]`,
  );

  if (example) fmt('Example', example);

  const maxLen = Math.max(
    ...Object.entries(flags!).map(([k, v]) => {
      k = toKebabCase(k);
      const { short, placeholder } = v;
      return (short && placeholder)
        ? `-${short}, --${k} <${placeholder}>`.length
        : short
        ? `-${short}, --${k}`.length
        : placeholder
        ? `    --${k} <${placeholder}>`.length
        : `    --${k}`.length;
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
  const wrapAndIndent = (str: string) =>
    str.replace(wrapRE, `$1\n${' '.repeat(descIndent)}`);

  if (commands?.length) {
    for (const cmd of commands) {
      const { name, aliases, description, groupName } = cmd;
      let temp = name + (aliases?.length ? `, ${aliases.join(', ')}` : '');
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      fmt(groupName!, temp);
    }
  }

  if (flags) {
    for (const flag in flags) {
      const { description, defaultV, placeholder, short, groupName, typeFn } =
        flags[flag];
      let temp = (short ? `-${short},` : '   ') + ` --${toKebabCase(flag)}`;
      if (placeholder) {
        temp += ' ' + formatNargs(Array.isArray(typeFn) ? '+' : 1, placeholder);
      }
      if (description || defaultV) temp += ' '.padEnd(maxLen - temp.length);
      temp += wrapAndIndent(
        (description ? description : '') +
          (defaultV ? ` (default: ${defaultV})` : ''),
      );
      fmt(groupName!, temp);
    }
  }

  if (args && Object.keys(args).length) {
    for (const arg in args) {
      const { description, nargs } = args[arg];
      let temp = formatNargs(nargs!, arg);
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      fmt('Args', temp);
    }
  }

  for (const key in out) {
    console.log('\n  ' + key + out[key]);
  }
  if (epilog) console.log(epilog);
}

function formatNargs(nargs: number | '?' | '*' | '+', placeholder: string) {
  return nargs === '?'
    ? `[${placeholder}]`
    : nargs === '*'
    ? `[${placeholder}...]`
    : nargs === '+'
    ? `<${placeholder}>...`
    : typeof nargs === 'number'
    ? '<' + placeholder + `,${placeholder}`.repeat(nargs - 1) + '>'
    : placeholder;
}
