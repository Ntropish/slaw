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
    },
  },
  devtool: 'inline-source-maps',
  devServer: {
    contentBase: path.resolve('static/'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new HotModuleReplacementPlugin(),
  ],
}
