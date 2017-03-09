var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  entry: './src/main.js',
  output: {
    path: resolve('dist'),
    filename: '[name].js',
    publicPath: 'dist',
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
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    quiet: true,
    port: process.env.PORT || 8080,
  },
  devtool: '#cheap-module-eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ]);
}
