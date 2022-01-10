import { Args, parse } from 'https://deno.land/std@0.120.0/flags/mod.ts';

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

  run(resolved, parse(argv));
}

export function defineCommand(command: Command): Command {
  return command;
}

function run(resolved: ResolvedKomandoOptions, argv: Args) {
  const { _: inputArgs, ...inputFlags } = argv;
  const { name, version } = resolved;
  let { commands, flags, args, run } = resolved;

  if ((inputFlags.version || inputFlags.V) && version) {
    console.log(`${name}@${version}`);
    return;
  }

  // filter out the matched commands
  let hasSubCommands = false;
  do {
    // reset here
    hasSubCommands = false;
    for (const cmd of commands) {
      const val = inputArgs[0];

      if (cmd.name === val || cmd.aliases?.includes(val as string)) {
        commands = cmd.commands as Command[];
        flags = resolveFlags(flags, cmd.flags);
        args = cmd.args as Arg;
        run = cmd.run;
        inputArgs.shift();
        hasSubCommands = !!cmd.commands;
        break;
      }
    }
  } while (hasSubCommands);

  console.log(inputArgs);
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
  run?: () => void;
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
    placeholder?: string;
    preserve?: boolean;
  };
};

type Arg = {
  [field: string]: {
    help: string;
    nargs: number | '?' | '*' | '+';
  };
};
