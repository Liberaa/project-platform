const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public routes
router.get('/', projectController.getAllProjects);

// Protected routes FIRST
router.get('/user/projects', authMiddleware, projectController.getUserProjects);
router.put('/:id', authMiddleware, projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

// Public single project LAST
router.get('/:id', projectController.getProject);


module.exports = router;
