const request = require('supertest');
const express = require('express');

const baseURL = 'http://localhost:3000';

describe('SwiftSlot Booking Tests', () => {
  
  // Test 1: Overlap test - Two parallel POST /bookings for same vendor+slot
  test('should prevent double booking - one 201, one 409', async () => {
    const vendorId = 1;
    const startISO = '2025-09-25T10:00:00.000Z';  // Future slot
    const endISO = '2025-09-25T10:30:00.000Z';
    
    const bookingData = {
      vendorId,
      startISO,
      endISO
    };

    // Create two parallel requests with different idempotency keys
    const request1 = fetch(`${baseURL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-overlap-1-${Date.now()}`
      },
      body: JSON.stringify(bookingData)
    });

    const request2 = fetch(`${baseURL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Idempotency-Key': `test-overlap-2-${Date.now()}`
      },
      body: JSON.stringify(bookingData)
    });

    // Execute both requests simultaneously
    const [response1, response2] = await Promise.all([request1, request2]);
    
    const statuses = [response1.status, response2.status].sort();
    
    // One should succeed (201), one should fail (409)
    expect(statuses).toEqual([201, 409]);
    
    // Check the 409 response has a meaningful error message
    const failedResponse = response1.status === 409 ? response1 : response2;
    const errorData = await failedResponse.json();
    expect(errorData.error).toContain('already booked');
  });

  // Test 2: Idempotency test - Same payload + key twice should return identical response
  test('should return identical response for same idempotency key', async () => {
    const vendorId = 1;
    const startISO = '2025-09-25T11:00:00.000Z';  // Different slot from above
    const endISO = '2025-09-25T11:30:00.000Z';
    const idempotencyKey = `test-idempotent-${Date.now()}`;
    
    const bookingData = {
      vendorId,
      startISO,
      endISO
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(bookingData)
    };

    // Make first request
    const response1 = await fetch(`${baseURL}/api/bookings`, requestOptions);
    const data1 = await response1.json();
    
    // Make second request with same idempotency key
    const response2 = await fetch(`${baseURL}/api/bookings`, requestOptions);
    const data2 = await response2.json();

    // Both should return 201 (or same status)
    expect(response1.status).toBe(response2.status);
    expect(response1.status).toBe(201);
    
    // Response bodies should be identical
    expect(data1).toEqual(data2);
    expect(data1.id).toBe(data2.id);  // Same booking ID
    expect(data1.vendorId).toBe(data2.vendorId);
    expect(data1.startTimeUtc).toBe(data2.startTimeUtc);
    expect(data1.status).toBe(data2.status);
  });
});

// Helper to run tests
if (require.main === module) {
  console.log('Running booking tests...');
  console.log('Make sure your server is running on localhost:3000');
}