import { parse } from 'https://deno.land/std@0.120.0/flags/mod.ts';

export function komando(opt: UserKomandoOptions, argv: string[] = Deno.args) {
  const resolved = defineCommand(opt);
  // even though `resolved` is Command type,
  // it already has `version`, so pass with as KomandoOptions.
  komandoImpl(resolved as KomandoOptions, argv);
}

export function defineCommand(command: UserCommand): Command {
  const resolved: Command = {
    commands: [],
    flags: {},
    args: {},
    ...command,
  };

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

function komandoImpl(resolved: KomandoOptions, argv: string[]) {
  const { name, version } = resolved;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    console.log(`${name}@${version}`);
    return;
  }

  let currentCommand: Command = resolved;
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
    showHelp(name, currentCommand);
    return;
  }

  const unknowns: Record<string, unknown> = {};
  const { flags, args, run } = currentCommand;
  const { _: inputArgs, ...inputFlags } = parse(argv, {
    alias: Object.fromEntries(
      Object.entries(flags).map(([k, v]) => [k, v.alias ?? toKebabCase(k)]),
    ),
    default: Object.fromEntries(
      Object.entries(flags).map(([k, v]) => [k, v.default ?? undefined]),
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

function showHelp(bin: string, command: Command) {
  let help = '';

  if (command.description) {
    help += `  ${command.description}\n\n`;
  }

  if (command.usage) {
    help += `  Usage:\n    ${command.usage}\n\n`;
  }

  if (command.commands) {
    help += `  Commands:\n`;

    for (const cmd of command.commands) {
      help += `    ${cmd.name}`;

      if (cmd.description) {
        help += `    ${cmd.description}`;
      }

      help += '\n';
    }

    help += '\n';
  }

  if (command.flags) {
    help += `  Flags:\n`;

    for (const flag in command.flags) {
      const val = command.flags[flag];

      help += '    ';

      if (val.alias) {
        help += `-${val.alias}, `;
      }

      help += `--${flag}`.padEnd(12);

      if (val.description) {
        help += `    ${val.description}`;
      }

      help += '\n';
    }

    help += '\n';
  }

  if (command.args) {
    help += `  Args:\n`;

    for (const arg in command.args) {
      const val = command.args[arg];

      help += `    ${arg}`;

      if (val.description) {
        help += `    ${val.description}`;
      }

      help += '\n';
    }
    help += '\n';
  }

  console.log(help);
}

function resolveFlags(parent: Flags, child?: Flags): Flags {
  return {
    ...child,
    ...Object.fromEntries(
      Object.entries(parent).filter(([_, v]) => v.deepPass),
    ),
  };
}

type Command = {
  /**
   * The name of the command.
   */
  name: string;
  /**
   * Command usage.
   *
   * @default undefined
   */
  usage?: string;
  /**
   * Command description.
   *
   * @default undefined
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
   * @default undefined
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
   * The function to run when this command is found in `Deno.args`.
   */
  run?: (args: Record<string, unknown>, flags: Record<string, unknown>) => void;
};

type UserCommand = RequireOnly<Partial<Command>, 'name'>;

type UserKomandoOptions = Omit<UserCommand, 'aliases'> & {
  /**
   * Version number of this CLI app
   */
  version: string;
};

type KomandoOptions = Omit<Command, 'aliases'> & {
  version: string;
};

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
   * Flag alias. Unlike command aliases, flag alias has to be a single string.
   *
   * @default undefined
   */
  alias?: string;
  /**
   * Default value of this flag.
   *
   * @default undefined
   */
  default?: unknown;
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
   */
  placeholder?: string;
};

type Flags = {
  [field: string]: Flag;
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
   */
  description?: string;
};

type Args = {
  [field: string]: Arg;
};
