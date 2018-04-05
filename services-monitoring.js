const axios          = require('axios')
const ServiceGateway = require('./service-gateway')
const parseXMLString = require('xml2js').parseString

const minute = 60 * 1000

module.exports = class ServicesMonitoring {
  constructor() {
    let extractStatusFromJsonResponse = (res) => res.data.status.overall
    let extractStatusFromXMLResposne  = (res) => {
      let status;
      parseXMLString(
        res.data,
        (error, data) => status = data.HealthCheck.status[0]
      )

      return status
    }

    this.services = this.createServiceGateways(extractStatusFromJsonResponse, extractStatusFromXMLResposne)
    this.availability = this.createServiceToAvailabilityMapping();

    this.fetchStatusFromAllServices  = this.fetchStatusFromAllServices.bind(this)
    this.startMonitoringAvailability = this.startMonitoringAvailability.bind(this)
    this.updateAvailability          = this.updateAvailability.bind(this)
    this.getAverageAvailability      = this.getAverageAvailability.bind(this)
  }

  createServiceToAvailabilityMapping() {
    return {
      dev: { "bim360-dm": [], "Command Processor": [], "eventing": []},
      staging: { "bim360-dm": [], "360": []}
    }
  }

  createServiceGateways(extractStatusFromJsonResponse, extractStatusFromXMLResposne) {
    return [
      new ServiceGateway({
        name:          "bim360-dm",
        environment:   "dev",
        url:           "https://bim360dm-dev.autodesk.com/health?self=true",
        extractStatus: extractStatusFromJsonResponse
      }),
      new ServiceGateway({
        name:          "Command Processor",
        environment:   "dev",
        url:           "https://commands.bim360dm-dev.autodesk.com/health",
        extractStatus: extractStatusFromJsonResponse
      }),
      new ServiceGateway({
        name:          "bim360-dm",
        environment:   "staging",
        url:           "https://bim360dm-staging.autodesk.com/health?self=true",
        extractStatus: extractStatusFromJsonResponse
      }),
      new ServiceGateway({
        name:          "360",
        environment:   "staging",
        url:           "https://360-staging.autodesk.com/health",
        extractStatus: extractStatusFromXMLResposne
      }),
      new ServiceGateway({
        name:          "eventing",
        environment:   "dev",
        url:           "https://eventing-dev.api.autodesk.com/hds",
        extractStatus: extractStatusFromJsonResponse
      }),
    ]
  }

  async fetchStatusFromAllServices() {
    let servicesStatuses = []
    let statusPromises   = []
    this.services.forEach(item => {
      let promise = item.fetchStatus(status =>
        servicesStatuses.push({ name: item.name, environment: item.environment, status: this.normalizeStatus(status)})
      )
      statusPromises.push(promise)
    })

    await Promise.all(statusPromises)

    return servicesStatuses
  }

  normalizeStatus(status) {
    status = status.toLowerCase()
    if (status == "ok")   status = "good"
    if (status != "good") status = "bad"

    return status
  }

  startMonitoringAvailability() {
    setInterval(async () => {
      let statuses = await this.fetchStatusFromAllServices()
      statuses.forEach(this.updateAvailability)
    }, minute)
  }

  updateAvailability(service) {
    let value = service.status == "good" ? 1 : 0
    let availabilityArray = this.availability[service.environment][service.name]
    availabilityArray.push(value)

    if (availabilityArray.length > 60)
      availabilityArray.shift()
  }

  getAverageAvailability() {
    let availability = []

    Object.keys(this.availability).forEach(env =>
      Object.keys(this.availability[env]).forEach(serviceName => {
        let availabilityArray = this.availability[env][serviceName]
        if (availabilityArray.length == 0) return
        let percentage = this.calculateAvailabilityPercentage(availabilityArray)
        let result = { name: serviceName, environment: env, availability: percentage}

        availability.push(result)
      })
    )

    return availability
  }

  calculateAvailabilityPercentage(availabilityArray) {
    let minutesAvailable = availabilityArray.reduce((a, b) => a + b)
    let average = minutesAvailable / availabilityArray.length

    return average * 100 + "%"
  }
}