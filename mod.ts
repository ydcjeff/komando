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
  /**
   * Function for showing version info. This function can be used to show
   * other related version info.
   *
   * _NOTE: This function is not called in sub-commands._
   *
   * @default console.log(`${name}@${version}`)
   */
  showVersion: (name: string, version: string) => void;
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
   * Put this flag under this group name in the help message.
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
    showVersion(name, version) {
      console.log(`${name}@${version}`);
    },
    ...command,
  };

  groupBy('Commands', resolved.commands);
  groupBy('Flags', resolved.flags);

  // TODO remove?
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

export function groupBy(name: string, toGroup: Command[] | Flags) {
  for (const val of Object.values(toGroup) as Command[] | Flag[]) {
    if (!val.groupName) val.groupName = name;
  }
  return toGroup;
}

function komandoImpl(currentCommand: Command, argv: string[]) {
  const { name, version, showVersion } = currentCommand;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    showVersion(name, version);
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

  if (argv.includes('-h') || argv.includes('--help') || !currentCommand.run) {
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
    flags,
    args,
    usage,
    aliases,
    epilog,
  } = command;
  flags.help = {
    short: 'h',
    description: 'Show this message',
    deepPass: true,
    defaultV: false,
    groupName: 'Flags',
  };
  if (version) {
    flags.version = {
      short: 'V',
      defaultV: false,
      deepPass: true,
      description: 'Show version info',
      groupName: 'Flags',
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
      : `$ ${bin}${commands.length ? ' [command]' : ''}${
        Object.keys(args).length ? ' [args]' : ''
      }${Object.keys(flags).length ? ' [flags]' : ''}`,
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

  if (commands.length) {
    for (const cmd of commands) {
      const { name, aliases, description, groupName } = cmd;
      let temp = name + (aliases?.length ? `, ${aliases.join(', ')}` : '');
      if (description) {
        temp += ' '.padEnd(maxLen - temp.length) + wrapAndIndent(description);
      }
      fmt(groupName!, temp);
    }
  }

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
