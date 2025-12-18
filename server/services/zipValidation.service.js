const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class ZipValidationService {
  // Only block things that actually matter
  static FORBIDDEN_NAMES = ['.env'];
  static FORBIDDEN_FOLDERS = ['node_modules', '.git'];

  static REQUIRED_FILES = ['index.html', 'meta.json'];

  static async validateZip(zipBuffer) {
    try {
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();

      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: null
      };

      if (!entries.length) {
        return {
          isValid: false,
          errors: ['ZIP file is empty'],
          warnings: [],
          metadata: null
        };
      }

      // Normalize paths
      const paths = entries.map(e => e.entryName.replace(/\\/g, '/'));

      // Detect optional single root folder
      const topLevels = new Set(
        paths.filter(p => p.includes('/')).map(p => p.split('/')[0])
      );
      const rootFolder = topLevels.size === 1 ? [...topLevels][0] : null;

      // Helper to check existence
      const hasFile = (file) =>
        paths.some(p => p === file || p === `${rootFolder}/${file}`);

      // Required files
      for (const file of this.REQUIRED_FILES) {
        if (!hasFile(file)) {
          validation.errors.push(`Missing required file: ${file}`);
          validation.isValid = false;
        }
      }

      // File safety checks
      for (const entry of entries) {
        const name = entry.entryName.replace(/\\/g, '/');
        const base = path.basename(name);

        // Path traversal protection
        if (name.includes('..')) {
          validation.errors.push(`Invalid path detected: ${name}`);
          validation.isValid = false;
          continue;
        }

        // Forbidden folders
        if (this.FORBIDDEN_FOLDERS.some(f => name.split('/').includes(f))) {
          validation.errors.push(`Forbidden folder detected: ${name}`);
          validation.isValid = false;
          continue;
        }

        // Forbidden filenames
        if (this.FORBIDDEN_NAMES.includes(base)) {
          validation.errors.push(`Forbidden file detected: ${name}`);
          validation.isValid = false;
          continue;
        }
      }

      // Validate meta.json
      if (validation.isValid) {
        const metaPath = rootFolder ? `${rootFolder}/meta.json` : 'meta.json';
        const metaEntry = zip.getEntry(metaPath);

        try {
          const meta = JSON.parse(metaEntry.getData().toString('utf8'));
          validation.metadata = meta;

          if (!meta.title || !meta.description) {
            validation.errors.push(
              'meta.json must include "title" and "description"'
            );
            validation.isValid = false;
          }
        } catch {
          validation.errors.push('meta.json is not valid JSON');
          validation.isValid = false;
        }
      }

      return validation;
    } catch (err) {
      return {
        isValid: false,
        errors: [`ZIP validation error: ${err.message}`],
        warnings: [],
        metadata: null
      };
    }
  }

  static async extractZip(zipBuffer, projectId) {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    const extractPath = path.join(process.env.UPLOAD_DIR, projectId);
    await fs.mkdir(extractPath, { recursive: true });

    // Detect optional single root folder
    const paths = entries.map(e => e.entryName.replace(/\\/g, '/'));
    const topLevels = new Set(
      paths.filter(p => p.includes('/')).map(p => p.split('/')[0])
    );
    const rootFolder = topLevels.size === 1 ? [...topLevels][0] : null;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      let relativePath = entry.entryName.replace(/\\/g, '/');

      if (rootFolder && relativePath.startsWith(rootFolder + '/')) {
        relativePath = relativePath.slice(rootFolder.length + 1);
      }

      if (relativePath.includes('..')) {
        throw new Error('Invalid path traversal attempt');
      }

      const targetPath = path.join(extractPath, relativePath);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, entry.getData());
    }

    return {
      success: true,
      projectId,
      path: extractPath
    };
  }

  static generateProjectId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = ZipValidationService;
