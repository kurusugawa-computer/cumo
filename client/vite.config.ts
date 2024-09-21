import * as vite from 'vite';
import path from 'path';
import { ViteMinifyPlugin } from 'vite-plugin-minify'; // for html

export default vite.defineConfig(({ command, mode }) => {
  console.log(`building with command '${command}' and mode '${mode}' ...`);
  return {
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src/')
      }
    },
    build: {
      minify: mode === 'production',
      rollupOptions: {
        input: {
          bundle: path.resolve(__dirname, 'index.html')
        },
        output: {
          entryFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]'
        }
      },
      outDir: 'public'
    },
    publicDir: '',
    plugins: [
      ViteMinifyPlugin({})
    ],
    server: {
      host: '0.0.0.0',
      open: true
    }
  };
});
