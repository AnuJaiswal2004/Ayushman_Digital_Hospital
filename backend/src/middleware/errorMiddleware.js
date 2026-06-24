export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  if (
    err.name === 'MulterError' || 
    err.message.includes('rejected') || 
    err.message.includes('select a file') ||
    err.message.includes('past')
  ) {
    statusCode = 400;
  }
  
  console.error(`🚨 Error [${req.method} ${req.url}]:`, err.message, err.stack);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
