import { defineConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const blocklyMedia = resolve('node_modules/blockly/media');

export default defineConfig({
  base: './',
  server: { host: true },
  plugins: [{
    name: 'local-blockly-media',
    configureServer(server) {
      server.middlewares.use('/blockly-media', (request, response, next) => {
        const name = (request.url ?? '').split('?')[0].slice(1);
        if (!/^[\w.-]+$/.test(name) || !readdirSync(blocklyMedia).includes(name)) return next();
        response.setHeader('Content-Type', name.endsWith('.svg') ? 'image/svg+xml' : name.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream');
        response.end(readFileSync(resolve(blocklyMedia, name)));
      });
    },
    generateBundle() {
      for (const name of readdirSync(blocklyMedia)) this.emitFile({ type: 'asset', fileName: `blockly-media/${name}`, source: readFileSync(resolve(blocklyMedia, name)) });
    },
  }],
});
