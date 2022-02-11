# Komando Changelog

<!-- CHLOG_SPLIT_MARKER -->

## [v1.0.1](https://github.com/ydcjeff/komando/compare/v1.0.0...v1.0.1)

_2022-02-11_

### Bug Fixes

- [`9da45bc`](https://github.com/ydcjeff/komando/commit/9da45bc) show full
  command in help msg of nested commands (fix #25)

## [v1.0.0](https://github.com/ydcjeff/komando/compare/7ae9129...v1.0.0)

_2022-01-19_

1.0 Release of Komando. See
[README](https://github.com/ydcjeff/komando/blob/main/README.md) for more.

<details>
  <summary>
  Full changelog to 1.0
  </summary>

### Bug Fixes

- [`16b7b11`](https://github.com/ydcjeff/komando/commit/16b7b11) handle some
  edge cases, fix #19

- [`e6c9c70`](https://github.com/ydcjeff/komando/commit/e6c9c70) help desc +
  default, kebabcase, right padding, undefined value

  - change value type to `any` in `TypeFunction`
  - default value false for Boolean
  - only alias camelcase if needed
  - only convert type if not undefined
  - calc no placeholder length in help msg
  - add right padding for scrollbar width
  - wrap flag desc + default value

- [`3f88114`](https://github.com/ydcjeff/komando/commit/3f88114) provide types
  for `args` which also has `--`

  arguments after `--` are now in `args.['--']` entry.

  fix #16

### Documentation

- [`7df120b`](https://github.com/ydcjeff/komando/commit/7df120b) more jsdoc in
  functions + types

### Features

- [`3415ba7`](https://github.com/ydcjeff/komando/commit/3415ba7) **(help)** add
  `title` property + `groupBy` function for grouping relevant commands + flags
  in help message

  plus a few necessary changes

- [`ab6373c`](https://github.com/ydcjeff/komando/commit/ab6373c) **(help)** help
  message now shows `Aliases` if defined.

  plus titles are now capitalized (not uppercased anymore).

- [`fea0bd0`](https://github.com/ydcjeff/komando/commit/fea0bd0) **(help)**
  properly indent help message with terminal width

  Help message is now properly wrapped and indented with respect to the terminal
  width.

  **NOTE: `--unstable` flag must be passed to `deno`.**

  fix #10

- [`61625e9`](https://github.com/ydcjeff/komando/commit/61625e9) **(help)** show
  "Inherited Flags" in the help message

  help message will show "Inherited Flags" as the title and with its respective
  flags if there are inherited flags in the child command. The title is
  hardcoded and cannot be changed.

  fix #7

- [`2139c3a`](https://github.com/ydcjeff/komando/commit/2139c3a) **(help)** show
  help message if the command has no run fn

- [`9b3226a`](https://github.com/ydcjeff/komando/commit/9b3226a) **(types)**
  expose Flag, Arg, RunFunction

- [`5178d35`](https://github.com/ydcjeff/komando/commit/5178d35) add
  defineCommand for types infer

- [`26d3035`](https://github.com/ydcjeff/komando/commit/26d3035) add entry
  komando function

- [`15b9cdf`](https://github.com/ydcjeff/komando/commit/15b9cdf) add epilog
  property in Command

  This property is same as `epilog` found in Python's Argparse. It will show at
  the end of the help message. String formatting of this `epilog` property
  should be handled by users. Komando will only call `console.log` for `epilog`
  if defined.

  fix #8

- [`dfdb4ab`](https://github.com/ydcjeff/komando/commit/dfdb4ab) custom
  `showVersion` function

  This function can be used to show custom version info like Deno version, TS
  version, and related version info.

  _NOTE: this function is not called in sub-commands._

  fix #11

- [`a4c403b`](https://github.com/ydcjeff/komando/commit/a4c403b) flag now
  support multiple flag arguments

  Support is done via `typeFn` allowing to pass an array of type constructor,
  i.e. `[String]`, `[Number]`

  fix #13

- [`f6de2d1`](https://github.com/ydcjeff/komando/commit/f6de2d1) throw an error
  if there are duplicate keys in merging flags

  Komando will only throw an error if there are duplicate keys when merging
  parent flags and child flags (not parent + grandchild flags) So make sure to
  run all the commands in tests.

  fix #5

- [`fe88bb1`](https://github.com/ydcjeff/komando/commit/fe88bb1) type safe
  support for `args` & `flags` in run fn

  fix #3, fix #12

### Refactoring

- [`091161d`](https://github.com/ydcjeff/komando/commit/091161d) **(flag)**
  rename Flag's alias to short

- [`95b28ae`](https://github.com/ydcjeff/komando/commit/95b28ae) **(types)**
  change command/flag title to groupName

  fix #4

- [`58fb3fe`](https://github.com/ydcjeff/komando/commit/58fb3fe) **(types)**
  move types to top + add jsdoc examples

- [`e6a2237`](https://github.com/ydcjeff/komando/commit/e6a2237) change mod.ts
  to mod.js + mod.d.ts

  To publish on both Deno and Node, this is the best way right now

- [`292a80e`](https://github.com/ydcjeff/komando/commit/292a80e) change nargs
  `1` to `'1'`

</details>

## [v0.0.5](https://github.com/ydcjeff/komando/compare/v0.0.4...v0.0.5)

_2022-01-19_

## [v0.0.4](https://github.com/ydcjeff/komando/compare/v0.0.3...v0.0.4)

_2022-01-19_

## [v0.0.3](https://github.com/ydcjeff/komando/compare/v0.0.2...v0.0.3)

_2022-01-19_

## [v0.0.2](https://github.com/ydcjeff/komando/compare/7ae9129...v0.0.2)

_2022-01-19_
