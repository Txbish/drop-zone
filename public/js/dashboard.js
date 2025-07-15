// Dashboard JavaScript functionality
class Dashboard {
  constructor() {
    this.currentFolderId = null;
    this.currentView = "grid";
    this.selectedItems = new Set();
    this.contextMenu = document.getElementById("context-menu");

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadFolderTree();
    this.loadContent();
  }

  bindEvents() {
    // Navigation events
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => this.handleNavClick(e));
    });

    // New folder button
    document.getElementById("new-folder-btn").addEventListener("click", () => {
      this.showModal("new-folder-modal");
    });

    // Upload file button
    document.getElementById("upload-file-btn").addEventListener("click", () => {
      this.showModal("upload-file-modal");
    });

    // View controls
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleViewChange(e));
    });

    // Search
    document.getElementById("search-input").addEventListener(
      "input",
      this.debounce((e) => this.handleSearch(e), 300)
    );

    // Sort controls
    document.getElementById("sort-select").addEventListener("change", (e) => {
      this.handleSort(e);
    });

    // Modal events
    this.bindModalEvents();

    // Form events
    this.bindFormEvents();

    // Context menu
    document.addEventListener("click", () => this.hideContextMenu());
    document.addEventListener("contextmenu", (e) => this.handleRightClick(e));

    // File drop
    this.bindFileDropEvents();
  }

  bindModalEvents() {
    // Close modal buttons
    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId = e.target.closest("[data-modal]").dataset.modal;
        this.hideModal(modalId);
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }

  bindFormEvents() {
    // New folder form
    document
      .getElementById("new-folder-form")
      .addEventListener("submit", (e) => {
        this.handleNewFolder(e);
      });

    // Upload file form
    document
      .getElementById("upload-file-form")
      .addEventListener("submit", (e) => {
        this.handleFileUpload(e);
      });
  }

  bindFileDropEvents() {
    const dropZone = document.getElementById("file-drop-zone");
    const fileInput = document.getElementById("file-input");

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      fileInput.files = e.dataTransfer.files;
      this.updateFileDropDisplay(e.dataTransfer.files);
    });

    fileInput.addEventListener("change", (e) => {
      this.updateFileDropDisplay(e.target.files);
    });
  }

  updateFileDropDisplay(files) {
    const dropZone = document.getElementById("file-drop-zone");
    if (files.length > 0) {
      dropZone.querySelector(
        "p"
      ).textContent = `${files.length} file(s) selected`;
    }
  }

  async loadFolderTree() {
    try {
      const response = await fetch("/dashboard/tree");
      if (!response.ok) throw new Error("Failed to load folder tree");

      const tree = await response.json();
      this.renderFolderTree(tree);
    } catch (error) {
      this.showMessage("error", "Failed to load folder tree");
    }
  }

  renderFolderTree(
    folders,
    container = document.getElementById("folder-tree"),
    level = 0
  ) {
    if (level === 0) {
      container.innerHTML = "";
    }

    folders.forEach((folder) => {
      const folderEl = document.createElement("div");
      folderEl.className = "tree-item";
      folderEl.style.paddingLeft = `${level * 20}px`;
      folderEl.innerHTML = `
        <i class="fas fa-folder"></i>
        <span>${folder.name}</span>
      `;

      folderEl.addEventListener("click", () => {
        this.currentFolderId = folder.id;
        this.loadContent();
        this.updateBreadcrumb();
      });

      container.appendChild(folderEl);

      if (folder.children && folder.children.length > 0) {
        this.renderFolderTree(folder.children, container, level + 1);
      }
    });
  }

  async loadContent(type = "root") {
    try {
      const params = new URLSearchParams({
        type,
        ...(this.currentFolderId && { folderId: this.currentFolderId }),
      });

      const response = await fetch(`/dashboard/data?${params}`);
      if (!response.ok) throw new Error("Failed to load content");

      const data = await response.json();
      this.renderContent(data);
      this.updateBreadcrumb(data.breadcrumb);
    } catch (error) {
      this.showMessage("error", "Failed to load content");
    }
  }

  renderContent(data) {
    const contentArea = document.getElementById("content-area");
    const { folders, files } = data;

    if (folders.length === 0 && files.length === 0) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>This folder is empty</h3>
          <p>Upload files or create folders to get started</p>
        </div>
      `;
      return;
    }

    let html = "";

    // Render folders
    folders.forEach((folder) => {
      html += this.renderItem({
        ...folder,
        icon: "fas fa-folder",
        type: "folder",
      });
    });

    // Render files
    files.forEach((file) => {
      html += this.renderItem({
        ...file,
        icon: this.getFileIcon(file.mimeType),
        type: "file",
      });
    });

    contentArea.innerHTML = `<div class="items-container ${this.currentView}">${html}</div>`;
    this.bindItemEvents();
  }

  renderItem(item) {
    const sizeDisplay =
      item.type === "file" ? this.formatFileSize(item.size) : "";
    const publicBadge = item.isPublic
      ? '<span class="public-badge">Public</span>'
      : "";

    return `
      <div class="item" data-id="${item.id}" data-type="${item.type}">
        <div class="item-icon">
          <i class="${item.icon}"></i>
        </div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-meta">
            ${sizeDisplay}
            ${publicBadge}
            <span class="item-date">${this.formatDate(item.updatedAt)}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="action-btn" data-action="details">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="action-btn" data-action="more">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
    `;
  }

  bindItemEvents() {
    document.querySelectorAll(".item").forEach((item) => {
      // Double click to open
      item.addEventListener("dblclick", (e) => {
        const itemType = item.dataset.type;
        const itemId = item.dataset.id;

        if (itemType === "folder") {
          this.currentFolderId = itemId;
          this.loadContent();
        } else {
          this.downloadFile(itemId);
        }
      });

      // Single click to select
      item.addEventListener("click", (e) => {
        if (!e.ctrlKey && !e.metaKey) {
          this.clearSelection();
        }
        this.selectItem(item);
      });

      // Action buttons
      item.querySelectorAll(".action-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;

          if (action === "details") {
            this.showItemDetails(item.dataset.id, item.dataset.type);
          } else if (action === "more") {
            this.showContextMenu(e, item);
          }
        });
      });
    });
  }

  selectItem(item) {
    item.classList.add("selected");
    this.selectedItems.add(item.dataset.id);
  }

  clearSelection() {
    document.querySelectorAll(".item.selected").forEach((item) => {
      item.classList.remove("selected");
    });
    this.selectedItems.clear();
  }

  async showItemDetails(id, type) {
    try {
      const response = await fetch(`/dashboard/details/${type}/${id}`);
      if (!response.ok) throw new Error("Failed to load item details");

      const item = await response.json();
      this.renderItemDetails(item);
      document.getElementById("details-panel").classList.add("active");
    } catch (error) {
      this.showMessage("error", "Failed to load item details");
    }
  }

  renderItemDetails(item) {
    const detailsContent = document.getElementById("details-content");

    let html = `
      <div class="detail-item">
        <strong>Name:</strong> ${item.name}
      </div>
      <div class="detail-item">
        <strong>Type:</strong> ${item.type}
      </div>
      <div class="detail-item">
        <strong>Created:</strong> ${this.formatDate(item.createdAt)}
      </div>
      <div class="detail-item">
        <strong>Modified:</strong> ${this.formatDate(item.updatedAt)}
      </div>
    `;

    if (item.type === "file") {
      html += `
        <div class="detail-item">
          <strong>Size:</strong> ${this.formatFileSize(item.size)}
        </div>
        <div class="detail-item">
          <strong>Type:</strong> ${item.mimeType}
        </div>
        <div class="detail-item">
          <strong>Visibility:</strong> ${item.isPublic ? "Public" : "Private"}
        </div>
      `;
    } else {
      html += `
        <div class="detail-item">
          <strong>Items:</strong> ${item.itemCount || 0}
        </div>
      `;
    }

    html += `
      <div class="detail-actions">
        <button class="btn btn-sm btn-primary" onclick="dashboard.downloadFile('${item.id}')">
          <i class="fas fa-download"></i> Download
        </button>
        <button class="btn btn-sm btn-secondary" onclick="dashboard.renameItem('${item.id}', '${item.type}')">
          <i class="fas fa-edit"></i> Rename
        </button>
        <button class="btn btn-sm btn-danger" onclick="dashboard.deleteItem('${item.id}', '${item.type}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    detailsContent.innerHTML = html;
  }

  showContextMenu(e, item) {
    e.preventDefault();
    const menu = this.contextMenu;

    menu.style.display = "block";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    menu.dataset.itemId = item.dataset.id;
    menu.dataset.itemType = item.dataset.type;
  }

  hideContextMenu() {
    this.contextMenu.style.display = "none";
  }

  handleRightClick(e) {
    const item = e.target.closest(".item");
    if (item) {
      this.showContextMenu(e, item);
    }
  }

  async handleNewFolder(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append("parentId", this.currentFolderId || "");

    try {
      const response = await fetch("/folders", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create folder");
      }

      this.hideModal("new-folder-modal");
      this.loadContent();
      this.loadFolderTree();
      this.showMessage("success", "Folder created successfully");
      e.target.reset();
    } catch (error) {
      this.showMessage("error", error.message);
    }
  }

  async handleFileUpload(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append("folderId", this.currentFolderId || "");

    const progressBar = document.getElementById("upload-progress");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    try {
      progressBar.style.display = "block";

      const response = await fetch("/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      this.hideModal("upload-file-modal");
      this.loadContent();
      this.showMessage("success", "File uploaded successfully");
      e.target.reset();
      progressBar.style.display = "none";
    } catch (error) {
      this.showMessage("error", error.message);
      progressBar.style.display = "none";
    }
  }

  async handleSearch(e) {
    const query = e.target.value.trim();

    if (query.length === 0) {
      this.loadContent();
      return;
    }

    try {
      const response = await fetch(
        `/dashboard/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      this.renderContent(data);
    } catch (error) {
      this.showMessage("error", "Search failed");
    }
  }

  handleSort(e) {
    const sortBy = e.target.value;
    const items = Array.from(document.querySelectorAll(".item"));

    items.sort((a, b) => {
      // Implementation for sorting logic
      return 0; // Placeholder
    });

    const container = document.querySelector(".items-container");
    items.forEach((item) => container.appendChild(item));
  }

  handleViewChange(e) {
    document
      .querySelectorAll(".view-btn")
      .forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");

    this.currentView = e.target.dataset.view;
    document.querySelector(
      ".items-container"
    ).className = `items-container ${this.currentView}`;
  }

  handleNavClick(e) {
    document
      .querySelectorAll(".nav-item")
      .forEach((item) => item.classList.remove("active"));
    e.target.classList.add("active");

    const type = e.target.dataset.type;
    this.currentFolderId =
      e.target.dataset.path === "/" ? null : e.target.dataset.path;
    this.loadContent(type);
  }

  updateBreadcrumb(breadcrumb = []) {
    const breadcrumbEl = document.getElementById("breadcrumb");

    let html = `
      <span class="breadcrumb-item ${
        !this.currentFolderId ? "active" : ""
      }" data-path="/">
        <i class="fas fa-home"></i> Home
      </span>
    `;

    breadcrumb.forEach((item, index) => {
      const isLast = index === breadcrumb.length - 1;
      html += `
        <i class="fas fa-chevron-right"></i>
        <span class="breadcrumb-item ${isLast ? "active" : ""}" data-path="${
        item.id
      }">
          ${item.name}
        </span>
      `;
    });

    breadcrumbEl.innerHTML = html;

    // Bind breadcrumb click events
    breadcrumbEl.querySelectorAll(".breadcrumb-item").forEach((item) => {
      item.addEventListener("click", () => {
        const path = item.dataset.path;
        this.currentFolderId = path === "/" ? null : path;
        this.loadContent();
      });
    });
  }

  downloadFile(fileId) {
    window.open(`/files/${fileId}`, "_blank");
  }

  async deleteItem(id, type) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const endpoint = type === "folder" ? `/folders/${id}` : `/files/${id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${type}`);
      }

      this.loadContent();
      this.loadFolderTree();
      this.showMessage("success", `${type} deleted successfully`);
      document.getElementById("details-panel").classList.remove("active");
    } catch (error) {
      this.showMessage("error", error.message);
    }
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add("active");
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
  }

  showMessage(type, message) {
    // Create and show flash message
    const container =
      document.querySelector(".messages-container") ||
      document.querySelector(".container");

    const messageEl = document.createElement("div");
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
      <i class="fas fa-${this.getMessageIcon(type)}"></i>
      ${message}
    `;

    container.insertBefore(messageEl, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  getMessageIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  getFileIcon(mimeType) {
    if (mimeType.startsWith("image/")) return "fas fa-image";
    if (mimeType.startsWith("video/")) return "fas fa-video";
    if (mimeType.startsWith("audio/")) return "fas fa-music";
    if (mimeType.includes("pdf")) return "fas fa-file-pdf";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "fas fa-file-powerpoint";
    if (mimeType.includes("zip") || mimeType.includes("archive"))
      return "fas fa-file-archive";
    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});

// Close details panel
document.getElementById("close-details").addEventListener("click", () => {
  document.getElementById("details-panel").classList.remove("active");
});

// Context menu actions
document.getElementById("context-menu").addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const menu = e.target.closest("#context-menu");
  const itemId = menu.dataset.itemId;
  const itemType = menu.dataset.itemType;

  switch (action) {
    case "download":
      if (itemType === "file") {
        dashboard.downloadFile(itemId);
      }
      break;
    case "delete":
      dashboard.deleteItem(itemId, itemType);
      break;
    // Add more actions as needed
  }

  dashboard.hideContextMenu();
});
