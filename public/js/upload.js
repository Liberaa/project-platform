// Upload Manager
class UploadManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('fileInput');
    this.browseBtn = document.getElementById('browseBtn');
    
    if (!this.token) {
      window.location.href = '/login.html';
      return;
    }
    
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Browse button
    this.browseBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleFile(file);
    });

    // Drag and drop events
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file) this.handleFile(file);
    });
  }

  handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      this.showError('Please upload a ZIP file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.showError('File size exceeds 10MB limit');
      return;
    }

    // First validate the ZIP structure
    this.validateZip(file);
  }

  async validateZip(file) {
    const formData = new FormData();
    formData.append('project', file);

    try {
      const response = await fetch('/api/upload/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        this.showError(result.message || 'Validation failed');
        return;
      }

      if (result.isValid) {
        this.showValidationSuccess(result);
        // Proceed with upload
        this.uploadFile(file);
      } else {
        this.showValidationErrors(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.showError('Failed to validate file');
    }
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('project', file);

    // Show progress
    this.showProgress();

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          this.updateProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 201) {
          const result = JSON.parse(xhr.responseText);
          this.showSuccess(result);
        } else {
          const error = JSON.parse(xhr.responseText);
          this.showError(error.message || 'Upload failed');
        }
      };

      xhr.onerror = () => {
        this.showError('Network error during upload');
      };

      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      this.showError('Failed to upload file');
    }
  }

  showProgress() {
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'block';
  }

  updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `Uploading... ${Math.round(percent)}%`;
  }

  showValidationSuccess(result) {
    const resultDiv = document.getElementById('uploadResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'upload-result success';
    
    let html = '<h3>✓ Validation Successful</h3>';
    
    if (result.metadata) {
      html += `
        <p><strong>Title:</strong> ${this.escapeHtml(result.metadata.title)}</p>
        <p><strong>Description:</strong> ${this.escapeHtml(result.metadata.description)}</p>
      `;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      html += '<div class="warnings"><strong>Warnings:</strong><ul>';
      result.warnings.forEach(warning => {
        html += `<li>${this.escapeHtml(warning)}</li>`;
      });
      html += '</ul></div>';
    }
    
    resultDiv.innerHTML = html;
  }

  showValidationErrors(result) {
    const resultDiv = document.getElementById('uploadResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'upload-result error';
    
    let html = '<h3>✗ Validation Failed</h3>';
    html += '<ul>';
    
    result.errors.forEach(error => {
      html += `<li>${this.escapeHtml(error)}</li>`;
    });
    
    html += '</ul>';
    html += '<button onclick="location.reload()">Try Again</button>';
    
    resultDiv.innerHTML = html;
    document.getElementById('dropzone').style.display = 'none';
  }

  showSuccess(result) {
    const resultDiv = document.getElementById('uploadResult');
    const progressDiv = document.getElementById('uploadProgress');
    
    progressDiv.style.display = 'none';
    resultDiv.style.display = 'block';
    resultDiv.className = 'upload-result success';
    
    resultDiv.innerHTML = `
      <h3>✓ Upload Successful!</h3>
      <p>Your project "${this.escapeHtml(result.project.title)}" has been uploaded.</p>
      <div class="actions">
        <a href="/project.html?id=${result.project._id}" class="btn-primary">View Project</a>
        <button onclick="location.reload()">Upload Another</button>
      </div>
    `;
  }

  showError(message) {
    const resultDiv = document.getElementById('uploadResult');
    const progressDiv = document.getElementById('uploadProgress');
    
    progressDiv.style.display = 'none';
    resultDiv.style.display = 'block';
    resultDiv.className = 'upload-result error';
    
    resultDiv.innerHTML = `
      <h3>✗ Upload Failed</h3>
      <p>${this.escapeHtml(message)}</p>
      <button onclick="location.reload()">Try Again</button>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize upload manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('dropzone')) {
    new UploadManager();
  }
});
