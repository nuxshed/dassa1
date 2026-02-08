import express from 'express';
import { upload } from '../middleware/upload';
import { protect } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// FIXME: make sure payment proof images are only visible to the user who uploaded them and the organizer whose event it is for (and admin i guess)

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/api/upload/${req.file.filename}`;

  res.json({ url });
});

router.get('/:filename', protect, (req, res) => {
  const uploadDir = path.join(__dirname, '../../uploads');
  const filePath = path.join(uploadDir, req.params.filename as string);

  if (path.relative(uploadDir, filePath).startsWith('..')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.sendFile(filePath);
});

export default router;
