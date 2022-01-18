export type CommandOptions<F extends Flags, A extends Args> = {
  name: string;
  /** only used in root command */
  version?: string;
  usage?: string;
  description?: string;
  example?: string;
  /** only used in sub-commands */
  aliases?: string[];
  commands?: Command[];
  flags?: F;
  args?: A;
  /** put this command under this group name in help message */
  groupName?: string;
  /** extra message to print at the end of help message */
  epilog?: string;
  /** function to run for this command */
  run?: RunFunction<F, A>;
  showVersion?: (name: string, version: string) => void;
};

export type Command<
  F extends Flags = Record<never, never>,
  A extends Args = Record<never, never>,
> = CommandOptions<F, A>;

export type RunFunction<F extends Flags, A extends Args> = (
  args: ParseArgs<A>,
  flags: ParseFlags<F>,
) => void | Promise<void>;

export type FlagDefault<DefaultType = unknown> = {
  defaultV?: DefaultType;
};

export type FlagTypeFn<TF = TypeFunction | TypeFunctionArray> = {
  typeFn: TF;
};

// deno-lint-ignore no-explicit-any
export type TypeFunction<ReturnType = unknown> = (value: any) => ReturnType;

export type TypeFunctionArray<ReturnType = unknown> = readonly [
  TypeFunction<ReturnType>,
];

export type ParseFlags<F extends Flags> = {
  [K in keyof F]: InferFlag<F[K]>;
};

type InferFlag<F extends Flag> = F extends
  FlagTypeFn<TypeFunctionArray<infer T>>
  ? F extends FlagDefault<infer D> ? T[] | D : T[] | undefined
  : F extends FlagTypeFn<TypeFunction<infer T>>
    ? F extends FlagDefault<infer D> ? T | D : T | undefined
  : never;

export type Flag = FlagTypeFn & FlagDefault & {
  description?: string;
  /** short flag, it has to be a single character */
  short?: string;
  placeholder?: string;
  /** put this flag under this group name in help message */
  groupName?: string;
};

export type Flags = {
  [long: string]: Flag;
};

export type ParseArgs<A extends Args> =
  & {
    [K in keyof A]: InferArg<A[K]>;
  }
  & { '--': string[] };

export type Arg = {
  /**
   * Number of values this argument/flag requires.
   *
   * `?`, `*`, `+` works same as in JavaScript Regex meaning.
   *
   * - `?` requires zero or one value, output will be undefined or a single value.
   * - `*` requires zero or more values, output will be an empty array or an
   * array with many values.
   * - `+` requires one or more values, output will be an array with a single
   * value or an array with many values.
   * - If `1`, output will be a single value.
   *
   * @default '1'
   */
  nargs?: '1' | '?' | '*' | '+';
  description?: string;
};

export type Args = {
  [long: string]: Arg;
};

type InferArg<A extends Arg> = A extends { nargs: '?' } ? string | undefined
  : A extends { nargs: '*' } ? string[] | undefined
  : A extends { nargs: '+' } ? string[]
  : A extends { nargs: '1' } ? string
  : never;
