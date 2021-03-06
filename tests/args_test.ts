import { komando } from '../mod.js';
import { assertEquals, assertThrows } from '../deps_test.ts';

const { test } = Deno;
const name = import.meta.url;

test('? nargs with', async (tc) => {
	await tc.step('0 argv', () => {
		komando({
			name,
			args: {
				argA: {
					nargs: '?',
				},
				argB: {
					nargs: '?',
				},
			},
			run(args) {
				assertEquals(args.argA, undefined);
				assertEquals(args.argB, undefined);
			},
		}, []);
	}),
		await tc.step('1 argv', () => {
			komando({
				name,
				args: {
					argA: {
						nargs: '?',
					},
					argB: {
						nargs: '?',
					},
				},
				run(args) {
					assertEquals(args.argA, 'abc');
					assertEquals(args.argB, undefined);
				},
			}, ['abc']);
		});

	await tc.step('3 argv', () => {
		komando({
			name,
			args: {
				argA: {
					nargs: '?',
				},
				argB: {
					nargs: '?',
				},
			},
			run(args) {
				assertEquals(args.argA, 'abc');
				assertEquals(args.argB, 'def');
			},
		}, ['abc', 'def', 'ghi']);
	});
});

test('* nargs with', async (tc) => {
	await tc.step('0 argv', () => {
		komando({
			name,
			args: {
				argA: {
					nargs: '*',
				},
				argB: {
					nargs: '*',
				},
			},
			run(args) {
				assertEquals(args.argA, []);
				assertEquals(args.argB, undefined);
			},
		}, []);
	}),
		await tc.step('1 argv', () => {
			komando({
				name,
				args: {
					argA: {
						nargs: '*',
					},
					argB: {
						nargs: '*',
					},
				},
				run(args) {
					assertEquals(args.argA, ['abc']);
					assertEquals(args.argB, undefined);
				},
			}, ['abc']);
		});

	await tc.step('2 argv', () => {
		komando({
			name,
			args: {
				argA: {
					nargs: '*',
				},
				argB: {
					nargs: '*',
				},
			},
			run(args) {
				assertEquals(args.argA, ['abc', 'def']);
				assertEquals(args.argB, undefined);
			},
		}, ['abc', 'def']);
	});
});

test('+ nargs with', async (tc) => {
	await tc.step('0 argv', () => {
		assertThrows(
			() => {
				komando({
					name,
					args: {
						argA: {
							nargs: '?',
						},
						argB: {
							nargs: '+',
						},
					},
					run() {},
				}, []);
			},
			Error,
			'Argument "argB" expected at least one argument',
		);
	}),
		await tc.step('1 argv', () => {
			komando({
				name,
				args: {
					argA: {
						nargs: '+',
					},
					argB: {
						nargs: '+',
					},
				},
				run(args) {
					assertEquals(args.argA, ['abc']);
					assertEquals(args.argB, undefined);
				},
			}, ['abc']);
		});

	await tc.step('2 argv', () => {
		komando({
			name,
			args: {
				argA: {
					nargs: '+',
				},
				argB: {
					nargs: '+',
				},
			},
			run(args) {
				assertEquals(args.argA, ['abc', 'def']);
				assertEquals(args.argB, undefined);
			},
		}, ['abc', 'def']);
	});
});

test('1 nargs with', async (tc) => {
	await tc.step('0 argv', () => {
		assertThrows(
			() => {
				komando({
					name,
					args: {
						argA: {
							nargs: '?',
						},
						argB: {
							nargs: '1',
						},
					},
					run() {},
				}, []);
			},
			Error,
			'Argument "argB" expected 1 argument',
		);
	}),
		await tc.step('3 argv', () => {
			komando({
				name,
				args: {
					argA: {
						nargs: '1',
					},
					argB: {
						nargs: '1',
					},
				},
				run(args) {
					assertEquals(args.argA, 'abc');
					assertEquals(args.argB, 'def');
				},
			}, ['abc', 'def', 'ghi']);
		});
});

test('args double dash', () => {
	komando({
		name,
		flags: { open: { typeFn: Boolean } },
		args: { argA: { nargs: '?' } },
		run(args) {
			assertEquals(args.argA, 'root');
			assertEquals(args['--'], ['path', '--close', '-a']);
		},
	}, ['--open', 'root', '--', 'path', '--close', '-a']);
});
