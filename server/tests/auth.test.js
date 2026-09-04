/**
 * tests/auth.test.js — Phase 1 authentication integration tests.
 */
const { api, registerUser, PASSWORD } = require('./helpers');

describe('POST /api/v1/auth/register', () => {
  it('creates an account and returns a session', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        name: 'Asha Test',
        email: 'asha.register@test.local',
        password: PASSWORD,
        hometown: { city: 'Testville' },
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('asha.register@test.local');
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie'].join()).toContain('hh_refresh=');
    // The hash must never leave the server.
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email', async () => {
    const existing = await registerUser();
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        name: 'Copy Cat',
        email: existing.email,
        password: PASSWORD,
        hometown: { city: 'Testville' },
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  it('rejects a weak password with field-level detail', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak Pass',
        email: 'weak@test.local',
        password: 'short',
        hometown: { city: 'Testville' },
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'password')).toBe(true);
  });

  it('requires a hometown city', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ name: 'No Town', email: 'notown@test.local', password: PASSWORD, hometown: {} })
      .expect(400);

    expect(res.body.error.details.some((d) => d.field === 'hometown.city')).toBe(true);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('signs in with valid credentials', async () => {
    const session = await registerUser();
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: session.email, password: PASSWORD })
      .expect(200);

    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.id).toBe(session.user.id);
  });

  it('rejects a wrong password without revealing which field failed', async () => {
    const session = await registerUser();
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: session.email, password: 'WrongPass123' })
      .expect(401);

    expect(res.body.error.message).toBe('That email or password is incorrect');
  });

  it('gives the same message for an unknown email', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.local', password: PASSWORD })
      .expect(401);

    expect(res.body.error.message).toBe('That email or password is incorrect');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the signed-in user', async () => {
    const session = await registerUser();
    const res = await api()
      .get('/api/v1/auth/me')
      .set(...session.auth)
      .expect(200);
    expect(res.body.data.user.id).toBe(session.user.id);
  });

  it('rejects a request with no token', async () => {
    const res = await api().get('/api/v1/auth/me').expect(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a malformed token', async () => {
    await api().get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new access token from the refresh cookie', async () => {
    const session = await registerUser();
    const res = await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', session.refreshCookie)
      .expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('fails without a refresh cookie', async () => {
    await api().post('/api/v1/auth/refresh').expect(401);
  });
});

describe('password reset flow', () => {
  it('resets the password with a valid token and invalidates old sessions', async () => {
    const session = await registerUser();

    const forgot = await api()
      .post('/api/v1/auth/forgot-password')
      .send({ email: session.email })
      .expect(200);
    expect(forgot.body.data.resetToken).toBeTruthy();

    await api()
      .post('/api/v1/auth/reset-password')
      .send({ email: session.email, token: forgot.body.data.resetToken, password: 'BrandNew123' })
      .expect(200);

    await api()
      .post('/api/v1/auth/login')
      .send({ email: session.email, password: 'BrandNew123' })
      .expect(200);
    // The old access token was minted before the token version bumped.
    await api()
      .get('/api/v1/auth/me')
      .set(...session.auth)
      .expect(401);
  });

  it('reports success for an unknown email without leaking existence', async () => {
    const res = await api()
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@test.local' })
      .expect(200);

    expect(res.body.data.sent).toBe(true);
    expect(res.body.data.resetToken).toBeUndefined();
  });

  it('rejects an invalid reset token', async () => {
    const session = await registerUser();
    const res = await api()
      .post('/api/v1/auth/reset-password')
      .send({ email: session.email, token: 'a'.repeat(64), password: 'BrandNew123' })
      .expect(400);

    expect(res.body.error.message).toMatch(/invalid or has expired/i);
  });
});

describe('POST /api/v1/auth/change-password', () => {
  it('changes the password when the current one is correct', async () => {
    const session = await registerUser();
    await api()
      .post('/api/v1/auth/change-password')
      .set(...session.auth)
      .send({ currentPassword: PASSWORD, newPassword: 'Changed123' })
      .expect(200);

    await api()
      .post('/api/v1/auth/login')
      .send({ email: session.email, password: 'Changed123' })
      .expect(200);
  });

  it('rejects an incorrect current password', async () => {
    const session = await registerUser();
    const res = await api()
      .post('/api/v1/auth/change-password')
      .set(...session.auth)
      .send({ currentPassword: 'NotMyPass123', newPassword: 'Changed123' })
      .expect(400);

    expect(res.body.error.message).toMatch(/current password is incorrect/i);
  });
});
