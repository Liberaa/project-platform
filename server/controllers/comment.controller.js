const Comment = require('../models/Comment');
const Project = require('../models/Project');

class CommentController {

  async getComments(req, res) {
    const { projectId } = req.params;

    const comments = await Comment.find({
      projectId,
      deleted: false
    })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    res.json(comments);
  }

  async createComment(req, res) {
    const { projectId } = req.params;
    const { content } = req.body;

    if (!content || content.length > 300) {
      return res.status(400).json({ message: 'Invalid comment length' });
    }

    // Max 10 comments per user per project
    const count = await Comment.countDocuments({
      projectId,
      userId: req.user._id,
      deleted: false
    });

    if (count >= 10) {
      return res.status(400).json({
        message: 'Comment limit reached for this project'
      });
    }

    const comment = await Comment.create({
      projectId,
      userId: req.user._id,
      content
    });

    res.status(201).json(comment);
  }

  async deleteComment(req, res) {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const project = await Project.findById(comment.projectId);

    const isAdmin = req.user.role === 'admin';
    const isOwner = project?.ownerId.equals(req.user._id);
    const isAuthor = comment.userId.equals(req.user._id);

    if (!isAdmin && !isOwner && !isAuthor) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    comment.deleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted' });
  }
}

module.exports = new CommentController();
