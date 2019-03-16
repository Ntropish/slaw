const HotModuleReplacementPlugin = require('webpack').HotModuleReplacementPlugin
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const fs = require('fs-extra')

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
      renderer: path.resolve(__dirname, '../src/renderer'),
      nodes: path.resolve(__dirname, '../src/nodes'),
    },
  },
  devtool: 'inline-source-maps',
  devServer: {
    contentBase: path.resolve('./static/'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new HotModuleReplacementPlugin(),
  ],
}
