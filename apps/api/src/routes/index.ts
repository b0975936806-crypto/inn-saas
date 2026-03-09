import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as tenantController from '../controllers/tenant.controller';
import * as roomController from '../controllers/room.controller';
import * as bookingController from '../controllers/booking.controller';
import * as availabilityController from '../controllers/availability.controller';
import * as paymentController from '../controllers/payment.controller';
import * as userController from '../controllers/user.controller';
import * as linebotController from '../controllers/linebot.controller';

const router = Router();

// 租戶管理（僅管理員）
router.get('/tenants', tenantMiddleware, authMiddleware, requireRole(['admin']), tenantController.getCurrentTenant);
router.post('/tenants', tenantMiddleware, authMiddleware, requireRole(['admin']), tenantController.getCurrentTenant);
router.get('/tenants/:id', tenantMiddleware, authMiddleware, requireRole(['admin']), tenantController.getCurrentTenant);
router.patch('/tenants/:id', tenantMiddleware, authMiddleware, requireRole(['admin']), tenantController.updateTenant);
router.delete('/tenants/:id', tenantMiddleware, authMiddleware, requireRole(['admin']), tenantController.getCurrentTenant);

// 房型管理
router.get('/room-types', tenantMiddleware, roomController.getAllRoomTypes);
router.get('/room-types/:id', tenantMiddleware, roomController.getRoomTypeById);
router.post('/room-types', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.createRoomType);
router.patch('/room-types/:id', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.updateRoomType);
router.delete('/room-types/:id', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.deleteRoomType);

// 房間管理
router.get('/rooms', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager', 'staff']), roomController.getAllRooms);
router.get('/rooms/:id', tenantMiddleware, authMiddleware, roomController.getRoomById);
router.post('/rooms', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.createRoom);
router.patch('/rooms/:id', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.updateRoom);
router.delete('/rooms/:id', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), roomController.deleteRoom);

// 空房查詢
router.get('/availability', tenantMiddleware, availabilityController.checkAvailability);
router.get('/public/availability', tenantMiddleware, availabilityController.checkAvailability);

// 預訂管理
router.get('/bookings', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager', 'staff']), bookingController.getBookings);
router.get('/bookings/:id', tenantMiddleware, authMiddleware, bookingController.getBookingById);
router.post('/bookings', tenantMiddleware, bookingController.createBooking);
router.patch('/bookings/:id', tenantMiddleware, authMiddleware, bookingController.updateBooking);
router.patch('/bookings/:id/cancel', tenantMiddleware, bookingController.cancelBooking);
router.patch('/bookings/:id/check-in', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager', 'staff']), bookingController.checkInBooking);
router.patch('/bookings/:id/check-out', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager', 'staff']), bookingController.checkOutBooking);

// 付款管理
router.get('/payments', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), paymentController.getPaymentStatus);
router.get('/payments/:id', tenantMiddleware, authMiddleware, paymentController.getPaymentStatus);
router.post('/payments', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager', 'staff']), paymentController.createEcpayPayment);
router.post('/payments/:id/confirm', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), paymentController.linePayConfirm);
router.post('/payments/:id/refund', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), paymentController.linePayConfirm);

// 用戶管理
router.get('/users', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), userController.getUsers);
router.get('/users/:id', tenantMiddleware, authMiddleware, userController.getUserById);
router.post('/users', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), userController.createUser);
router.patch('/users/:id', tenantMiddleware, authMiddleware, userController.updateUser);
router.delete('/users/:id', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), userController.deleteUser);

// 認證
router.post('/auth/login', tenantMiddleware, userController.login);
router.post('/auth/register', tenantMiddleware, userController.createUser);
router.post('/auth/forgot-password', tenantMiddleware, userController.getCurrentUser);
router.post('/auth/reset-password', tenantMiddleware, userController.getCurrentUser);
router.get('/auth/me', tenantMiddleware, authMiddleware, userController.getCurrentUser);

// LINE Bot
router.post('/line/webhook', tenantMiddleware, linebotController.lineWebhook);
router.post('/line/push', tenantMiddleware, authMiddleware, requireRole(['owner', 'manager']), linebotController.sendPushMessage);

// LINE Bot - 訂單查詢與取消
router.get('/line/bookings/:lineUserId', tenantMiddleware, linebotController.getBookingsByLineUserId);
router.post('/line/bookings/:bookingNumber/cancel', tenantMiddleware, linebotController.cancelBookingByNumber);

export default router;
