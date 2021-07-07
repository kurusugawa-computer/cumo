const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const outputpath = path.resolve(__dirname, 'public');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: `${outputpath}`
  },
  module: {
    rules: [
      {
        test: /\.d\.ts/,
        use: 'ignore-loader',
        exclude: '/node_modules/'
      },
      {
        test: /\.ts/,
        use: 'ts-loader',
        exclude: /node_modules|\.d\.ts/
      },
      {
        test: /\.css/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
        exclude: '/node_modules/'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.css']
  },
  devServer: {
    contentBase: `${outputpath}/`,
    open: true,
    hot: true,
    watchContentBase: true
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new MiniCssExtractPlugin()
  ]
};
