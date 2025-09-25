import express from 'express';
import { connectDatabase } from './config/database';
import { Vendor } from './models/Vendor';
import { Booking } from './models/Booking';
import { BookingSlot } from './models/BookingSlot';
import { generateTimeSlots, convertLagosToUtc, convertUtcToLagos } from './utils/timezone';
import { Op, QueryTypes } from 'sequelize';
import { addHours, isAfter } from 'date-fns';
import { sequelize } from './config/database';
import { IdempotencyKey } from './models/IdempotencyKey';
import { Payment } from './models/Payment';
import cors from 'cors';
import { seedVendors } from './seeders/vendors';

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key']
}));

app.use(express.json());

Booking.belongsTo(Vendor, { foreignKey: 'vendorId' });
Vendor.hasMany(Booking, { foreignKey: 'vendorId' });
app.get('/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.get('/api/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            attributes: ['id', 'name', 'timezone']
        });
        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});
app.get('/api/vendors/:id/availability', async (req, res) => {
    try {
        const vendorId = parseInt(req.params.id);
        const date = req.query.date as string;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const allSlots = generateTimeSlots(date);

        const bookedSlots = await BookingSlot.findAll({
            where: {
                vendorId: vendorId,
                slotStartUtc: {
                    [Op.in]: allSlots
                }
            }
        });

        const bookedTimes = new Set(
            bookedSlots.map(slot => slot.slotStartUtc.toISOString())
        );

        const availableSlots = allSlots.filter(slot =>
            !bookedTimes.has(slot.toISOString())
        );

        res.json(availableSlots.map(slot => slot.toISOString()));

    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const idempotencyKey = req.headers['idempotency-key'] as string;
        const { vendorId, startISO, endISO } = req.body;

        if (!idempotencyKey) {
            return res.status(400).json({ error: 'Idempotency-Key header is required' });
        }

        if (!vendorId || !startISO || !endISO) {
            return res.status(400).json({ error: 'vendorId, startISO, and endISO are required' });
        }

        const existingKey = await sequelize.query(
            'SELECT * FROM idempotency_keys WHERE `key` = ? AND scope = ?',
            {
                replacements: [idempotencyKey, 'bookings'],
                type: QueryTypes.SELECT
            }
        );

        if (existingKey.length > 0) {
            const cachedResponse = JSON.parse((existingKey[0] as any).response_hash);
            return res.status(200).json(cachedResponse);
        }


        const startTimeUtc = new Date(startISO);
        const endTimeUtc = new Date(endISO);

        const nowUtc = new Date();
        const nowLagos = convertUtcToLagos(nowUtc);
        const startTimeLagos = convertUtcToLagos(startTimeUtc);

        const todayLagos = new Date(nowLagos.getFullYear(), nowLagos.getMonth(), nowLagos.getDate());
        const bookingDateLagos = new Date(startTimeLagos.getFullYear(), startTimeLagos.getMonth(), startTimeLagos.getDate());

        if (todayLagos.getTime() === bookingDateLagos.getTime()) {

            const twoHoursFromNowLagos = addHours(nowLagos, 2);

            if (!isAfter(startTimeLagos, twoHoursFromNowLagos)) {
                return res.status(400).json({
                    error: 'Bookings for today must start at least 2 hours from now (Lagos time)',
                    currentTime: nowLagos.toISOString(),
                    minimumBookingTime: twoHoursFromNowLagos.toISOString()
                });
            }
        }

        const transaction = await sequelize.transaction();

        try {

            const booking = await Booking.create({
                vendorId: parseInt(vendorId),
                buyerId: 1,
                startTimeUtc,
                endTimeUtc,
                status: 'pending'
            }, { transaction });

            try {
                await BookingSlot.create({
                    bookingId: booking.id,
                    vendorId: parseInt(vendorId),
                    slotStartUtc: startTimeUtc
                }, { transaction });
            } catch (slotError: any) {

                if (slotError.name === 'SequelizeUniqueConstraintError') {
                    await transaction.rollback();
                    return res.status(409).json({
                        error: 'This time slot is already booked. Please choose another time.',
                        conflictDetails: 'Another booking exists for this vendor at this time'
                    });
                }
                throw slotError;
            }

            const responseData = {
                id: booking.id,
                vendorId: booking.vendorId,
                startTimeUtc: booking.startTimeUtc.toISOString(),
                endTimeUtc: booking.endTimeUtc.toISOString(),
                status: booking.status,
                createdAt: booking.createdAt.toISOString()
            };

            await sequelize.query(
                'INSERT INTO idempotency_keys (`key`, scope, response_hash, createdAt) VALUES (?, ?, ?, NOW())',
                {
                    replacements: [idempotencyKey, 'bookings', JSON.stringify(responseData)],
                    transaction
                }
            );

            await transaction.commit();

            res.status(201).json(responseData);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});


app.post('/api/payments/initialize', async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ error: 'bookingId is required' });
        }

        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const paymentRef = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const payment = await Payment.create({
            bookingId: parseInt(bookingId),
            ref: paymentRef,
            status: 'pending'
        });

        res.json({ ref: paymentRef });

    } catch (error) {
        console.error('Error initializing payment:', error);
        res.status(500).json({ error: 'Failed to initialize payment' });
    }
});

app.post('/api/payments/webhook', async (req, res) => {
    try {
        const { event, data } = req.body;

        if (event !== 'charge.success' || !data?.reference) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }
        const { reference } = data;

        const payment = await Payment.findOne({
            where: { ref: reference }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        if (payment.status === 'success') {
            return res.json({ message: 'Payment already processed' });
        }

        const transaction = await sequelize.transaction();

        try {
            await payment.update({
                status: 'success',
                rawEventJson: JSON.stringify(req.body)
            }, { transaction });

            await Booking.update(
                { status: 'paid' },
                {
                    where: { id: payment.bookingId },
                    transaction
                }
            );

            await transaction.commit();

            res.json({
                message: 'Payment processed successfully',
                paymentId: payment.id,
                bookingId: payment.bookingId
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process payment webhook' });
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);

        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: Vendor,
                    attributes: ['id', 'name', 'timezone']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({
            id: booking.id,
            vendorId: booking.vendorId,
            startTimeUtc: booking.startTimeUtc.toISOString(),
            endTimeUtc: booking.endTimeUtc.toISOString(),
            status: booking.status,
            createdAt: booking.createdAt.toISOString()
        });

    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});
if (require.main === module) {
    const startServer = async () => {
        try {
            await connectDatabase();
            await Vendor.sync();
            await Booking.sync();
            await BookingSlot.sync();
            await IdempotencyKey.sync();
            await Payment.sync();
            // await sequelize.sync();
            await seedVendors();
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    startServer();
}
export { app };