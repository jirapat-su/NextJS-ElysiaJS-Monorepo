import { resolve } from 'node:path';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const envVars = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, envVars);

  return {
    plugins: [vinext({})],
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
        '@repo/shadcn/*': resolve(__dirname, '../../packages/shadcn/*'),
      },
    },
  };
});
