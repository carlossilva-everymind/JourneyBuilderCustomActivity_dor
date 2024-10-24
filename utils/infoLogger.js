const bunyan = require("bunyan");
class InfoLogger {
    constructor(module) {
        this.log = bunyan.createLogger({
            name: module,
            debug: true,
            bunyan: {
                name: 'Application',
                streams: [
                    {
                        level: 'debug',
                        stream: 'process.stdout'
                    }
                ]
            }
        });
    }
}
module.exports = InfoLogger;