import test from 'node:test';
import assert from 'node:assert/strict';
import { BackupPayload, Product } from '../types';

test('Backup payload validation and reconstruction', () => {
  const sampleProducts: Product[] = [
    {
      id: 'test-1',
      brand: 'Vizzano',
      reference: '1234-100',
      price: 189.9,
      photoUrl: 'https://example.com/photo.jpg',
      photoStatus: 'Ja tenho as fotos',
      observation: 'Caixa original',
      status: 'code_received',
      submittedCode: '789012345678',
      sentToSite: true,
      sentToAtacado: false,
      createdAt: '2026-10-24T00:00:00Z',
    },
  ];

  const payload: BackupPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'Admin Test',
    products: sampleProducts,
    draftProducts: [],
    users: [
      {
        id: 'user-admin-master',
        name: 'Administrador Master',
        username: 'admin',
        password: '123',
        role: 'admin',
        createdAt: '2026-10-24T00:00:00Z',
        active: true,
      },
    ],
  };

  const serialized = JSON.stringify(payload);
  const parsed = JSON.parse(serialized) as BackupPayload;

  assert.equal(parsed.version, '1.0');
  assert.equal(parsed.products.length, 1);
  assert.equal(parsed.products[0].brand, 'Vizzano');
  assert.equal(parsed.products[0].price, 189.9);
  assert.equal(parsed.users?.length, 1);
  assert.equal(parsed.users?.[0].username, 'admin');
});
