import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BASE_PATH = process.env.VITE_BASE_PATH ?? '/aplus-prep/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss()],
});
