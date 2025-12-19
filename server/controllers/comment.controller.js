const Comment = require('../models/Comment');
const Project = require('../models/Project');

class CommentController {

  /* ================================
     Get comments for a project
  ================================ */
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

  /* ================================
     Create comment
  ================================ */
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

  /* ================================
     Edit comment (author only)
  ================================ */
  async editComment(req, res) {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.length > 300) {
      return res.status(400).json({ message: 'Invalid comment length' });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.deleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only author can edit
    if (!comment.userId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    comment.content = content;
    await comment.save();

    res.json(comment);
  }

  /* ================================
     Delete comment
     (author, project owner, or admin)
  ================================ */
  async deleteComment(req, res) {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment || comment.deleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const project = await Project.findById(comment.projectId);

    const isAdmin = req.user.role === 'admin';
    const isAuthor = comment.userId.equals(req.user._id);
    const isProjectOwner = project?.ownerId.equals(req.user._id);

    if (!isAdmin && !isAuthor && !isProjectOwner) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    comment.deleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted' });
  }
}

module.exports = new CommentController();
