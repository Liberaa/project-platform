const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth.middleware');
const commentController = require('../controllers/comment.controller');

const router = express.Router();
/*
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Slow down 😄 One comment per minute.'
});
*/
// Public
router.get('/projects/:projectId/comments', commentController.getComments);

router.put(
  '/comments/:id',
  authMiddleware,
  commentController.editComment
);
// Authenticated
router.post(
  '/projects/:projectId/comments',
  authMiddleware,
 // commentLimiter,
  commentController.createComment
);

router.delete(
  '/comments/:id',
  authMiddleware,
  commentController.deleteComment
);

module.exports = router;
