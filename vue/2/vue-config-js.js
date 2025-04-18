module.exports = {
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        stream: false,
        fs: false,
        path: false,
        crypto: false
      }
    }
  }
}