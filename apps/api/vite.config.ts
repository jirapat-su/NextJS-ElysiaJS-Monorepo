import path from 'node:path';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist/types',
      include: path.join(process.cwd(), 'src', 'main.ts'),
    }),
    nitro({
      preset: 'bun',
      serverEntry: './src/main.ts',
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
      rollupConfig: {
        external: [
          '@prisma/client',
          '.prisma/client',
          '.prisma/client/default',
          '@prisma/adapter-mariadb',
        ],
      },
    }),
  ],
});
