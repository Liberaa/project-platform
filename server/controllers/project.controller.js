const Project = require('../models/Project');
const path = require('path');
const fs = require('fs').promises;

class ProjectController {
  async getAllProjects(req, res) {
    try {
      const { page = 1, limit = 12, tech, search } = req.query;
      
      const query = { published: true };
      
      // Add filters
      if (tech) {
        query.tech = { $in: Array.isArray(tech) ? tech : [tech] };
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const projects = await Project.find(query)
        .populate('ownerId', 'email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const count = await Project.countDocuments(query);

      res.json({
        projects,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  }

  async getProject(req, res) {
    try {
      const { id } = req.params;
      
      const project = await Project.findById(id)
        .populate('ownerId', 'email');
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Increment view count
      await Project.findByIdAndUpdate(id, { $inc: { views: 1 } });

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  }

  async getUserProjects(req, res) {
    try {
      const userId = req.user._id;
      
      const projects = await Project.find({ ownerId: userId })
        .sort({ createdAt: -1 });

      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user projects' });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { title, description, tech, published } = req.body;
      
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check ownership
      if (project.ownerId.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to update this project' });
      }

      // Update fields
      if (title) project.title = title;
      if (description) project.description = description;
      if (tech) project.tech = tech;
      if (published !== undefined) project.published = published;

      await project.save();

      res.json({
        message: 'Project updated successfully',
        project
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project' });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check ownership
      if (project.ownerId.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to delete this project' });
      }

      // Delete project files
      const projectPath = path.join(process.env.UPLOAD_DIR, project.path);
      try {
await fs.rm(projectPath, { recursive: true, force: true });
      } catch (err) {
        console.error('Error deleting project files:', err);
      }

      // Delete from database
      await Project.findByIdAndDelete(id);

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete project' });
    }
  }
}

module.exports = new ProjectController();
