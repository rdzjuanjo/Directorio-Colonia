// auth.js — Helpers de JWT: verificación de tokens admin/negocio y login con bcrypt para ambos roles
const bcrypt = require('bcryptjs');
const db = require('../db');

async function verifyAdminToken(request, reply) {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'admin') throw new Error('Not admin');
  } catch {
    reply.code(401).send({ error: 'No autorizado' });
  }
}

async function verifyBusinessToken(request, reply) {
  try {
    await request.jwtVerify();
    if (!['admin', 'business'].includes(request.user.role)) throw new Error();
  } catch {
    reply.code(401).send({ error: 'No autorizado' });
  }
}

async function loginAdmin(fastify, email, password) {
  const admin = await db('admins').where({ email }).first();
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) return null;
  return fastify.jwt.sign({ id: admin.id, email: admin.email, role: 'admin' });
}

async function loginBusiness(fastify, email, password) {
  const user = await db('business_users').where({ email }).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  return fastify.jwt.sign({ id: user.id, email: user.email, role: 'business', business_id: user.business_id });
}

module.exports = { verifyAdminToken, verifyBusinessToken, loginAdmin, loginBusiness };
