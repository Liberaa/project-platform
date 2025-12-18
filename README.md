# Curated Interactive Project Platform

A secure, MVC-based platform for hosting and showcasing interactive web projects. Projects run entirely client-side in sandboxed iframes, ensuring safety and isolation.

## Features

- **User Authentication**: Login/registration system with role-based access
- **Project Upload**: Drag & drop ZIP file uploads with validation
- **Gallery View**: Browse all projects in a responsive grid layout
- **Live Demos**: Projects run in sandboxed iframes for security
- **User Dashboard**: Manage your uploaded projects
- **Admin Panel**: Approve creators and manage platform

## Architecture

- **Backend**: Node.js + Express (MVC pattern)
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Vanilla JavaScript with HTML/CSS
- **Security**: Sandboxed iframes, JWT authentication, role-based access

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/project-platform
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
MAX_FILE_SIZE=10485760
UPLOAD_DIR=public/projects
```

4. Start MongoDB (if running locally)

5. Run the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. Visit http://localhost:3000

## Project Upload Format

Projects must be uploaded as ZIP files with the following structure:

```
project.zip
├── index.html (required)
├── meta.json (required)
├── main.js
├── styles.css
├── assets/
│   ├── images/
│   └── sounds/
```

### meta.json Structure

```json
{
  "title": "Your Project Title",
  "description": "A brief description",
  "tech": ["JavaScript", "Canvas", "HTML5"],
  "author": "your-email@example.com"
}
```

## Security Model

- **Sandboxed Iframes**: Projects run with restricted permissions
- **No Server Execution**: Only static files are served
- **File Validation**: Strict validation of uploaded ZIPs
- **Role-Based Access**: Admin, Creator, and Visitor roles
- **JWT Authentication**: Secure token-based auth

## User Roles

### Visitor (No Login)
- Browse project gallery
- View and interact with projects
- Read descriptions

### Creator (Login Required)
- Upload new projects (requires admin approval)
- Edit project metadata
- Delete own projects

### Admin
- Approve creator accounts
- Remove any project
- Access admin panel

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/approve/:userId` - Approve creator (admin only)

### Projects
- `GET /api/projects` - Get all public projects
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/user/projects` - Get user's projects
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Upload
- `POST /api/upload` - Upload new project
- `POST /api/upload/validate` - Validate ZIP structure

## Development Phases

### Phase 1 ✅ - Core System
- Express app with MVC structure
- MongoDB models and connections
- Basic authentication
- Project upload and validation
- Iframe-based project rendering

### Phase 2 - Creator Access
- Enhanced dashboard
- Bulk operations
- Project analytics

### Phase 3 - Polish
- Advanced filtering
- Project tags
- Search functionality
- Better error handling

### Phase 4 - Documentation
- API documentation
- Creator guidelines
- Security documentation

## Forbidden Files

The following files/folders are rejected during upload:
- `package.json`, `package-lock.json`, `yarn.lock`
- `.env` files
- `server.js`, `app.js`, `backend.js`
- `node_modules/`
- `.git/`
- Docker files

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
