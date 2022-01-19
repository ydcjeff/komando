// @ts-check

// create dist
Deno.mkdirSync('./dist');

// bundle
const p = Deno.run({
  cmd: 'deno bundle --unstable mod.js ./dist/index.js'.split(' '),
  stderr: 'inherit',
  stdout: 'inherit',
});

const status = await p.status();

if (status.success) {
  // replace Deno with process
  const decoder = new TextDecoder('utf-8');
  let code = decoder.decode(Deno.readFileSync('./dist/index.js'));
  code = code.replace(/Deno\.exit\(1\)/g, 'process.exit(1)');
  code = code.replace(/Deno\.args/g, 'process.argv.slice(2)');
  code = code.replace(
    /const {\s* columns\s* } = Deno\.consoleSize\(Deno\.stdout\.rid\)/g,
    'const columns = process.stdout.columns',
  );
  const encoder = new TextEncoder();
  Deno.writeFileSync('./dist/index.js', encoder.encode(code));

  // update readme
  Deno.writeFileSync(
    'README.md',
    encoder.encode(
      '# Komando\n\n> Type safe CLI devtool for Deno and Node\n\n[View on GitHub](https://github.com/ydcjeff/komando)',
    ),
  );

  // create package.json
  const pkgJSON = {
    name: 'komando',
    version: Deno.env.get('GITHUB_REF')?.replace('v', '') || '0.0.0',
    type: 'module',
    types: './dist/mod.d.ts',
    exports: './dist/index.js',
    files: ['dist'],
    author: 'Jeff Yang',
    license: 'MIT',
    keywords: ['cli', 'argv', 'komando'],
    engines: { 'node': '>=14.18' },
  };
  Deno.writeFileSync('./package.json', encoder.encode(JSON.stringify(pkgJSON)));

  // copy type declaration file
  Deno.copyFileSync('./mod.d.ts', './dist/mod.d.ts');

  // update examples
  let example = decoder.decode(Deno.readFileSync('./examples/bat.js'));
  example = example.replace('../mod.js', '../dist/index.js');
  Deno.writeFileSync('./examples/bat.js', encoder.encode(example));
}
