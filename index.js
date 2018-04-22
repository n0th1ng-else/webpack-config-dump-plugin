const fs = require('fs');
const util = require('util');
const _ = require('lodash');

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
                console.log('Could not create cache folder:', err);
                return;
            }
        }
        const dump = util.inspect(this.simplifyConfig(config, this.depth), { depth: this.depth });
        try {
            fs.writeFileSync(`${this.outputPath}/${this.name}`, `module.exports = () => (${dump})`);
        } catch (err) {
            console.log('Could not create dump file:', err);
        }
    }

    simplifyConfig(cfg, depth = 4) {
        return this._simplifyLevel(cfg, 0, depth);
    }

    _simplifyLevel(subCfg, currentDepth = 0, depth = 2) {
        if (currentDepth === depth) {
            return;
        }

        if (_.isFunction(subCfg)) {
            return;
        }

        if (_.isArray(subCfg)) {
            const formattedLevel = _.transform(
                subCfg,
                (result, item) => {
                    const value = this._simplifyLevel(item, currentDepth + 1, depth);
                    if (value) {
                        result.push(value);
                    }
                },
                []
            );
            return !_.isEmpty(formattedLevel) ? formattedLevel : undefined;
        }

        if (_.isObject(subCfg)) {
            return _.transform(
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
