const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  devServer: {
    port: 3000,
    open: true,
    // 配置跨域
    proxy: {},
  },
  transpileDependencies: true,
});
