import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
});
