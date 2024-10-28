import { withBasePath } from '../../src/utils/path'

describe('Path util test suite', () => {
  it('should return the correct path when base path is provided', () => {
    const basePath = '/base'
    const relativePath = 'path/to/file'
    const result = withBasePath(basePath, relativePath)
    expect(result).toBe('/base/path/to/file')
  })

  it('should return the correct path when base path ends with a slash', () => {
    const basePath = '/base/'
    const relativePath = 'path/to/file'
    const result = withBasePath(basePath, relativePath)
    expect(result).toBe('/base/path/to/file')
  })

  it('should return the correct path when relative path starts with a slash', () => {
    const basePath = '/base'
    const relativePath = '/path/to/file'
    const result = withBasePath(basePath, relativePath)
    expect(result).toBe('/base/path/to/file')
  })

  it('should return the correct path when both base path and relative path have slashes', () => {
    const basePath = '/base/'
    const relativePath = '/path/to/file'
    const result = withBasePath(basePath, relativePath)
    expect(result).toBe('/base/path/to/file')
  })

  it('should return the base path when relative path is empty', () => {
    const basePath = '/base'
    const relativePath = ''
    const result = withBasePath(basePath, relativePath)
    expect(result).toBe('/base')
  })
})
