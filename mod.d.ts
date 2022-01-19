export type CommandOptions<F extends Flags, A extends Args> = {
  /**
   * Name of this command.
   */
  name: string;
  /**
   * Version of this CLI app. Only used in root command.
   */
  version?: string;
  /**
   * Command usage.
   */
  usage?: string;
  /**
   * Command description.
   */
  description?: string;
  /**
   * Command examples.
   */
  example?: string;
  /**
   * Command alias. Only used in sub-commands.
   */
  alias?: string;
  /**
   * Sub-commands.
   */
  commands?: Command[];
  /**
   * Flags of this command.
   */
  flags?: F;
  /**
   * Arguments of this command.
   */
  args?: A;
  /**
   * Put this command under this group name in help message
   */
  groupName?: string;
  /**
   * Extra message to print at the end of help message
   */
  epilog?: string;
  /**
   * Function to run for this command
   */
  run?: RunFunction<F, A>;
  /**
   * Funtion to show version. Can be used to show custom version info.
   */
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

type FlagDefault<DefaultType = unknown> = {
  defaultV?: DefaultType;
};

type FlagTypeFn<TF = TypeFunction | TypeFunctionArray> = {
  typeFn: TF;
};

// deno-lint-ignore no-explicit-any
type TypeFunction<ReturnType = unknown> = (value: any) => ReturnType;

type TypeFunctionArray<ReturnType = unknown> = readonly [
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
  /**
   * Flag description.
   */
  description?: string;
  /**
   * Short flag, it has to be a single character
   */
  short?: string;
  /**
   * Placeholder name for this flag. If undefined, it will use long flag name.
   */
  placeholder?: string;
  /**
   * Put this flag under this group name in help message
   */
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
  /**
   * Argument description.
   */
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

/**
 * Komando main function to define a CLI app.
 *
 * @param options Root commands options to define
 * @param argv Argument values from Deno or Node
 */
export declare function komando<F extends Flags, A extends Args>(
  options: CommandOptions<F, A>,
  argv?: string[],
): void;
/**
 * A function to create a sub-command.
 *
 * @param options Sub-command options to define
 * @returns The sub-command with required properties defined
 */
export declare function defineCommand<F extends Flags, A extends Args>(
  options: CommandOptions<F, A>,
): Command;
/**
 * Helper function that set `groupName` property of Array of `Command` or `Flags`
 * if `groupName` is undefined.
 *
 * This function is used to group many commands or flags.
 *
 * @param name Group name
 * @param toGroup Array of `Command` or `Flags` to group
 * @returns Array of Commands or Flags with `groupName` defined
 */
export declare function groupBy<T>(name: string, toGroup: T): T;
