// @ts-check
// [Bat](https://github.com/sharkdp/bat) created with Komando

import { defineCommand, komando } from '../mod.js';
// import { defineCommand, komando } from 'https://deno.land/x/komando/mod.js'; // with deno, uncomment this
// import { defineCommand, komando } from 'komando'; // with node, uncomment this

komando({
	name: 'bat',
	description:
		'bat 0.15.0\n    A cat(1) clone with syntax highlighting and Git integration.',
	usage: 'bat [OPTIONS] [FILE]...\n    bat <SUBCOMMAND>',
	commands: [
		defineCommand({
			name: 'cache',
			flags: {
				build: {
					typeFn: Boolean,
					short: 'b',
					description: 'Initialize (or update) the syntax/theme cache.',
				},
				clear: {
					typeFn: Boolean,
					short: 'c',
					description: 'Remove the cached syntax definitions and themes.',
				},
				source: {
					typeFn: String,
					description:
						'Use a different directory to load syntaxes and themes from.',
					placeholder: 'dir',
				},
				target: {
					typeFn: String,
					description:
						'Use a different directory to load syntaxes and themes from.',
					placeholder: 'dir',
				},
				blank: {
					typeFn: Boolean,
					description:
						'Create completely new syntax and theme sets (instead of appending to the default sets).',
				},
			},
			run(args, flags) {
				console.log('Arguments: ', args);
				console.log('Flags: ', flags);
			},
		}),
	],
	flags: {
		showAll: {
			typeFn: Boolean,
			short: 'A',
			description: 'Show non-printable characters (space, tab, newline, ..).',
		},
		plain: {
			typeFn: Boolean,
			short: 'p',
			description: 'Show plain style (alias for \'--style=plain\').',
		},
		language: {
			typeFn: String,
			short: 'l',
			description: 'Set the language for syntax highlighting.',
		},
		highlightLine: {
			typeFn: [String],
			short: 'H',
			description: 'Highlight lines N through M.',
			placeholder: 'N:M',
		},
		fileName: {
			typeFn: [String],
			description: 'Specify the name to display for a file.',
			placeholder: 'name',
		},
		diff: {
			typeFn: Boolean,
			short: 'd',
			description: 'Only show lines that have been added/removed/modified.',
		},
		tabs: {
			typeFn: Number,
			description: 'Set the tab width to T spaces.',
			placeholder: 'T',
		},
		wrap: {
			typeFn: choice(['auto', 'never', 'character']),
			description: 'Specify the text-wrapping mode (*auto*, never, character).',
			placeholder: 'mode',
			defaultV: 'auto',
		},
		number: {
			typeFn: Boolean,
			short: 'n',
			description: 'Show line numbers (alias for \'--style=numbers\').',
		},
		color: {
			typeFn: choice(['auto', 'never', 'always']),
			description: 'When to use colors (*auto*, never, always).',
			placeholder: 'when',
			defaultV: 'auto',
		},
		italicText: {
			typeFn: choice(['always', 'never']),
			description: 'Use italics in output (always, *never*)',
			placeholder: 'when',
			defaultV: 'never',
		},
		decorations: {
			typeFn: choice(['auto', 'never', 'always']),
			description: 'When to show the decorations (*auto*, never, always).',
			placeholder: 'when',
			defaultV: 'auto',
		},
		paging: {
			typeFn: choice(['auto', 'never', 'always']),
			description: 'Specify when to use the pager (*auto*, never, always).',
			placeholder: 'when',
			defaultV: 'auto',
		},
		mapSyntax: {
			typeFn: [String],
			short: 'm',
			description:
				'Use the specified syntax for files matching the glob pattern (\'*.cpp:C++\').',
			placeholder: 'glob:syntax',
		},
		theme: {
			typeFn: String,
			description: 'Set the color theme for syntax highlighting.',
			placeholder: 'theme',
		},
		listThemes: {
			typeFn: Boolean,
			description: 'Display all supported highlighting themes.',
		},
		style: {
			typeFn: choice([
				'auto',
				'full',
				'plain',
				'changes',
				'header',
				'grid',
				'numbers',
				'snip',
			]),
			description:
				'Comma-separated list of style elements to display (*auto*, full, plain, changes, header, grid, numbers, snip).',
			placeholder: 'components',
			defaultV: 'auto',
		},
		lineRange: {
			typeFn: [String],
			short: 'r',
			description: 'Only print the lines from N to M.',
			placeholder: 'N:M',
		},
		listLanguages: {
			typeFn: Boolean,
			short: 'L',
			description: 'Display all supported languages.',
		},
	},
	args: {
		file: {
			nargs: '+',
			description:
				'File(s) to print / concatenate. Use \'-\' for standard input.',
		},
	},
	run(args, flags) {
		console.log('Arguments: ', args);
		console.log('Flags: ', flags);
	},
});

/**
 * @param {string[]} choices
 * @returns (value: string) => string
 */
function choice(choices) {
	/** @param {string} value */
	return (value) => {
		if (!choices.includes(value)) {
			throw new Error(`Invalid choice. Choose from ${choices.join(',')}`);
		}
		return value;
	};
}
