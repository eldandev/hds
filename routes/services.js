const ServicesMonitoring = require('../services-monitoring')
const monitoring         = new ServicesMonitoring()

monitoring.startMonitoringAvailability()

const express = require('express')
const router  = express.Router()

router.get('/status', async function(req, res, next) {
  let responseBody = await monitoring.fetchStatusFromAllServices()
  res.send(responseBody)
})

router.get('/availability', function (req, res) {
  let responseBody = monitoring.getAverageAvailability()
  res.send(responseBody)
})

module.exports = router
