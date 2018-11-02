/*global path, __dirname, module, process */
'use strict';

const path = require('path');
const minimist = require('minimist');
const _ = require('lodash');
const config = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/backbone.browserStorage.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'backbone.browserStorage.js'
    },
    resolve: {
        alias: {
        '../utils': path.resolve('node_modules/localforage/src/utils')
        }
    },
    externals: {
        backbone: {
            amd: 'backbone',
            commonjs: 'backbone',
            commonjs2: 'backbone',
            root: 'Backbone'
        },
        lodash: {
            amd: 'lodash',
            commonjs: 'lodash',
            commonjs2: 'lodash',
            root: '_'
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /(node_modules|test)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ["@babel/preset-env", {
                                "targets": {
                                    "browsers": [">1%", "not ie 11", "not op_mini all"]
                                }
                            }]
                        ]
                    }
                }
            }]
        }
    }
}

function parameterize () {
    const mode = minimist(process.argv.slice(2)).mode;
    if (mode === 'production') {
        console.log("Making a production build");
        const fn = config.output.filename;
        config.output.filename = `${fn.replace(/\.js$/, '')}.min.js`;
    }
}

parameterize();

module.exports = config;
