const axios = require('axios')
jest.mock('axios')

const ServiceGateway = require('../service-gateway')

describe("fetchStatus", () => {
  function createServiceGateway() {
    return new ServiceGateway({
      environment: "dev",
      url: "whatever",
      extractStatus: (res) => res.data.status.overall
    });
  }

  function fetchStatusAndAssert(serviceGateway, expectedStatus) {
    let status;
    return serviceGateway.fetchStatus(s => {
      status = s
    }).then(() => expect(status).toBe(expectedStatus))
  }

  test('returns extracted status when response status code is 200', async () => {
    const resp = {data: {status: {overall: 'funky'}}, status: 200}
    axios.get.mockResolvedValue(resp)

    let serviceGateway = createServiceGateway()

    return fetchStatusAndAssert(serviceGateway, "funky");
  })

  test('returns bad when response status code is not 200', async () => {
    const resp = {data: {status: {overall: 'Good'}}, status: 400}
    axios.get.mockResolvedValue(resp)

    let serviceGateway = createServiceGateway()

    return fetchStatusAndAssert(serviceGateway, "bad");
  })

  test('returns bad when an error communicating with a service occurs', async () => {
    axios.get.mockImplementation(() => Promise.reject("test"))

    let serviceGateway = createServiceGateway()

    return fetchStatusAndAssert(serviceGateway, "bad");
  })
})