const crypto = require('crypto')
const axios = require('axios')
const test = require('ava')

const useSign = require('./dist/index.umd')

/**
 * Mock
 */
console.warn = () => {}

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex')

const mockAdapter = (config) => {
  return new Promise((resolve) => {
    const response = {
      data: config.data,
      status: 200,
      statusText: 'OK',
      headers: config.headers,
      config: config,
      request: null,
    }

    resolve(response)
  })
}

const secret = 'secret'

test('should return original data without secret', async (t) => {
  const request = axios.create({
    adapter: mockAdapter,
  })

  request.interceptors.request.use(useSign())

  const { data } = await request.post('/', {
    a: 1,
  })

  t.is(data.a, 1)
  t.is(Object.keys(data).length, 1)
})

test('should return data with signature in GET request', async (t) => {
  const request = axios.create({
    adapter: mockAdapter,
  })

  request.interceptors.request.use(
    useSign({
      secret,
    })
  )

  const { config } = await request.get('/', {
    params: {
      a: 1,
    },
  })
  const { params } = config

  t.is(params.a, 1)
  t.not(params.timestamp, undefined)
  t.not(params.nonce, undefined)

  const signature = md5(
    `a=1&nonce=${params.nonce}&secret=${secret}&timestamp=${params.timestamp}`
  )

  t.is(params.signature, signature)
})

test('should return data with signature in POST request', async (t) => {
  const request = axios.create({
    adapter: mockAdapter,
  })

  request.interceptors.request.use(
    useSign({
      secret,
    })
  )

  const { data } = await request.post('/', {
    a: 1,
  })

  t.is(data.a, 1)
  t.not(data.timestamp, undefined)
  t.not(data.nonce, undefined)

  const signature = md5(
    `a=1&nonce=${data.nonce}&secret=${secret}&timestamp=${data.timestamp}`
  )

  t.is(data.signature, signature)
})

test('should return data with signature in POST request with empty value', async (t) => {
  const request = axios.create({
    adapter: mockAdapter,
  })

  request.interceptors.request.use(
    useSign({
      secret,
    })
  )

  const { data } = await request.post('/', {
    a: 1,
    b: '',
  })

  t.is(data.a, 1)
  t.is(data.b, '')
  t.not(data.timestamp, undefined)
  t.not(data.nonce, undefined)

  const signature = md5(
    `a=1&nonce=${data.nonce}&secret=${secret}&timestamp=${data.timestamp}`
  )

  t.is(data.signature, signature)
})
