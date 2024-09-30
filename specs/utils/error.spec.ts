import { panic, safe } from '../../src/utils'

describe('Error handling test suite', () => {
  it('should return [value, null] when no error is thrown', async () => {
    const result = safe(() => 1)()

    expect(result).toEqual([1, null])
  })

  it('should return [null, Error] when an error is thrown', async () => {
    const result = safe(() => {
      throw new Error('Something went wrong')
    })()

    expect(result).toEqual([null, new Error('Something went wrong')])
  })

  it('should return [value, null] when no error is thrown in async function', async () => {
    const result = safe(async () => 1)()

    expect(await result).toEqual([1, null])
  })

  it('should return [null, Error] when an error is thrown in async function', async () => {
    const result = safe(async () => {
      throw new Error('Something went wrong')
    })()

    expect(await result).toEqual([null, new Error('Something went wrong')])
  })

  it('should return [value, null] when no error is thrown with a promise', async () => {
    const result = safe(() => Promise.resolve(1))()

    expect(await result).toEqual([1, null])
  })

  it('should return [null, Error] when an error is thrown with a promise', async () => {
    const result = safe(() =>
      Promise.reject(new Error('Something went wrong'))
    )()

    expect(await result).toEqual([null, new Error('Something went wrong')])
  })

  it('should return [value, null] when no error is thrown with a resolved promise', async () => {
    const result = safe(async () => Promise.resolve(1))()

    expect(await result).toEqual([1, null])
  })

  it('should return [null, Error] when an error is thrown with a rejected promise', async () => {
    const result = safe(async () =>
      Promise.reject(new Error('Something went wrong'))
    )()

    expect(await result).toEqual([null, new Error('Something went wrong')])
  })
  it('should not catch an error when panic is called with a string', () => {
    expect(() => {
      safe(() => panic('Something went wrong'))()
    }).toThrow('Something went wrong')
  })

  it('should not catch an error when panic is called with a string that does not throw an error', () => {
    expect(() => {
      safe(() => panic('1'))()
    }).toThrow('1')
  })

  it('should not catch an error when panic is called with an asynchronous string that throws an error', async () => {
    await expect(async () => {
      await safe(async () => panic('Something went wrong'))()
    }).rejects.toThrow('Something went wrong')
  })

  it('should not catch an error when panic is called with an asynchronous string that does not throw an error', async () => {
    await expect(async () => {
      await safe(async () => panic('1'))()
    }).rejects.toThrow('1')
  })

  it('should not catch an error when panic is called with a promise that rejects', async () => {
    await expect(async () => {
      await safe(async () => panic('Something went wrong'))()
    }).rejects.toThrow('Something went wrong')
  })

  it('should not catch an error when panic is called with a promise that resolves', async () => {
    await expect(async () => {
      await safe(async () => panic('1'))()
    }).rejects.toThrow('1')
  })
})
