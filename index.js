const fs = require('fs');
const util = require('util');
const isEmpty = require('lodash').isEmpty;
const isFunction = require('lodash').isFunction;
const isArray = require('lodash').isArray;
const isRegExp = require('lodash').isRegExp;
const isObject = require('lodash').isObject;
const transform = require('lodash').transform;
const weblog = require('webpack-log');

const log = weblog({ name: 'wcd' });

module.exports = class WebpackConfigDumpPlugin {
    constructor(options = {}) {
        this.outputPath = options.outputPath ? options.outputPath : './';
        this.name = options.name ? options.name : 'webpack.config.dump';
        this.depth = options.depth ? options.depth : 4;
    }

    apply(compiler) {
        this.dumpConfig(compiler.options);
    }

    dumpConfig(config) {
        if (!fs.existsSync(this.outputPath)) {
            try {
                fs.mkdirSync(this.outputPath);
            } catch (err) {
	            log.warn('Could not create cache folder:', err);
                return;
            }
        }
        const dump = util.inspect(this.simplifyConfig(config, this.depth), { depth: this.depth });
        try {
            fs.writeFileSync(`${this.outputPath}/${this.name}`, `module.exports = () => (${dump})`);
        } catch (err) {
	        log.warn('Could not create dump file:', err);
        }
    }

    simplifyConfig(cfg, depth = 4) {
        return this._simplifyLevel(cfg, 0, depth);
    }

    _simplifyLevel(subCfg, currentDepth = 0, depth = 2) {
        if (currentDepth === depth) {
            return;
        }

        if (isFunction(subCfg)) {
            return;
        }

        if (isArray(subCfg)) {
            const formattedLevel = transform(
                subCfg,
                (result, item) => {
                    const value = this._simplifyLevel(item, currentDepth + 1, depth);
                    if (value) {
                        result.push(value);
                    }
                },
                []
            );
            return !isEmpty(formattedLevel) ? formattedLevel : undefined;
        }

        if (isRegExp(subCfg)) {
            return subCfg;
        }

        if (isObject(subCfg)) {
            return transform(
                subCfg,
                (result, item, key) => {
                    const value = this._simplifyLevel(item, currentDepth + 1, depth);
                    if (value) {
                        result[key] = value;
                    }
                },
                {}
            );
        }

        return subCfg;
    }
};
