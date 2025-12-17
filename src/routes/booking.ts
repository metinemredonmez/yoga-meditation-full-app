import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBooking,
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Create a booking for a class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully.
 *       409:
 *         description: Duplicate booking detected.
 */
router.post('/', authenticateToken, createBooking);

/**
 * @openapi
 * /api/bookings/me:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: List bookings for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get('/me', authenticateToken, getMyBookings);

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags:
 *       - Bookings
 *     summary: Cancel a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully.
 */
router.patch('/:id/cancel', authenticateToken, cancelBooking);

/**
 * @openapi
 * /api/bookings/{id}:
 *   put:
 *     tags:
 *       - Bookings
 *     summary: Update booking status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'CONFIRMED', 'CANCELLED']
 *     responses:
 *       200:
 *         description: Booking updated.
 */
router.put('/:id', authenticateToken, updateBooking);

export default router;
