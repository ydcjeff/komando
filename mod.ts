import { parse } from './deps.ts';

type RootCommand<F, A> = Omit<SubCommand<F, A>, 'aliases'> & {
  /**
   * Version number of this CLI app.
   *
   * @default undefined
   * @example 'v1.0.0'
   */
  version?: string;
  /**
   * Function for showing version info. This function can be used to show
   * other related version info.
   *
   * @default console.log(`${name}@${version}`)
   */
  showVersion?: (name: string, version: string) => void;
};

type SubCommand<F, A> = {
  /**
   * The name of the command.
   *
   * @example 'komando'
   */
  name: string;
  /**
   * Command usage.
   *
   * @default undefined
   * @example '$ komando [command] [flags]'
   */
  usage?: string;
  /**
   * Command description.
   *
   * @default undefined
   * @example 'Type first and safe CLI app builder for Deno'
   */
  description?: string;
  /**
   * Examples of command usages.
   * For multiple examples, pass the value as string template.
   *
   * @default undefined
   */
  example?: string;
  /**
   * Command aliases.
   *
   * _**NOTE: This is only used in subcommands.
   * Root command should not have defined `aliases`.**_
   *
   * @default undefined
   * @example ['i', 'isntall']
   */
  aliases?: string[];
  /**
   * Sub-commands of this command.
   *
   * @default undefined
   */
  commands?: SubCommand<F, A>[];
  /**
   * Options and flags for this command.
   *
   * @default undefined
   */
  flags?: F;
  /**
   * Positional arguments for this command.
   *
   * @default undefined
   */
  args?: A;
  /**
   * Function to run when this command is found in `Deno.args`. When the
   * respective `run` function is undefined, help message will be shown instead.
   *
   * @default undefined
   */
  run?: <rA, rF>(args: rA, flags: rF) => void;
  /**
   * Put this command under this group name in the help message.
   *
   * @default 'Commands'
   * @example 'Core Commands'
   */
  groupName?: string;
  /**
   * Extra message to print at the end of the help message.
   *
   * @default undefined
   */
  epilog?: string;
};

type Flag = {
  /**
   * Flag description
   *
   * @default undefined
   */
  description?: string;
  /**
   * Short flag.
   *
   * _**NOTE: Unlike command aliases, short flag has to be a single character.**_
   *
   * @default undefined
   * @example '-c'
   */
  short?: string;
  /**
   * Default value of this flag.
   *
   * @default undefined
   * @example 'deno.jsonc'
   */
  defaultV?: unknown;
  /**
   * Whether this flag should be passed deeply to all sub-commands' flags.
   *
   * @default false
   */
  deepPass?: boolean;
  /**
   * The placeholder to appear in the help message.
   * It defaults to the long flag name.
   *
   * @default <long-flag-name>
   * @example 'config-file'
   */
  placeholder?: string;
  /**
   * Put this flag under this group name in the help message. If `deepPass` is
   * true, this flag will be shown under `Inherited Flags` in sub-commands' help
   * and it cannot be changed.
   *
   * @default 'Flags'
   * @example 'Runtime Flags'
   */
  groupName?: string;
};

type Flags = {
  [long: string]: Flag;
};

type Arg = {
  /**
   * Number of values this argument requires.
   *
   * `?`, `*`, `+` works same as in JavaScript Regex meaning.
   *
   * - `?` requires zero or one value, output will be undefined or a single value.
   * - `*` requires zero or more values, output will be an empty array or an
   * array with many values.
   * - `+` requires one or more values, output will be an array with a single
   * value or an array with many values.
   * - If `1`, output will be a single value.
   * - If other specific number, output will be an array with that number of
   * values.
   *
   * @default 1
   */
  nargs?: number | '?' | '*' | '+';
  /**
   * Argument description.
   *
   * @default undefined
   */
  description?: string;
};

type Args = {
  [long: string]: Arg;
};

/**
 * Komando main function to define a CLI app.
 *
 * @param rootCommand Root command to define
 * @param argv Argument values from Deno (Deno.args)
 */
export function komando<F extends Flags, A extends Args>(
  rootCommand: RootCommand<F, A>,
  argv: string[] = Deno.args,
) {
  if (!rootCommand.flags) rootCommand.flags = {} as F;
  if (!rootCommand.showVersion) {
    rootCommand.showVersion = (name, version) =>
      console.log(`${name}@${version}`);
  }
  if (rootCommand.version) {
    (rootCommand.flags as Flags).version = {
      short: '-V',
      description: 'Show version info',
      deepPass: true,
      defaultV: false,
      groupName: 'Flags',
    };
  }
  (rootCommand.flags as Flags).help = {
    short: '-h',
    description: 'Show this message',
    deepPass: true,
    defaultV: false,
    groupName: 'Flags',
  };
  const resolved = defineCommand(rootCommand);
  komandoImpl(resolved, argv);
}

/**
 * Helper function to set default values to the sub-command. So, users do not
 * need to define the required values in {@link komando} main function.
 * This also provide type helper with completions.
 *
 * @param command Sub-command to define
 * @returns The sub-command with required properties defined
 */
export function defineCommand<
  F extends Flags & { help?: Flag; version?: Flag },
  A extends Args,
>(
  command: SubCommand<F, A>,
): SubCommand<F, A> {
  if (command.commands) {
    groupBy('Commands', command.commands as SubCommand<Flags, Args>[]);
  }
  if (command.flags) groupBy('Flags', command.flags);

  // we require long flag name, so loop again
  for (const key in command.flags) {
    const val = command.flags[key];
    if (!val.placeholder) val.placeholder = key;
    if (!val.deepPass) val.deepPass = false;
  }

  if (command.args) {
    for (const val of Object.values(command.args)) {
      if (!val.nargs) val.nargs = 1;
    }
  }

  return command;
}

