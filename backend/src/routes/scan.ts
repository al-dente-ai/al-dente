import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { scanService } from '../services/scanService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/rateLimit';
import { ValidationError } from '../middleware/error';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
    files: 1, // Only one file per request
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Apply authentication and rate limiting
router.use(authenticate);
router.use(uploadRateLimit);

const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const authReq = req as AuthenticatedRequest;

    console.log('🚀 [SCAN ROUTE] Upload request received', {
      userId: authReq.user.id,
      userAgent: authReq.get('User-Agent'),
      contentType: authReq.get('Content-Type'),
      timestamp: new Date().toISOString(),
    });

    // Check if file was uploaded
    if (!authReq.file) {
      console.error('❌ [SCAN ROUTE] No file provided in request');
      throw new ValidationError('No file uploaded. Please provide a file in the "file" field.');
    }

    console.log('📁 [SCAN ROUTE] File received', {
      userId: authReq.user.id,
      filename: authReq.file.originalname,
      fileSize: `${(authReq.file.size / 1024 / 1024).toFixed(2)}MB`,
      mimeType: authReq.file.mimetype,
      bufferSize: authReq.file.buffer.length,
    });

    // Validate the uploaded file
    console.log('🔍 [SCAN ROUTE] Validating file');
    scanService.validateImageFile(authReq.file);
    console.log('✅ [SCAN ROUTE] File validation passed');

    // Process the image scan
    console.log('🤖 [SCAN ROUTE] Starting image processing');
    const result = await scanService.processImageScan(
      authReq.user.id,
      authReq.file.buffer,
      authReq.file.originalname,
      authReq.file.mimetype
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('🎉 [SCAN ROUTE] Processing completed successfully', {
      userId: authReq.user.id,
      duration: `${duration}ms`,
      imageUrl: result.image_url,
      predictionName: result.prediction.name,
      confidence: result.prediction.confidence,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('❌ [SCAN ROUTE] Upload processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    next(error);
  }
};

/**
 * @swagger
 * /scan/upload:
 *   post:
 *     summary: Upload and analyze food image
 *     description: Upload an image of food items for AI-powered analysis and recognition
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (PNG, JPEG, JPG, WebP, max 16MB)
 *     responses:
 *       200:
 *         description: Image analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanResponse'
 *       400:
 *         description: Validation error or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large (max 16MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       415:
 *         description: Unsupported file type
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
 *       500:
 *         description: AI analysis failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload', upload.single('file'), uploadFile);

// Handle multer errors
router.use((error: any, _req: any, _res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError('File size exceeds 16MB limit'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ValidationError('Only one file allowed per request'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ValidationError('Unexpected file field. Use "file" as the field name.'));
    }
  }
  next(error);
});

export { router as scanRouter };
