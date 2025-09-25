import request from 'supertest';
import { Application } from 'express';
import { app } from '../index';

import { Vendor } from '../models/Vendor';
import { sequelize } from '../config/database';


describe('Booking API - Required Tests', () => {
  let testApp: Application;
  let testVendor: any;

  beforeAll(async () => {
    testApp = app as Application;

    // Clean database and create test data
    await sequelize.sync();

    // Create test vendor
    testVendor = await Vendor.create({
      name: 'Test Vendor',
      timezone: 'Africa/Lagos'
    });
  });

  // Rest of tests remain the same...
  describe('Overlap Test: Double-booking Prevention', () => {
    it('should prevent double booking - one 201, one 409', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingData = {
        vendorId: testVendor.id,
        startISO: `${tomorrow.toISOString().split('T')[0]}T10:00:00.000Z`,
        endISO: `${tomorrow.toISOString().split('T')[0]}T10:30:00.000Z`,
        customerName: 'Test Customer 1',
        customerEmail: 'test1@example.com'
      };

      const [response1, response2] = await Promise.all([
        request(testApp)
          .post('/api/bookings')
          .set('Idempotency-Key', `overlap-test-1-${Date.now()}`)
          .send(bookingData),
        request(testApp)
          .post('/api/bookings')
          .set('Idempotency-Key', `overlap-test-2-${Date.now()}`)
          .send(bookingData)
      ]);

      const responses = [response1, response2].sort((a, b) => a.status - b.status);

      expect(responses[0].status).toBe(201);
      expect(responses[1].status).toBe(409);
    });
  });

  describe('Idempotency Test', () => {
    it('should return identical response for same idempotency key', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingData = {
        vendorId: testVendor.id,
        startISO: `${tomorrow.toISOString().split('T')[0]}T11:00:00.000Z`,
        endISO: `${tomorrow.toISOString().split('T')[0]}T11:30:00.000Z`,
        customerName: 'Test Customer 2',
        customerEmail: 'test2@example.com'
      };

      const idempotencyKey = `idempotent-test-${Date.now()}`;

      const response1 = await request(testApp)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      const response2 = await request(testApp)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
    });
  });
});