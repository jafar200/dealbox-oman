/**
 * Centralized Error Handling Middleware for DealBox Express Server
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[DealBox Error]', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم الداخلي',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`المسار غير موجود - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
