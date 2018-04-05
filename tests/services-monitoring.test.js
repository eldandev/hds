const ServicesMonitoring = require('../services-monitoring')
const ServiceGatway = require('../service-gateway')
jest.mock('../service-gateway');
jest.useFakeTimers()

describe('When ok statuses are returned', () => {
  beforeAll(() => {
    ServiceGatway.mockImplementation(() => {
      return {
        fetchStatus: (withStatus) => withStatus("ok"),
      }
    })
  })

  it('normalizes status and formats the result', async () => {
    const monitoring = new ServicesMonitoring();
    return monitoring.fetchStatusFromAllServices().then(statuses => {
      statuses.forEach(status =>
        expect(status).toEqual({ name: undefined, environment: undefined, status: "good" })
      )
    })
  })
})

describe('When bad statuses are returned', () => {
  beforeAll(() => {
    ServiceGatway.mockImplementation(() => {
      return {
        fetchStatus: (withStatus) => withStatus("funky"),
      }
    })
  })

  it('normalizes status and formats the result', async () => {
    const monitoring = new ServicesMonitoring()
    return monitoring.fetchStatusFromAllServices().then(statuses => {
      statuses.forEach(status =>
        expect(status).toEqual({ name: undefined, environment: undefined, status: "bad" })
      )
    })
  })
})

describe('getAverageAvailability', () => {
  it('returns nothing when no data was yet collected', () => {
    const monitoring = new ServicesMonitoring()
    expect(monitoring.getAverageAvailability()).toEqual([])
  })

  it('returns average time available', () => {
    const monitoring = new ServicesMonitoring()

    for (let i = 0; i < 6; i++)
      monitoring.updateAvailability({name: "bim360-dm", environment: "dev", status: "good"})

    for (let i = 0; i < 4; i++)
      monitoring.updateAvailability({name: "bim360-dm", environment: "dev", status: "bad"})

    expect(monitoring.getAverageAvailability()).toEqual(
      [{name: "bim360-dm", environment: "dev", availability: "60%"}]
    )
  })
})

describe('startMonitoringAvailability', () => {
  let monitoring

  beforeAll(() => {
    ServiceGatway.mockImplementation(() => {
      return {
        fetchStatus: (withStatus) => withStatus("good"),
        name: "bim360-dm",
        environment: "dev"
      }
    })

    monitoring = new ServicesMonitoring()
    monitoring.startMonitoringAvailability()

    const minute = 60 * 1000
    jest.advanceTimersByTime(minute)
  })

  afterAll(() => jest.clearAllTimers())

  it("updates availability every minute", async () => {
    expect(monitoring.getAverageAvailability()).toEqual(
      [{name: "bim360-dm", environment: "dev", availability: "100%"}]
    )
  })
})