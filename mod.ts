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
