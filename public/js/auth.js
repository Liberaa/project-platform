// Auth state management
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.initAuth();
  }

  initAuth() {
    this.updateUIState();
    this.attachEventListeners();
  }

  updateUIState() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadLink = document.getElementById('uploadLink');
    const dashboardLink = document.getElementById('dashboardLink');

    if (this.isAuthenticated()) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (dashboardLink) dashboardLink.style.display = 'block';
      
      if (uploadLink && this.user?.canUpload) {
        uploadLink.style.display = 'block';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (uploadLink) uploadLink.style.display = 'none';
      if (dashboardLink) dashboardLink.style.display = 'none';
    }
  }

  attachEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerFormElement');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Switch between login and register
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').parentElement.style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
      });
    }

    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').parentElement.style.display = 'block';
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        window.location.href = '/';
      } else {
        errorMessage.textContent = data.message || 'Login failed';
        errorMessage.classList.add('show');
      }
    } catch (error) {
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.classList.add('show');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const errorMessage = document.getElementById('regErrorMessage');

    if (password !== confirm) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.classList.add('show');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Switch to login form
        document.getElementById('switchToLogin').click();
      } else {
        errorMessage.textContent = data.message || 'Registration failed';
        errorMessage.classList.add('show');
      }
    } catch (error) {
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.classList.add('show');
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
    
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Initialize auth manager
const authManager = new AuthManager();
