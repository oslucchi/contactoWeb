module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/cantactoWeb/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  devServer: {
    port: 8090,
    open: true,
    historyApiFallback: true,
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src'),
      },
    },
  },
};