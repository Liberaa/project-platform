// Project Grid Manager
class ProjectGrid {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 1;
    this.projects = [];
    this.filters = {
      search: '',
      tech: ''
    };
    
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadProjects();
  }

  attachEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const techFilter = document.getElementById('techFilter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.currentPage = 1;
        this.debounceSearch();
      });
    }

    if (techFilter) {
      techFilter.addEventListener('change', (e) => {
        this.filters.tech = e.target.value;
        this.currentPage = 1;
        this.loadProjects();
      });
    }
  }

  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProjects();
    }, 500);
  }

  async loadProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<div class="loading">Loading projects...</div>';

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 12
      });

      if (this.filters.search) {
        params.append('search', this.filters.search);
      }

      if (this.filters.tech) {
        params.append('tech', this.filters.tech);
      }

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (response.ok) {
        this.projects = data.projects;
        this.totalPages = data.totalPages;
        this.renderProjects();
        this.renderPagination();
      } else {
        grid.innerHTML = '<div class="error">Failed to load projects</div>';
      }
    } catch (error) {
      console.error('Load error:', error);
      grid.innerHTML = '<div class="error">Network error. Please try again.</div>';
    }
  }

renderProjects() {
  const grid = document.getElementById('projectGrid');

  if (this.projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No projects found</h3>
        <p>Try adjusting your filters or check back later</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = this.projects.map(project => `
    <a 
      href="/project.html?id=${project._id}" 
      class="project-card-link"
    >
      <div class="project-card">
        <div class="project-thumbnail">
          ${project.title.substring(0, 2).toUpperCase()}
        </div>

        <div class="project-info">
          <h3 class="project-title">
            ${this.escapeHtml(project.title)}
          </h3>

          <p class="project-description">
            ${this.escapeHtml(project.description)}
          </p>

          <div class="project-meta">
            <div class="tech-tags">
              ${project.tech.slice(0, 3).map(tech => `
                <span class="tech-tag">
                  ${this.escapeHtml(tech)}
                </span>
              `).join('')}
            </div>

            <span>${project.views || 0} views</span>
          </div>
        </div>
      </div>
    </a>
  `).join('');
}


  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = '';

    // Previous button
    html += `
      <button ${this.currentPage === 1 ? 'disabled' : ''} 
              onclick="projectGrid.goToPage(${this.currentPage - 1})">
        Previous
      </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="${i === this.currentPage ? 'active' : ''}"
                onclick="projectGrid.goToPage(${i})">
          ${i}
        </button>
      `;
    }

    // Next button
    html += `
      <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
              onclick="projectGrid.goToPage(${this.currentPage + 1})">
        Next
      </button>
    `;

    pagination.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize grid when DOM is ready
if (document.getElementById('projectGrid')) {
  const projectGrid = new ProjectGrid();
}
