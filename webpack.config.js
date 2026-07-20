const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: './src/taskpane.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/taskpane.html',
      filename: 'taskpane.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'manifest.xml', to: 'manifest.xml' },
      ],
    }),
    new webpack.DefinePlugin({
          DEEPSEEK_BASE_URL: JSON.stringify(process.env.DEEPSEEK_BASE_URL || ""),
          NEXT_PUBLIC_AI_MODEL: JSON.stringify(process.env.NEXT_PUBLIC_AI_MODEL || ""),
      DEEPSEEK_API_KEY: JSON.stringify(process.env.DEEPSEEK_API_KEY || ''),
    }),
  ],
  devServer: {
    static: './dist',
    hot: true,
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    host: '0.0.0.0',
    allowedHosts: 'all',
    client: {
      webSocketURL: 'wss://humble-space-disco-pq45g4r6j9qc74vw-3000.app.github.dev/ws',
    },
  },
};