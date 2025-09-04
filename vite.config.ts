import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   server: {
    host: true, // ya "0.0.0.0" - public access ke liye
    port: 5173, // aapka dev port
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '5ab1039ff2c6.ngrok-free.app', // <-- yahan ngrok URL add karein
    ],
  },
});
