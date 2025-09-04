// Nota: Este módulo usa un listado en memoria de hasta 5 usuarios.
// Ajusta los valores aquí para tu entorno. No usar en producción.

type UserRecord = {
  username: string;
  name?: string;
  // Formato: "sha256:<username>:<hexDigest>"
  passwordHash: string;
};

// Helper para crear hash rápido sin dependencias externas
function hash(username: string, password: string) {
  const crypto = require('crypto');
  const digest = crypto
    .createHash('sha256')
    .update(`${username}:${password}`)
    .digest('hex');
  return `sha256:${username}:${digest}`;
}

// Ejemplo: modifica hasta 5 usuarios como máximo
export const USERS: UserRecord[] = [
  {
    username: 'admin',
    name: 'Administrador',
    passwordHash: hash('admin', 'admin123'),
  },
  {
    username: 'user1',
    name: 'Usuario 1',
    passwordHash: hash('user1', 'user123'),
  },
  // Puedes agregar hasta 3 usuarios más
  // { username: 'user2', name: 'Usuario 2', passwordHash: hash('user2', 'pass') },
  // { username: 'user3', name: 'Usuario 3', passwordHash: hash('user3', 'pass') },
  // { username: 'user4', name: 'Usuario 4', passwordHash: hash('user4', 'pass') },
];

if (USERS.length > 5) {
  throw new Error('Máximo 5 usuarios permitidos en USERS');
}

