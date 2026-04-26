const { api, setupTestTenant, teardownTestTenant, authHeader, TEST_TENANT, BASE_URL } = require('../helpers/setup')

let token, tenantId

beforeAll(async () => {
  const setup = await setupTestTenant()
  token    = setup.token
  tenantId = setup.tenantId
})

afterAll(async () => {
  await teardownTestTenant()
})

describe('Auth API', () => {

  test('POST /api/auth/register — returns token and tenant', async () => {
    // Already done in beforeAll — verify the token we got is valid
    expect(token).toBeTruthy()
    expect(tenantId).toBeTruthy()
  })

  test('POST /api/auth/register — duplicate email returns error', async () => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dup', company: 'Dup Co', email: TEST_TENANT.email, password: TEST_TENANT.password }),
    })
    expect(res.status).toBe(409)
  })

  test('POST /api/auth/login — valid credentials return token', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_TENANT.email, password: TEST_TENANT.password }),
    })
    expect(res.status).toBe(200)
    expect(res.data.token).toBeTruthy()
    expect(res.data.tenant).toBeDefined()
    expect(res.data.tenant.email).toBe(TEST_TENANT.email)
  })

  test('POST /api/auth/login — wrong password returns 401', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_TENANT.email, password: 'wrongpassword' }),
    })
    expect(res.status).toBe(401)
  })

  test('POST /api/auth/login — unknown email returns 401', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@nowhere.com', password: 'test' }),
    })
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/me — returns tenant profile', async () => {
    const res = await api('/api/auth/me', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.tenant.email).toBe(TEST_TENANT.email)
    expect(res.data.tenant.company).toBe(TEST_TENANT.company)
  })

  test('GET /api/auth/me — no token returns 401', async () => {
    const res = await api('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/me — invalid token returns 401', async () => {
    const res = await api('/api/auth/me', { headers: authHeader('invalid.token.here') })
    expect(res.status).toBe(401)
  })

})
