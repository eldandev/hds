const axios = require('axios')

module.exports = class ServiceGateway {
  constructor(options) {
    this.name          = options.name
    this.environment   = options.environment
    this.url           = options.url
    this.extractStatus = options.extractStatus
  }

  fetchStatus(withStatus) {
    return axios.get(this.url).then((res) => {
      let status = res.status == 200 ? this.extractStatus(res) : "bad"
      withStatus(status)
    })
    .catch(error => {
      console.log(error)
      withStatus("bad")
    })
  }
}