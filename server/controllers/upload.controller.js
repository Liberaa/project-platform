const Project = require('../models/Project');
const ZipValidationService = require('../services/zipValidation.service');
const path = require('path');

class UploadController {
  async uploadProject(req, res) {
    try {
      // Validate ZIP content
      const validation = await ZipValidationService.validateZip(req.file.buffer);
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid project structure',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      // Generate unique project ID
      const projectId = ZipValidationService.generateProjectId();
      
      // Extract ZIP to project directory
      const extraction = await ZipValidationService.extractZip(
        req.file.buffer,
        projectId
      );
      
      if (!extraction.success) {
        return res.status(500).json({
          message: 'Failed to extract project',
          error: extraction.error
        });
      }

      // Create project record
      const project = new Project({
        ownerId: req.user._id,
        title: validation.metadata.title || 'Untitled Project',
        description: validation.metadata.description || 'No description provided',
        tech: validation.metadata.tech || [],
        path: projectId,
        published: true
      });

      await project.save();

      res.status(201).json({
        message: 'Project uploaded successfully',
        project,
        warnings: validation.warnings
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  }

  async validateUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const validation = await ZipValidationService.validateZip(req.file.buffer);
      
      res.json({
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        structure: validation.structure,
        metadata: validation.metadata
      });
    } catch (error) {
      res.status(500).json({ message: 'Validation failed' });
    }
  }
}

module.exports = new UploadController();
