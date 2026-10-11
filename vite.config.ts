/// <reference types="vitest" />
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAssistant } from './server/assistant';

/** Serves /api/assistant from `npm run dev` and `npm run preview`, the way Vercel does in production. */
function assistantApi(): Plugin {
  const mount = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/api/assistant', (req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', async () => {
        const method = req.method ?? 'GET';
        const request = new Request('http://localhost/api/assistant', {
          method,
          headers: { 'content-type': String(req.headers['content-type'] ?? 'application/json') },
          body: method === 'POST' ? Buffer.concat(chunks).toString('utf8') : undefined,
        });
        const response = await handleAssistant(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      });
    });
  };
  return { name: 'across-assistant-api', configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  // Read ANTHROPIC_API_KEY from .env.local for the dev server. It stays server-side: Vite only
  // exposes VITE_-prefixed variables to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), assistantApi()],
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    },
  };
});
