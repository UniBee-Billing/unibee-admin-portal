import { isEmpty } from '../../src/utils/is'

describe('Is utils test suite', () => {
  it("Should return true if it's undefined or null", () => {
    expect(isEmpty(undefined)).toBeTruthy()
    expect(isEmpty(null)).toBeTruthy()
  })
})
