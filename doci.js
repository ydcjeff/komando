import { defineCommand, komando } from './mod.js';

export const buildCommand = defineCommand({
  name: 'build',
});

export const pipelineCommand = defineCommand({
  name: 'pipeline',
  commands: [
    buildCommand,
  ],
});

komando({
  name: 'doci',
  version: '0.1.0',
  commands: [
    pipelineCommand,
  ],
});
