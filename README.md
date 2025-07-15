# 🚀 DropZone - Secure File Sharing Platform

<div align="center">

![DropZone Logo](https://img.shields.io/badge/DropZone-File%20Sharing-blue?style=for-the-badge&logo=dropbox&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-drop--zone.onrender.app-success?style=for-the-badge&logo=render)](https://drop-zone.onrender.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)

*The simplest and most secure way to share your files with anyone, anywhere.*

[🌟 Features](#-features) • [🚀 Live Demo](#-live-demo) • [⚡ Quick Start](#-quick-start) • [📚 API](#-api-documentation) • [🛠️ Tech Stack](#️-tech-stack)

</div>

---

## 🌟 Features

### 🔐 **Secure Authentication**
- User registration and login with bcrypt password hashing
- Session-based authentication with Passport.js
- Secure session management with Prisma Session Store

### 📁 **Smart File Management**
- **Nested folder structure** - Create unlimited nested folders
- **Drag & drop uploads** - Modern, intuitive file uploading
- **Multiple file upload** - Upload multiple files simultaneously
- **File organization** - Organize files in custom folder hierarchies
- **Search functionality** - Find files and folders quickly

### ☁️ **Cloud Storage Integration**
- **Cloudinary integration** - Reliable cloud storage
- **Automatic backups** - Files stored securely in the cloud
- **Migration support** - Seamless migration from local to cloud storage
- **CDN delivery** - Fast file access worldwide

### 🔗 **Advanced Sharing System**
- **Secure share links** - Generate time-limited sharing links
- **Flexible expiration** - Set custom expiration times (minutes, hours, days)
- **Public access** - No account required for file access
- **Share management** - View, extend, or deactivate shares
- **Access tracking** - Monitor when your files are accessed

### 🎨 **Modern User Interface**
- **Responsive design** - Works on all devices
- **Dark/Light themes** - Beautiful, accessible design
- **Real-time feedback** - Instant notifications and progress indicators
- **Intuitive navigation** - Easy-to-use dashboard interface

### ⚡ **Performance & Reliability**
- **Health monitoring** - Built-in health checks
- **Error handling** - Comprehensive error management
- **Background processing** - Non-blocking operations
- **Self-healing** - Automatic service recovery on Render

---

## 🚀 Live Demo

**🌐 Visit the live application:** [drop-zone.onrender.app](https://drop-zone.onrender.app)

### Test Credentials
Create your own account or use the platform to experience:
- ✅ User registration and authentication
- ✅ File upload and organization
- ✅ Folder creation and management
- ✅ Secure file sharing
- ✅ Real-time dashboard updates

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Cloudinary account

### 1. Clone & Install
```bash
git clone https://github.com/txbish/drop-zone.git
cd drop-zone
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dropzone"

# Session
SESSION_SECRET="your-super-secret-session-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NODE_ENV="development"
PORT=3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Development
```bash
# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

### 5. Migration (Optional)
If migrating from local storage:
```bash
npm run migrate-to-cloudinary
```

---

## 🏗️ Architecture

### Project Structure
```
📦 DropZone
├── 🎯 src/
│   ├── 🎮 controller/        # Business logic
│   ├── 🛣️  routes/           # API endpoints
│   ├── 🔧 config/            # App configuration
│   ├── 🛡️  middleware/       # Security & validation
│   ├── 🗄️  database/         # Database client
│   └── 📝 types/             # TypeScript definitions
├── 🎨 views/                 # EJS templates
├── 🌐 public/                # Static assets
├── 📊 prisma/                # Database schema & migrations
└── 📜 scripts/               # Utility scripts
```

### Database Schema
```mermaid
erDiagram
    User ||--o{ File : owns
    User ||--o{ Folder : owns
    User ||--o{ FolderShare : creates
    Folder ||--o{ File : contains
    Folder ||--o{ Folder : "nested in"
    Folder ||--o{ FolderShare : "shared via"
    
    User {
        string id PK
        string username UK
        string password
        datetime createdAt
        datetime updatedAt
    }
    
    Folder {
        string id PK
        string name
        string parentId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    File {
        string id PK
        string originalName
        string storedName
        string cloudinaryUrl
        string secureUrl
        string mimeType
        int size
        string folderId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    FolderShare {
        string id PK
        string shareToken UK
        string folderId FK
        string userId FK
        datetime expiresAt
        boolean isActive
        datetime createdAt
    }
```

---

## 📚 API Documentation

### Authentication Endpoints
```http
POST   /signup              # Create new account
POST   /login               # User authentication
GET    /logout              # End session
```

### File Management
```http
GET    /dashboard           # Main dashboard view
GET    /dashboard/data      # Get folders and files
POST   /files/upload        # Upload files
DELETE /files/:id           # Delete file
GET    /files/download/:id  # Download file
```

### Folder Operations
```http
POST   /folders             # Create new folder
PUT    /folders/:id         # Rename folder
DELETE /folders/:id         # Delete folder
GET    /folders/:id/tree    # Get folder structure
```

### Sharing System
```http
POST   /share/create        # Create share link
GET    /share/my-shares     # Get user's shares
PATCH  /share/deactivate/:token  # Deactivate share
PATCH  /share/extend/:token      # Extend expiration
GET    /share/:token         # Access shared folder
```

### Utilities
```http
GET    /health              # Health check
GET    /dashboard/search    # Search files/folders
```

---

## 🛠️ Tech Stack

### **Backend**
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Passport.js** - Authentication middleware
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database

### **File Storage**
- **Cloudinary** - Cloud storage & CDN
- **Multer** - File upload handling
- **multer-storage-cloudinary** - Cloudinary integration

### **Frontend**
- **EJS** - Server-side templating
- **Vanilla JavaScript** - Client-side interactions
- **CSS3** - Modern styling with grid/flexbox
- **Font Awesome** - Icon library

### **Security & Validation**
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **express-session** - Session management
- **UUID** - Unique identifier generation

### **Development & Deployment**
- **ts-node-dev** - Development server
- **Morgan** - HTTP request logging
- **Render** - Cloud deployment platform

---

## 🚀 Deployment

### Render Deployment
The application is configured for easy Render deployment:

1. **Automatic Builds** - Configured with `render.yaml`
2. **Health Checks** - Built-in health monitoring
3. **Environment Variables** - Secure configuration management
4. **Auto-scaling** - Handles traffic spikes

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Session encryption key | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `PORT` | Server port (default: 3000) | ❌ |

### Database Configuration
The application uses PostgreSQL with Prisma ORM:
- **Connection pooling** for performance
- **Migration system** for schema updates
- **Type-safe** database queries

---

## 📊 Features Deep Dive

### 🔐 Security Features
- **Password Security**: bcrypt with salt rounds
- **Session Security**: Secure session cookies
- **Input Validation**: Comprehensive request validation
- **File Security**: Type and size validation
- **Share Security**: Time-limited access tokens

### 📁 File Management
- **Nested Folders**: Unlimited folder depth
- **Bulk Operations**: Select and manage multiple items
- **Smart Search**: Find files across all folders
- **File Metadata**: Track size, type, and creation dates

### 🔗 Sharing System
- **Flexible Expiration**: Minutes to days
- **Public Access**: No registration required
- **Share Analytics**: Track access and usage
- **Share Management**: Full control over active shares

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure responsive design

---

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Tabish** ([@txbish](https://github.com/txbish))

- GitHub: [@txbish](https://github.com/txbish)
- Project: [drop-zone](https://github.com/txbish/drop-zone)
- Live Demo: [drop-zone.onrender.app](https://drop-zone.onrender.app)

---

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the need for simple, secure file sharing
- Thanks to the open-source community for amazing tools

---

<div align="center">

### 🌟 Star this project if you found it helpful!

[![GitHub stars](https://img.shields.io/github/stars/txbish/drop-zone?style=social)](https://github.com/txbish/drop-zone/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/txbish/drop-zone?style=social)](https://github.com/txbish/drop-zone/network/members)

**[⬆ Back to top](#-dropzone---secure-file-sharing-platform)**

</div>
