import { parse } from 'https://deno.land/std@0.120.0/flags/mod.ts';

export function komando(opt: KomandoOptions, argv: string[] = Deno.args) {
  const resolved: ResolvedKomandoOptions = {
    commands: [],
    flags: {},
    args: {},
    ...opt,
  };

  build(resolved, argv);
}

export function defineCommand(command: Command): Command {
  return command;
}

function build(resolved: ResolvedKomandoOptions, argv: string[]) {
  const { name, version } = resolved;
  if ((argv.includes('-V') || argv.includes('--version')) && version) {
    console.log(`${name}@${version}`);
    return;
  }

  let currentCommand: CurrentCommand = resolved;
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
        currentCommand = cmd as CurrentCommand;
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
      Object.entries(flags).map(([k, v]) => [k, v.alias ?? `__${k}__`]), // hack to skip unknownFn
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

function showHelp(bin: string, command: CurrentCommand) {
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

      if (val.help) {
        help += `    ${val.help}`;
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

      if (val.help) {
        help += `    ${val.help}`;
      }

      help += '\n';
    }
    help += '\n';
  }

  console.log(help);
}

function resolveFlags(parent: Flag, child?: Flag): Flag {
  return {
    ...child,
    ...Object.fromEntries(
      Object.entries(parent).filter(([_, v]) => v.preserve),
    ),
  };
}

type Command = {
  name: string;
  usage?: string;
  description?: string;
  examples?: string[];
  aliases?: string[];
  commands?: Command[];
  flags?: Flag;
  args?: Arg;
  run?: (args: Record<string, unknown>, flags: Record<string, unknown>) => void;
};

type CurrentCommand = RequireOnly<Command, 'commands' | 'flags'>;

type KomandoOptions = Omit<Command, 'alias'> & {
  version: string;
};

type RequireOnly<T, Keys extends keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: T[K];
  };

type ResolvedKomandoOptions = RequireOnly<
  KomandoOptions,
  'commands' | 'flags' | 'args'
>;

type Flag = {
  [field: string]: {
    help: string;
    alias?: string;
    default?: unknown;
    preserve?: boolean;
    placeholder?: string;
  };
};

type Arg = {
  [field: string]: {
    help: string;
    nargs: number | '?' | '*' | '+';
  };
};
