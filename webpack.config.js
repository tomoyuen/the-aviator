const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: './src/main.js',
  output: {
    path: resolve('dist'),
    filename: `[name]${devMode ? '' : '.[hash]'}.js`,
    publicPath: '.',
  },
  resolve: {
    extensions: ['.js'],
    modules: [
      resolve('src'),
      resolve('node_modules'),
    ],
  },
  resolveLoader: {
    moduleExtensions: ['-loader'],
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 200000,
    maxEntrypointSize: 400000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['eslint'],
        include: path.resolve(__dirname, './src/'),
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: ['babel'],
        include: path.resolve(__dirname, './src'),
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ],
  devtool: devMode ? 'cheap-module-eval-source-map' : false,
  target: 'web',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    quiet: true,
    port: process.env.PORT || 8080,
  },
};
