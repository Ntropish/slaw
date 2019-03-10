// import path from 'path'
// import CleanWebpackPlugin from 'clean-webpack-plugin'
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  target: 'electron-renderer',
  mode: 'development',
  entry: './src/renderer/renderer.js',
  output: {
    filename: 'renderer.js',
    path: path.resolve('../dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
  resolve: {
    alias: {
      renderer: path.resolve(__dirname, '../src/renderer'),
    },
  },
  devtool: 'inline-source-maps',
  devServer: {
    contentBase: path.resolve('./src/renderer/public'),
  },
  plugins: [new CleanWebpackPlugin(), new VueLoaderPlugin()],
}
