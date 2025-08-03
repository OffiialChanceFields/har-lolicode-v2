import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    hmr: {
      protocol: 'wss',
      host: `${process.env.GITPOD_WORKSPACE_ID || process.env.GOOGLE_CLOUD_WORKSTATION_ID || 'localhost'}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST || '9000.googleworkstations.dev'}`,
      clientPort: 443
    }
  }
})
