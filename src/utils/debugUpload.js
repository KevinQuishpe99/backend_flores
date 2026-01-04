// Utilidad para debugging de uploads
export const debugUpload = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_UPLOADS === 'true') {
    console.log('\n📤 === DEBUG UPLOAD ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const file = Array.isArray(req.files[key]) ? req.files[key][0] : req.files[key];
        if (file) {
          console.log(`  ${key}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            destination: file.destination,
            filename: file.filename
          });
        }
      });
    }
    
    console.log('Body:', req.body);
    console.log('========================\n');
  }
  next();
};

