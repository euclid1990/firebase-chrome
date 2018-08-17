const path = require('path');
const dotenv = require('dotenv').config(); /* eslint-disable-line no-unused-vars */
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const devMode = env('NODE_ENV') !== 'production';
const srcPath = env('SOURCE_PATH', 'src');
const buildPath = env('BUILD_PATH', 'build');

// Get environment variable function
function env(e, d = '') {
  if (typeof process.env[e] === 'undefined' || process.env[e] === '') return d;
  return process.env[e];
}

module.exports = () => {
  return {
    mode: env('NODE_ENV', 'development'),
    target: 'web',
    entry: {
      popup: path.join(__dirname, `${srcPath}/scripts/popup.js`),
      options: path.join(__dirname, `${srcPath}/scripts/options.js`),
      background: path.join(__dirname, `${srcPath}/scripts/background.js`)
    },
    output: {
      filename: devMode ? 'js/[name].js' : 'js/[name].[hash].js',
      path: path.resolve(__dirname, buildPath)
    },
    devtool: devMode ? 'inline-source-map' : false,
    module: {
      rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader'
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.scss$/,
        use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/'
          }
        }]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            name: 'vendors',
            minChunks: 1,
            minSize: 1000,
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all'
          }
        }
      }
    },
    plugins: [
      new CleanWebpackPlugin([path.resolve(__dirname, `${buildPath}`)]),
      new MiniCssExtractPlugin({ filename: devMode ? 'css/[name].css' : 'css/[name].[hash].css' }),
      new CopyWebpackPlugin([
        { from: `images`, to: `img` },
        { from: `manifest.json`, to: `manifest.json` }
      ], { context: srcPath }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `${srcPath}/popup.html`),
        filename: 'popup.html',
        chunks: ['popup', 'vendors']
      }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `${srcPath}/options.html`),
        filename: 'options.html',
        chunks: ['options', 'vendors']
      }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `${srcPath}/background.html`),
        filename: 'background.html',
        chunks: ['background', 'vendors']
      })
    ]
  };
};
