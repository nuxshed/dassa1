import express from 'express';
import { upload } from '../middleware/upload';
import { protect } from '../middleware/auth';
import mongoose from 'mongoose';

// FIXME: make sure payment proof images are only visible to the user who uploaded them and the organizer whose event it is for (and admin i guess)

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const db = mongoose.connection.db;
  if (!db) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'uploads'
  });

  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    metadata: {
      contentType: req.file.mimetype
    }
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', () => {
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/api/upload/${uploadStream.id}`;
    res.json({ url });
  });

  uploadStream.on('error', (err) => {
    res.status(500).json({ message: 'Error uploading file' });
  });
});

router.get('/:id', protect, async (req, res) => {
  const db = mongoose.connection.db;
  if (!db) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'uploads'
  });

  try {
    const fileId = new mongoose.mongo.ObjectId(req.params.id as string);
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (files[0].metadata && files[0].metadata.contentType) {
       res.set('Content-Type', files[0].metadata.contentType as string);
    }
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Invalid file ID or file not found' });
  }
});

export default router;
