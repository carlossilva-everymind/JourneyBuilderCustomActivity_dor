const { BaseService } = require('simple-node-framework').Base

class Apm extends BaseService {
  constructor() {
    super({
      module: 'APM Service'
    })

    this.elasticApm = this.start()
  }

  start() {
    const serviceName = `${process.env.K8S_APP_NAME}-${process.env.NODE_ENV}`
    const secretToken = process.env.APM_TOKEN
    const serverUrl = process.env.APM_URL
    const active = process.env.NODE_ENV === 'production'
    const environment = process.env.NODE_ENV

    if (active) {
      this.log.debug(`Instanciando o APM [${serviceName}]`)
    }

    // eslint-disable-next-line
    return require('elastic-apm-node').start({
      serviceName,
      secretToken,
      serverUrl,
      active,
      environment
    })
  }
}

const apm = new Apm()

module.exports = apm.elasticApm
