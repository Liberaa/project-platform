// Dashboard Manager
class DashboardManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!this.token || !this.user) {
      window.location.href = '/login.html';
      return;
    }

    this.init();
  }

  async init() {
    this.displayUserInfo();
    await this.loadUserProjects();

    if (this.user.role === 'admin') {
      this.initAdminPanel();
    }

    this.attachEventListeners();
  }

  displayUserInfo() {
    document.getElementById('userEmail').textContent = this.user.email;
    document.getElementById('userRole').textContent = this.user.role;
    document.getElementById('uploadPermission').textContent =
      this.user.canUpload ? 'Granted' : 'Pending Approval';
  }

  async loadUserProjects() {
    const container = document.getElementById('userProjects');

    try {
      const response = await fetch('/api/projects/user/projects', {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const projects = await response.json();
      this.renderUserProjects(projects);
    } catch (error) {
      console.error('Load error:', error);
      container.innerHTML = '<div class="error">Failed to load projects</div>';
    }
  }

  renderUserProjects(projects) {
    const container = document.getElementById('userProjects');

    if (projects.length === 0) {
      container.innerHTML = '<p>No projects uploaded yet.</p>';
      return;
    }

    container.innerHTML = projects.map(project => `
      <div class="project-item">
        <div>
          <h4>${this.escapeHtml(project.title)}</h4>
          <small>
            ${new Date(project.createdAt).toLocaleDateString()} • 
            ${project.views} views
          </small>
        </div>
        <div class="project-actions">
          <a href="/project.html?id=${project._id}" class="btn-small">View</a>

          <button class="btn-small edit-btn" data-id="${project._id}">
            Edit
          </button>

          <button class="btn-small btn-danger delete-btn" data-id="${project._id}">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  async editProject(projectId) {
    const title = prompt('Enter new title:');
    if (!title) return;

    const description = prompt('Enter new description:');
    if (!description) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        alert('Project updated successfully');
        this.loadUserProjects();
      } else {
        const error = await response.json();
        alert(error.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update project');
    }
  }

  async deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        alert('Project deleted successfully');
        this.loadUserProjects();
      } else {
        const error = await response.json();
        alert(error.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete project');
    }
  }

  initAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    adminPanel.style.display = 'block';
    this.loadPendingUsers();
  }

  async loadPendingUsers() {
    const container = document.getElementById('pendingUsers');

    try {
      const response = await fetch('/api/users/pending', {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        container.innerHTML = '<p>No pending approvals</p>';
        return;
      }

      const users = await response.json();
      this.renderPendingUsers(users);
    } catch (error) {
      console.error('Load error:', error);
      container.innerHTML = '<p>No pending approvals</p>';
    }
  }

  renderPendingUsers(users) {
    const container = document.getElementById('pendingUsers');

    if (users.length === 0) {
      container.innerHTML = '<p>No pending approvals</p>';
      return;
    }

    container.innerHTML = users.map(user => `
      <div class="user-item">
        <div>
          <strong>${this.escapeHtml(user.email)}</strong>
          <small>
            Registered: ${new Date(user.createdAt).toLocaleDateString()}
          </small>
        </div>
        <button class="btn-small btn-success approve-btn" data-id="${user._id}">
          Approve
        </button>
      </div>
    `).join('');
  }

  async approveUser(userId) {
    try {
      const response = await fetch(`/api/auth/approve/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        alert('User approved successfully');
        this.loadPendingUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve user');
    }
  }

  attachEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // 🔥 CSP-safe event delegation
    document.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        this.deleteProject(deleteBtn.dataset.id);
        return;
      }

      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        this.editProject(editBtn.dataset.id);
        return;
      }

      const approveBtn = e.target.closest('.approve-btn');
      if (approveBtn) {
        this.approveUser(approveBtn.dataset.id);
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new DashboardManager();
});
