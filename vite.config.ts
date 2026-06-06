import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Dynamically set the base path: 
  // Netlify automatically sets process.env.NETLIFY to 'true'.
  // If building on Netlify, we serve from root ('/'). 
  // Otherwise, fallback to '/csv-quiz/' for GitHub Pages production builds.
  const baseFolder = process.env.NETLIFY === 'true' 
    ? '/' 
    : (mode === 'production' ? '/csv-quiz/' : '/');

  return {
    // Dynamic base path preventing 404 resource errors
    base: baseFolder, 
    
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
