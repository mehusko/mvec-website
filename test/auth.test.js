import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SESSION_SECRET = 'x'.repeat(40);
process.env.DB_FILE = ':memory:';
const a = await import('../lib/auth.js');

test('password hash and verify', async () => {
  const h = await a.hashPassword('correct horse');
  assert.ok(await a.verifyPassword('correct horse', h));
  assert.ok(!(await a.verifyPassword('wrong', h)));
});
test('totp matches RFC 6238 vector', () => {
  // RFC secret "12345678901234567890" in base32
  const sec = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(a.totp(sec, 59000).slice(-6), '287082');
  assert.ok(a.verifyTotp(sec, '287082', 59000));
  assert.ok(!a.verifyTotp(sec, '000000', 59000));
});
test('signed token roundtrip and tamper', () => {
  const t = a.signToken({ u: 'abc' }, 60);
  assert.equal(a.readToken(t).u, 'abc');
  assert.equal(a.readToken(t + 'x'), null);
  assert.equal(a.readToken(a.signToken({ u: 'abc' }, -5)), null);
});
