import { parse } from './deps.ts';

type Command = {
  /**
   * The name of the command.
   *
   * @example 'komando'
   */
  name: string;
  /**
   * Version number of this CLI app. This is not used in subcommands.
   *
   * @default undefined
   * @example 'v1.0.0'
   */
  version?: string;
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
   * Command aliases. This is only used in subcommands.
   * Root command should not have defined `aliases`.
   *
   * @default undefined
   * @example ['i', 'isntall']
   */
  aliases?: string[];
  /**
   * Sub-commands of this command.
   *
   * @default []
   */
  commands: Command[];
  /**
   * Options and flags for this command.
   *
   * @default {}
   */
  flags: Flags;
  /**
   * Positional arguments for this command.
   *
   * @default {}
   */
  args: Args;
  /**
   * Function to run when this command is found in `Deno.args`. When the
   * respective `run` function is undefined, help message will be shown instead.
   *
   * @default undefined
   */
  run?: (args: Record<string, unknown>, flags: Record<string, unknown>) => void;
  /**
   * Group this command under this title name in help message.
   *
   * @default 'COMMANDS'
   * @example 'CORE COMMANDS'
   */
  title?: string;
};

type UserCommand = RequireOnly<Partial<Command>, 'name'>;

type RequireOnly<T, Keys extends keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: T[K];
  };

type Flag = {
  /**
   * Flag description
   *
   * @default undefined
   */
  description?: string;
  /**
   * Short flag. Unlike command aliases, short flag has to be a single string.
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
   * It defaults to the flag name.
   *
   * @default <flag-name>
   * @example 'config-file'
   */
  placeholder?: string;
  /**
   * Group this command under this title name in help message.
   *
   * @default 'FLAGS'
   * @example 'RUNTIME FLAGS'
   */
  title?: string;
};

type Flags = {
  [long: string]: Flag;
};

type Arg = {
  /**
   * Number of values this argument requires.
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

export function komando(rootCommand: UserCommand, argv: string[] = Deno.args) {
  if (rootCommand.aliases) {
    throw new Error('root command should not have aliases.');
  }
  const resolved = defineCommand(rootCommand);
  komandoImpl(resolved, argv);
}

export function defineCommand(command: UserCommand): Command {
  const resolved: Command = {
    commands: [],
    flags: {},
    args: {},
    ...command,
  };

  groupBy('Commands', resolved.commands);
  groupBy('Flags', resolved.flags);

  for (const key in resolved.flags) {
    const val = resolved.flags[key];
    if (!val.placeholder) val.placeholder = key;
    if (!val.deepPass) val.deepPass = false;
  }

  for (const val of Object.values(resolved.args)) {
    if (!val.nargs) val.nargs = 1;
  }

  return resolved;
}

export function groupBy(title: string, toGroup: Command[] | Flags) {
  for (const val of Object.values(toGroup) as Command[] | Flag[]) {
    if (!val.title) val.title = title;
  }
  return toGroup;
}

function komandoImpl(currentCommand: Command, argv: string[]) {
  const { name, version } = currentCommand;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    console.log(`${name}@${version}`);
    return;
  }

  argv = [...argv]; // Deno.args is read only, copy it

  // filter out the matched commands
  let hasSubCommands = false;
  do {
    // reset here
    hasSubCommands = false;
    for (const cmd of currentCommand.commands) {
      const val = argv[0];
      if (cmd.name === val || cmd.aliases?.includes(val as string)) {
        const flags = resolveFlags(currentCommand.flags, cmd.flags);
        currentCommand = cmd;
        currentCommand.flags = flags;
        argv.shift();
        hasSubCommands = !!cmd.commands;
        break;
      }
    }
  } while (hasSubCommands);

  if (argv.includes('-h') || argv.includes('--help')) {
    showHelp(name, currentCommand, version);
    return;
  }

  const unknowns: Record<string, unknown> = {};
  const { flags, args, run } = currentCommand;
  const { _: inputArgs, ...inputFlags } = parse(argv, {
    alias: Object.fromEntries(
      Object.entries(flags).map((
        [k, v],
      ) => [k, [toKebabCase(k), v.short ?? '']]),
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

  for (const iflag in inputFlags) {
    const val = inputFlags[iflag];
    if (iflag in flags) {
      flags[iflag] = val;
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

  if (run) run(rArgs, flags);
}

const camelCasePattern = /\B([A-Z])/g;
function toKebabCase(str: string) {
  return str.replace(camelCasePattern, '-$1').toLowerCase();
}

function showHelp(bin: string, command: Command, version?: string) {
  const out: Record<string, string | string[]> = {};
  const { description, example, commands, flags, args, usage, aliases } =
    command;
  flags.help = {
    short: 'h',
    description: 'Show this message',
    deepPass: true,
    defaultV: false,
    title: 'Flags',
  };
  if (version) {
    flags.version = {
      short: 'V',
      defaultV: false,
      deepPass: true,
      description: 'Show version info',
      title: 'Flags',
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
      : `$ ${bin} ${commands ? '[command]' : ''} ${args ? '[args]' : ''} ${
        flags ? '[flags]' : ''
      }`,
  );

  if (example) fmt('Example', example);

  const maxLen = Math.max(
    ...Object.entries(flags).map(([k, v]) => {
      const { short, placeholder } = v;
      return (short && placeholder)
        ? `-${short}, --${k} [${placeholder}]`.length
        : short
        ? `-${short}, --${k}`.length
        : `    --${k} [${placeholder}]`.length;
    }),
  ) + 4;

  if (commands.length) {
    for (const cmd of commands) {
      const { name, aliases, description, title } = cmd;
      let temp = name + (aliases?.length ? `, ${aliases.join(', ')}` : '');
      temp += ' '.padEnd(maxLen - temp.length);
      if (description) temp += description;
      fmt(title!, temp);
    }
  }

  for (const flag in flags) {
    const { description, defaultV, placeholder, short, title } = flags[flag];
    let temp = (short ? `-${short},` : '   ') + ` --${flag}`;
    if (placeholder) temp += ` [${placeholder}]`;
    temp += ' '.padEnd(maxLen - temp.length);
    if (description) temp += description;
    if (defaultV) temp += ` [default: ${defaultV}]`;
    fmt(title!, temp);
  }

  if (Object.keys(args).length) {
    for (const arg in args) {
      const { description, nargs } = args[arg];
      let temp = nargs === '?'
        ? `[${arg}]`
        : nargs === '*'
        ? `[${arg}...]`
        : nargs === '+'
        ? `<${arg}...>`
        : typeof nargs === 'number'
        ? '<' + `${arg},`.repeat(nargs) + '>'
        : arg;
      temp += ' '.padEnd(maxLen - temp.length);
      if (description) temp += description;
      fmt('Args', temp);
    }
  }

  for (const key in out) {
    console.log('\n  ' + key + out[key]);
  }
}

function resolveFlags(parent: Flags, child?: Flags): Flags {
  return {
    ...child,
    ...Object.fromEntries(
      Object.entries(parent).filter(([_, v]) => v.deepPass),
    ),
  };
}
