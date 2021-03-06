const HotModuleReplacementPlugin = require('webpack').HotModuleReplacementPlugin
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          hotReload: true,
        },
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      nodes: path.resolve(__dirname, './src/nodes'),
      components: path.resolve(__dirname, './src/components'),
      modules: path.resolve(__dirname, './src/modules'),
      test: path.resolve(__dirname, './src/test'),
      backendApi: path.resolve(__dirname, './src/backendApi'),
      root: path.resolve(__dirname),
    },
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    contentBase: [
      path.resolve('static/'),
      path.resolve('./node_modules/auth0-js/build/'),
    ],
    proxy: {
      '/api': 'http://localhost:8088',
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new HotModuleReplacementPlugin(),
  ],
}
