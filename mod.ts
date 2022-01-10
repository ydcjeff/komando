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
