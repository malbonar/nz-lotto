const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/scripts/index.js', 
        addresult: './src/scripts/add-result.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist/scripts'),
        filename: '[name]-bundle.js'
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { 
                    context: path.resolve(__dirname, 'src'), 
                    from: 'styles/**/**',
                    to: path.resolve(__dirname, 'dist')
                },
                { 
                    context: path.resolve(__dirname, 'src'),
                    from: '*.html', 
                    to: path.resolve(__dirname, 'dist')
                },
                {
                    context: path.resolve(__dirname, 'src'),
                    from: 'img/**/**',
                    to: path.resolve(__dirname, 'dist')
                }
            ],
        }),
    ],
    externals: ({context, request}, callback) => {
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
    },
    /*
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            }
        ]
    },*/
    watch: true
}
