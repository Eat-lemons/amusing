import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // 设置开发服务器的端口号
    host: "0.0.0.0", // 监听所有的 IP 地址
  },
});
