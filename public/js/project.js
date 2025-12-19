// Project View Manager
class ProjectViewer {
  constructor() {
    this.projectId = this.getProjectIdFromUrl();
    this.project = null;
    this.isFullscreen = false;
    
    if (this.projectId) {
      this.init();
    } else {
      this.showError('No project ID provided');
    }
  }

  getProjectIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

async init() {
  await this.loadProject();
  await this.loadComments();
  this.attachEventListeners();
}



  async loadProject() {
    try {
      const response = await fetch(`/api/projects/${this.projectId}`);
      
      if (!response.ok) {
        throw new Error('Project not found');
      }

      this.project = await response.json();
      this.renderProject();
    } catch (error) {
      console.error('Load error:', error);
      this.showError('Failed to load project');
    }
  }

  renderProject() {
    // Update title
    document.getElementById('projectTitle').textContent = this.project.title;
    document.title = `${this.project.title} - Project Platform`;

    // Update meta information
    document.getElementById('projectAuthor').textContent = 
      `By ${this.project.ownerId?.email || 'Unknown'}`;
    
    document.getElementById('projectDate').textContent = 
      new Date(this.project.createdAt).toLocaleDateString();
    
    document.getElementById('projectViews').textContent = 
      `${this.project.views || 0} views`;

    // Update description
    document.getElementById('projectDescription').textContent = 
      this.project.description;

    // Update tech tags
    const techContainer = document.getElementById('projectTech');
    techContainer.innerHTML = this.project.tech.map(tech => 
      `<span class="tech-tag">${this.escapeHtml(tech)}</span>`
    ).join('');

    // Load project in iframe
    this.loadProjectFrame();
  }

  loadProjectFrame() {
    const frame = document.getElementById('projectFrame');
    const projectUrl = `/projects/${this.project.path}/index.html`;
    
    // Create loading overlay
    const container = frame.parentElement;
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    container.appendChild(loadingOverlay);

    // Set iframe source
    frame.src = projectUrl;
    
    // Remove loading overlay when loaded
    frame.onload = () => {
      loadingOverlay.remove();
    };

    frame.onerror = () => {
      loadingOverlay.remove();
      this.showError('Failed to load project content');
    };
  }

  attachEventListeners() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const reloadBtn = document.getElementById('reloadBtn');

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => this.reloadProject());
    }

    // Listen for escape key in fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });

const postBtn = document.getElementById('postCommentBtn');
if (postBtn) {
  postBtn.addEventListener('click', () => this.postComment());
}


  }

  toggleFullscreen() {
    const frame = document.getElementById('projectFrame');
    const container = frame.parentElement;

    if (!this.isFullscreen) {
      container.classList.add('fullscreen');
      
      // Add exit button
      const exitBtn = document.createElement('button');
      exitBtn.className = 'exit-fullscreen';
      exitBtn.textContent = 'Exit Fullscreen (ESC)';
      exitBtn.onclick = () => this.exitFullscreen();
      container.appendChild(exitBtn);

      this.isFullscreen = true;
    } else {
      this.exitFullscreen();
    }
  }

  exitFullscreen() {
    const frame = document.getElementById('projectFrame');
    const container = frame.parentElement;
    
    container.classList.remove('fullscreen');
    
    // Remove exit button
    const exitBtn = container.querySelector('.exit-fullscreen');
    if (exitBtn) exitBtn.remove();

    this.isFullscreen = false;
  }

  reloadProject() {
    const frame = document.getElementById('projectFrame');
    const currentSrc = frame.src;
    
    // Add loading overlay
    const container = frame.parentElement;
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    container.appendChild(loadingOverlay);

    // Force reload by clearing and resetting src
    frame.src = '';
    setTimeout(() => {
      frame.src = currentSrc;
      frame.onload = () => loadingOverlay.remove();
    }, 100);
  }

    /* ================================
     Comments
  ================================ */
async loadComments() {
  const container = document.getElementById('commentsList');
  const countEl = document.getElementById('commentCount');
  if (!container) return;

  const res = await fetch(`/api/projects/${this.projectId}/comments`);
  const comments = await res.json();

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  countEl.textContent = `(${comments.length})`;

  if (comments.length === 0) {
    container.innerHTML = '<p class="muted">No comments yet. Be the first.</p>';
    return;
  }

  container.innerHTML = comments.map(c => {
    const isAuthor = userId && c.userId._id === userId;

    return `
      <div class="comment-card" data-id="${c._id}">
        <div class="comment-header">
          <span class="comment-author">
            ${this.escapeHtml(c.userId.email)}
          </span>
          <span class="comment-date">
            ${new Date(c.createdAt).toLocaleString()}
          </span>

          ${isAuthor ? `
            <div class="comment-actions">
              <button class="comment-edit">Edit</button>
              <button class="comment-delete">Delete</button>
            </div>
          ` : ''}
        </div>

        <div class="comment-content">
          ${this.escapeHtml(c.content)}
        </div>
      </div>
    `;
  }).join('');

  this.attachCommentActions();
}


  async postComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    if (!content) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/projects/${this.projectId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Failed to post comment');
        return;
      }

      input.value = '';
      this.loadComments();
    } catch (err) {
      alert('Network error');
    }
  }


  showError(message) {
    const container = document.querySelector('.project-container');
    container.innerHTML = `
      <div class="error-container">
        <h2>Error</h2>
        <p>${message}</p>
        <a href="/" class="btn-primary">Back to Gallery</a>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

attachCommentActions() {
  document.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.comment-card').dataset.id;
      this.deleteComment(id);
    });
  });

  document.querySelectorAll('.comment-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.comment-card');
      const id = card.dataset.id;
      const contentEl = card.querySelector('.comment-content');
      this.startEditComment(id, contentEl);
    });
  });
}

startEditComment(commentId, contentEl) {
  if (contentEl.querySelector('.comment-edit')) return;

  const original = contentEl.textContent.trim();

  contentEl.innerHTML = `
    <div class="comment-edit">
      <textarea class="comment-edit-input">${original}</textarea>
      <div class="comment-edit-actions">
        <button class="save">Save</button>
        <button class="cancel">Cancel</button>
      </div>
    </div>
  `;



  contentEl.querySelector('.cancel').onclick = () => {
    contentEl.textContent = original;
  };

  contentEl.querySelector('.save').onclick = async () => {
    const newContent = contentEl.querySelector('textarea').value.trim();
    if (!newContent) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: newContent })
    });

    if (!res.ok) {
      alert('Failed to edit comment');
      return;
    }

    this.loadComments();
  };
}

async deleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;

  const token = localStorage.getItem('token');

  const res = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    alert('Failed to delete comment');
    return;
  }

  this.loadComments();
}


}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProjectViewer();
});
