# Komando

[![ci status](https://github.com/ydcjeff/komando/actions/workflows/ci.yml/badge.svg)](https://github.com/ydcjeff/komando/actions/workflows/ci.yml)
[![deno docs](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/komando/mod.js)

[![npm version](https://badgen.net/npm/v/komando)](https://www.npmjs.com/package/komando)
[![npm weekly downloads](https://badgen.net/npm/dw/komando)](https://www.npmjs.com/package/komando)
[![node version](https://badgen.net/npm/node/komando)](https://www.npmjs.com/package/komando)
[![node version](https://badgen.net/npm/types/komando)](https://www.npmjs.com/package/komando)

> Type safe CLI devtool for Deno and Node

## Features

- Minimal API, enhance as you progress
- Unlimited (nested) sub-commands
- Responsive help message with terminal width
- Fully Typed API

Jump to
[`bat` example](https://github.com/ydcjeff/komando/blob/main/examples/bat.js).

## Installation

For Deno:

```sh
// @deno-types="https://deno.land/x/komando/mod.d.ts"
import { komando } from 'https://deno.land/x/komando/mod.js';
```

For Node:

```sh
pnpm add komando -D
```

## Usage

- [`komando` function on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/komando)
- [`CommandOptions` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/CommandOptions)

The main entry of this module is `komando` function. `komando` function creates
the CLI app and parse `Deno.args` for Deno or `process.argv.slice(2)` for Node
and run them. Komando will generate the help message by default with respect to
the terminal width.

```js
komando({
  name: 'main',
  version: '1.0.0', // will add `-V, --version` flag if `version` exist.
  // ... the rest of options
});
```

### Sub-commands

- [`defineCommand` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/defineCommand)
- [`CommandOptions` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/CommandOptions)

Sub-commands can be created with `defineCommand` helper function. It provides
type inference and set the default values if there isn't. And put the command in
the `commands` property of `komando` function. Sub-sub-commands can be put in
the `commands` property of the parent sub-commands.

```js
const devCommand = defineCommand({
  name: 'dev',
  commands: [
    // ...sub sub commands if needed
  ],
});

komando({
  commands: [
    devCommand,
  ],
});
```

### Flags

- [`Flags` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/Flags)
- [`Flag` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/Flag)

Flags (aka Options) are simple JavaScript objects and they can be created in the
`flags` property of command options.

```js
komando({
  // ...
  flags: {
    host: {
      typeFn: String, // require for type inference, can be Number, Boolean, or [Number] for an array of output any other function that takes one argument and return one value,
      // ...
    },
  },
});
```

_**NOTE: `flags` are local by default. If you need a global flags, create a
global shared object and reused it where needed.**_

```js
const globalOptions = {
  config: { typeFn: String },
  debug: { typeFn: Boolean },
};

const devCommand = defineCommand({
  flags: {
    host: { typeFn: String },
    port: { typeFn: Number },
    ...globalOptions,
  },
});

komando({
  flags: {
    ...globalOptions,
  },
});
```

### Arguments

- [`Args` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/Args)
- [`Arg` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando/mod.js/~/Arg)

Arguments are also simple objects and can be created in `args` property of
command options. Arguments after `--` are collected in the `--` property of
`args`.

```js
komando({
  args: {
    root: {
      nargs: '?', // can be one of '1' | '?' | '*' | '+'
      description: 'Root directory',
    },
  },
  run(args) {
    console.log(args); // { '--': [], root: undefined }
  },
});
```

### Run function

- [`run` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando@/mod.js/~/RunFunction)

Each command has an optional `run` function to run when the command is
encountered in the `argv`.

```js
komando({
  // ....
  flags: {
    config: { typeFn: String },
    debug: { typeFn: Number },
  },
  run(args, flags) {
    // do something, run your code with fully typed `args`, `flags`
    flags.config; // string | undefined
    flags.debug; // boolean | undefined
    args['--']; // string[]
  },
});
```

### Misc

- [`groupBy` on Deno Doc](https://doc.deno.land/https://deno.land/x/komando@v0.0.5/mod.js/~/groupBy)

  Commands or flags can be grouped under custom title in the help message. This
  is done by
  [`groupBy`](https://doc.deno.land/https://deno.land/x/komando@v0.0.5/mod.js/~/groupBy)
  function. It takes a title and an array of commands or a flags object to
  group.

## Contribution

- Install [Deno](https://deno.land/manual/getting_started/installation).

- Setup git hooks

  ```sh
  git config core.hookspath .githooks
  ```

## License

[MIT](./LICENSE)