/**
 * Helper function that set `groupName` property of Array of `Command` or `Flags`
 * This function is used to group many commands or flags.
 *
 * @param name Group name
 * @param toGroup Array of `Command` or `Flags` to group
 * @returns Array of Commands or Flags with `groupName` defined
 */
export function groupBy<
  T extends Flags | SubCommand<F, A>[],
  F extends Flags,
  A extends Args,
>(
  name: string,
  toGroup: T,
): T {
  for (const val of Object.values(toGroup) as SubCommand<F, A>[] | Flag[]) {
    if (!val.groupName) val.groupName = name;
  }
  return toGroup;
}

function komandoImpl<F extends Flags, A extends Args>(
  currentCommand: RootCommand<F, A>,
  argv: string[],
) {
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
    if (currentCommand.commands) {
      for (const cmd of currentCommand.commands) {
        const val = argv[0];
        if (cmd.name === val || cmd.aliases?.includes(val as string)) {
          const flags = resolveFlags(currentCommand.flags!, cmd.flags!);
          currentCommand = cmd;
          currentCommand.flags = flags as F;
          argv.shift();
          hasSubCommands = !!cmd.commands;
          break;
        }
      }
    }
  } while (hasSubCommands);

  if (argv.includes('-h') || argv.includes('--help') || !currentCommand.run) {
    showHelp(name, currentCommand);
    return;
  }

  const unknowns: Record<string, unknown> = {};
  const { flags, args, run } = currentCommand;
  const { _: inputArgs, ...inputFlags } = parse(argv, {
    alias: Object.fromEntries(
      Object.entries(flags!).map((
        [k, v],
      ) => [k, [toKebabCase(k), v.short ?? '']]),
    ),
    default: Object.fromEntries(
      Object.entries(flags!).map(([k, v]) => [k, v.defaultV ?? undefined]),
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

  const rFlags: Record<string, unknown> = {};
  for (const iflag in inputFlags) {
    const val = inputFlags[iflag];
    if (iflag in flags!) {
      rFlags[iflag] = val;
    }
  }

  const rArgs: Record<string, unknown> = {};
  for (const arg in args) {
    const nargs = args[arg].nargs;

    if (nargs === '?') {
      rArgs[arg] = inputArgs.shift();
    } else if (nargs === '*') {
      rArgs[arg] = [...inputArgs];
      break;
    } else if (nargs === '+') {
      if (inputArgs.length < 1) {
        throw new Error(`Argument ${arg} expected at least one argument`);
      }
      rArgs[arg] = [...inputArgs];
      break;
    } else if (typeof nargs === 'number') {
      if (inputArgs.length < nargs) {
        throw new Error(`Argument ${arg} expected ${nargs} argument(s).`);
      }
      rArgs[arg] = nargs === 1 ? inputArgs.shift() : inputArgs.splice(0, nargs);
    }
  }

  type rArgsType = typeof rArgs;
  type rFlagsType = typeof rFlags;
  if (run) {
    run<
      { [K in keyof rArgsType]: rArgsType[K] },
      { [K in keyof rFlagsType]: rFlagsType[K] }
    >(rArgs, rFlags);
  }
}

const camelCaseRE = /\B([A-Z])/g;
function toKebabCase(str: string) {
  return str.replace(camelCaseRE, '-$1').toLowerCase();
}

function showHelp<F extends Flags, A extends Args>(
  bin: string,
  command: RootCommand<F, A> & SubCommand<F, A>,
) {
  const out: Record<string, string | string[]> = {};
  const { columns } = Deno.consoleSize(Deno.stdout.rid);
  const {
    description,
    example,
    commands,
    flags,
    args,
    usage,
    aliases,
    epilog,
  } = command;

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
      const { short, placeholder } = v;
      return (short && placeholder)
        ? `-${short}, --${k} <${placeholder}>`.length
        : short
        ? `-${short}, --${k}`.length
        : `    --${k} <${placeholder}>`.length;
    }),
  ) + 4; // 4 here is gap between commands/flags/args and desc;

  // 4 here is commands/flags/args indentation
  const descIndent = maxLen + 4;
  const descWidth = columns - descIndent;
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
      const { description, defaultV, placeholder, short, groupName } =
        flags[flag];
      let temp = (short ? `-${short},` : '   ') + ` --${flag}`;
      if (placeholder) temp += ` [${placeholder}]`;
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      if (defaultV) temp += ` [default: ${defaultV}]`;
      fmt(groupName!, temp);
    }
  }

  if (args && Object.keys(args).length) {
    for (const arg in args) {
      const { description, nargs } = args[arg];
      let temp = nargs === '?'
        ? `[${arg}]`
        : nargs === '*'
        ? `[${arg}...]`
        : nargs === '+'
        ? `<${arg}...>`
        : typeof nargs === 'number'
        ? '<' + `${arg}` + `,${arg}`.repeat(nargs - 1) + '>'
        : arg;
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

function resolveFlags(parent: Flags, child: Flags): Flags {
  const out: Flags = {};
  for (const cFlag in child) {
    if (cFlag in parent && parent[cFlag].deepPass) {
      throw new Error(
        `Found duplicate flags when merging inherited and child flags: ` +
          `"${cFlag}"`,
      );
    }
    out[cFlag] = child[cFlag];
  }
  const temp = Object.entries(parent).filter(([_, v]) => v.deepPass);
  temp.forEach(([_, v]) => v.groupName = 'Inherited Flags');
  return Object.assign(
    out,
    Object.fromEntries(temp),
  );
}
