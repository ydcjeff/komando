import { parse } from 'https://deno.land/std@0.120.0/flags/mod.ts';

export function komando(opt: KomandoOptions, argv: string[] = Deno.args) {
  const resolved: ResolvedKomandoOptions = {
    commands: [],
    flags: {
      help: {
        help: 'Show this message',
        alias: 'h',
        preserve: true,
      },
    },
    args: {},
    ...opt,
  };

  if (opt.version) {
    resolved.flags.version = {
      help: 'Show version info',
      alias: 'V',
      preserve: true,
    };
  }

  build(resolved, argv);
}

export function defineCommand(command: Command): Command {
  return command;
}

function build(resolved: ResolvedKomandoOptions, argv: string[]) {
  let { commands, flags, args, run } = resolved;
  argv = [...argv]; // Deno.args is read only, copy it

  // filter out the matched commands
  let hasSubCommands = false;
  do {
    // reset here
    hasSubCommands = false;
    for (const cmd of commands) {
      const val = argv[0];
      if (cmd.name === val || cmd.aliases?.includes(val as string)) {
        commands = cmd.commands as Command[];
        flags = resolveFlags(flags, cmd.flags);
        args = cmd.args as Arg;
        run = cmd.run;
        argv.shift();
        hasSubCommands = !!cmd.commands;
        break;
      }
    }
  } while (hasSubCommands);

  const unknowns: Record<string, unknown> = {};
  const { _: inputArgs, ...inputFlags } = parse(argv, {
    alias: Object.fromEntries(
      Object.entries(flags).map(([k, v]) => [k, v.alias ?? `__${k}__`]), // hack to skip unknownFn
    ),
    default: Object.fromEntries(
      Object.entries(flags).map(([k, v]) => [k, v.default ?? undefined]),
    ),
    unknown(arg, _, v) {
      unknowns[arg] = v;
      return false;
    },
  });

  if (Object.keys(unknowns).length) {
    console.table(unknowns);
    throw new Error('Unknown flags found. See the above table.');
  }

  const { name, version } = resolved;
  if ((inputFlags.version || inputFlags.V) && version) {
    console.log(`${name}@${version}`);
    return;
  }

  for (const iflag in inputFlags) {
    const val = inputFlags[iflag];
    if (iflag in flags) {
      flags[iflag] = val;
    }
  }

  if (run) run(flags);
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
  run?: (flags: Flag) => void;
};

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
