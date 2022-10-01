const { defineConfig } = require("@vue/cli-service");
// const path = require("path");
// const webpack = require("webpack");

module.exports = defineConfig({
  devServer: {
    port: 3000,
    open: true,
    // 配置跨域
    proxy: {},
  },
  transpileDependencies: true,
});
