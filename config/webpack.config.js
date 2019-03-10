// import path from 'path'
// import CleanWebpackPlugin from 'clean-webpack-plugin'
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  target: 'electron-renderer',
  mode: 'development',
  entry: './src/render/vueRenderer.js',
  output: {
    filename: 'renderer.js',
    path: path.resolve('../dist'),
    publicPath: '/',
  },
  module: {},
  devtool: 'inline-source-maps',
  devServer: {
    contentBase: path.resolve('./src/render/public'),
  },
  plugins: [new CleanWebpackPlugin()],
}
