import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact()],
    build: {
      chunkSizeWarningLimit: 500, // Reasonable limit for 3D apps
      rollupOptions: {
        output: {
          // Prepare for future chunk splitting when implementing dynamic imports
          manualChunks: {
            // Ready for when we implement dynamic imports
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', 'troika-three-text'],
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['@tanstack/react-router'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
          // Organize chunks by size and loading priority
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId?.includes('three')) {
              return 'assets/3d-[name]-[hash].js';
            }
            if (facadeModuleId?.includes('life-notes')) {
              return 'assets/notes-[name]-[hash].js';
            }
            if (facadeModuleId?.includes('auth')) {
              return 'assets/auth-[name]-[hash].js';
            }
            return 'assets/[name]-[hash].js';
          }
        }
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ['./src/test-setup.ts'],
      css: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    // Expose env variables to the client
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  }
}); 