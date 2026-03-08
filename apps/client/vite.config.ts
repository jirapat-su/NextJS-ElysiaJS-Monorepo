import { resolve } from 'node:path';
import { nitro } from 'nitro/vite';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const envVars = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, envVars);

  return {
    plugins: [
      nitro({
        preset: 'bun',
        output: {
          dir: './dist',
          serverDir: './dist/server',
          publicDir: './dist/public',
        },
        vercel: {
          functions: {
            runtime: 'bun1.x',
          },
        },
      }),
      vinext({}),
    ],
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
        '@repo/shadcn/*': resolve(__dirname, '../../packages/shadcn/*'),
      },
    },
  };
});
