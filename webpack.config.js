const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/scripts/index.js', 
        addresult: './src/scripts/add-result.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true
    },
    optimization: {
        concatenateModules: false,
        splitChunks: {
            chunks: 'all'
        }
    },
    devServer: {
        static: './dist'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            chunks: ['index'], // only include the index js script file in the html output file
            filename: 'index.html',
            inject: true // indicates where in the html file to add the injected js file 
        }),
        new HtmlWebpackPlugin({
            template: './src/add-result.html',
            chunks: ['addresult'],
            filename: 'add-result.html',
            inject: true
        }),
        new CopyPlugin({
            patterns: [
            {
                context: path.resolve(__dirname, 'src'),
                from: 'img/**/**',
                to: path.resolve(__dirname, 'dist')
            }],
        }),
        //new BundleAnalyzerPlugin({ }) // shows the analysis pages of dependencies in bundles
        new CssExtractPlugin(), // webpack will generate separate CSS bundle files rather than embed in html files
    ],
    module: {
        rules: [{
            test: /\.css$/,
            use: [
                { loader: CssExtractPlugin.loader },
                { loader: 'css-loader' }
            ]
        }]
    },
}


    /*externals: ({context, request}, callback) => {
        // Don't copy the secrets config file object         
        if (request === './firebase-config.json') {
            fs.stat(path.join(context, request), (err, stat) => {
                // We check if that file secrets file exists in the filesystem. If not, 
                // we "mock" it out with an empty object.
                if (err) {
                    return callback(null, '{}');
                }
                callback();
            });
        } else {
            callback();
        }
    },*/
