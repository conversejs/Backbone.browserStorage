/*global path, __dirname, module, process */
'use strict';

const path = require('path');
const _ = require('lodash');

const config = {
    entry: path.resolve(__dirname, 'backbone.browserStorage.js'),
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

module.exports = config;
