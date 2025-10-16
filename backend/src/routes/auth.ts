import { Router } from 'express';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validate';
import { authRateLimit } from '../middleware/rateLimit';
import { 
  signupSchema, 
  loginSchema, 
  verifyPhoneSchema,
  sendVerificationCodeSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from '../schemas/auth';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     description: Register a new user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with email and password to receive an authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const result = await authService.login(req.body, ip, userAgent);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: Verify phone number with code
 *     description: Verify a phone number using the SMS code sent during signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+12345678900"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify-phone', validateBody(verifyPhoneSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyPhone(req.body);
    res.status(200).json({
      success: result.success,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/send-verification-code:
 *   post:
 *     summary: Send or resend verification code
 *     description: Send a new verification code to a phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+12345678900"
 *               purpose:
 *                 type: string
 *                 enum: [signup, password_reset, phone_change]
 *                 default: signup
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/send-verification-code', validateBody(sendVerificationCodeSchema), async (req, res, next) => {
  try {
    const { phoneNumber, purpose } = req.body;
    await authService.sendVerificationCode(phoneNumber, purpose);
    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset by email - sends SMS code to user's verified phone
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: If user exists and has verified phone, code sent
 *       400:
 *         description: No verified phone number
 */
router.post('/request-password-reset', validateBody(requestPasswordResetSchema), async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body);
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email and has a verified phone number, a verification code has been sent.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with SMS code
 *     description: Reset password using phone verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *               - newPassword
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+12345678900"
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid code or validation error
 */
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({
      success: result.success,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
