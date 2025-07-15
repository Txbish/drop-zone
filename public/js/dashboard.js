// Dashboard JavaScript functionality
class Dashboard {
  constructor() {
    this.currentFolderId = null;
    this.currentView = "grid";
    this.selectedItems = new Set();
    this.contextMenu = document.getElementById("context-menu");

    this.init();
  }

  // Debounce utility function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Show message utility function
  showMessage(type, message) {
    // Try to find an existing message container
    let messageContainer = document.getElementById("message-container");

    // If no container exists, create one
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "message-container";
      messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `message message-${type}`;
    messageEl.style.cssText = `
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      cursor: pointer;
    `;

    // Set background color based on type
    switch (type) {
      case "success":
        messageEl.style.backgroundColor = "#28a745";
        break;
      case "error":
        messageEl.style.backgroundColor = "#dc3545";
        break;
      case "warning":
        messageEl.style.backgroundColor = "#ffc107";
        messageEl.style.color = "#212529";
        break;
      case "info":
        messageEl.style.backgroundColor = "#17a2b8";
        break;
      default:
        messageEl.style.backgroundColor = "#6c757d";
    }

    messageEl.textContent = message;

    // Add to container
    messageContainer.appendChild(messageEl);

    // Animate in
    setTimeout(() => {
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateX(0)";
    }, 10);

    // Auto remove after 5 seconds or on click
    const removeMessage = () => {
      messageEl.style.opacity = "0";
      messageEl.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    };

    messageEl.addEventListener("click", removeMessage);
    setTimeout(removeMessage, 5000);
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

    // Share form submission
    document
      .getElementById("share-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const modal = document.getElementById("share-modal");
        const folderId = modal.dataset.folderId;
        const duration = document.querySelector('input[name="duration"]:checked')?.value;

        if (!duration) {
          this.showMessage("error", "Please select a duration");
          return;
        }

        try {
          const submitButton = e.target.querySelector('button[type="submit"]');
          const originalText = submitButton.innerHTML;
          submitButton.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Creating...';
          submitButton.disabled = true;

          const shareData = await this.createFolderShare(folderId, duration);
          this.showShareCreated(shareData);
          this.showMessage("success", "Share link created successfully!");
        } catch (error) {
          // Check if this is a "folder already has share" error
          if (error.message.includes('already has an active share') && error.shareData) {
            this.showExistingShare(error.shareData);
          } else {
            this.showMessage("error", error.message);
          }
        } finally {
          const submitButton = e.target.querySelector('button[type="submit"]');
          submitButton.innerHTML =
            '<i class="fas fa-share-alt"></i> Generate Share Link';
          submitButton.disabled = false;
        }
      });

    // Copy share link button
    document.getElementById("copy-share-link").addEventListener("click", () => {
      this.copyShareLinkToClipboard();
    });

    // Manage shares button
    document
      .getElementById("manage-shares-btn")
      .addEventListener("click", () => {
        this.showManageShares();
      });

    // Back to create button
    document.getElementById("back-to-create").addEventListener("click", () => {
      this.showCreateShare();
    });

    // Context menu type detection
    document.addEventListener("contextmenu", (e) => {
      const itemEl = e.target.closest(".grid-item, .list-item");
      const contextMenu = document.getElementById("context-menu");

      if (itemEl) {
        const itemType = itemEl.dataset.type;
        contextMenu.dataset.type = itemType;
      }
    });
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

    // Rename form
    document.getElementById("rename-form").addEventListener("submit", (e) => {
      this.handleRename(e);
    });

    // Move form
    document.getElementById("move-form").addEventListener("submit", (e) => {
      this.handleMove(e);
    });
  }

  bindFileDropEvents() {
    const dropZone = document.getElementById("file-drop-zone");
    const fileInput = document.getElementById("file-input");

    // Handle click on drop zone (but not on the file input itself)
    dropZone.addEventListener("click", (e) => {
      // Only trigger file input if we didn't click directly on the input
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

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

    // Prevent the file input from triggering the drop zone click
    fileInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  updateFileDropDisplay(files) {
    const dropZone = document.getElementById("file-drop-zone");
    const fileCount = files ? files.length : 0;

    if (fileCount > 0) {
      const fileName = files[0].name;
      dropZone.querySelector("p").textContent =
        fileCount === 1
          ? `Selected: ${fileName}`
          : `${fileCount} files selected`;
    } else {
      dropZone.querySelector("p").textContent =
        "Drag and drop a file here or click to browse";
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

    // Use originalName for files, name for folders
    const itemName =
      item.type === "file" ? item.originalName || item.name : item.name;

    return `
      <div class="item" data-id="${item.id}" data-type="${item.type}">
        <div class="item-icon">
          <i class="${item.icon}"></i>
        </div>
        <div class="item-info">
          <div class="item-name">${itemName}</div>
          <div class="item-meta">
            ${sizeDisplay}
            ${publicBadge}
            <span class="item-date">${this.formatDate(
              item.updatedAt || item.createdAt
            )}</span>
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

    const itemType = item.dataset.type;
    menu.dataset.itemId = item.dataset.id;
    menu.dataset.itemType = itemType;

    // Store the item name for rename functionality
    const itemNameEl = item.querySelector(".item-name");
    const itemName = itemNameEl ? itemNameEl.textContent.trim() : "";
    menu.dataset.itemName = itemName;

    // Show/hide folder-specific options
    const folderOnlyItems = menu.querySelectorAll(".folder-only");
    folderOnlyItems.forEach((item) => {
      item.style.display = itemType === "folder" ? "flex" : "none";
    });
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
    const folderData = {
      name: formData.get("name"),
      parentId: this.currentFolderId || null,
    };

    try {
      const response = await fetch("/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(folderData),
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

    // Only append folderId if we have a current folder
    if (this.currentFolderId) {
      formData.append("folderId", this.currentFolderId);
    }

    // Handle isPublic checkbox - convert to proper boolean
    const isPublicCheckbox = e.target.querySelector("#make-public");
    if (isPublicCheckbox) {
      // Remove the original isPublic value that might be "on" string
      formData.delete("isPublic");
      // Add proper boolean value
      formData.append("isPublic", isPublicCheckbox.checked ? "true" : "false");
    }

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

  async handleRename(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newName = formData.get("name");

    // Get item details from the form's data attributes
    const form = e.target;
    const itemId = form.dataset.itemId;
    const itemType = form.dataset.itemType;

    try {
      const endpoint =
        itemType === "folder" ? `/folders/${itemId}` : `/files/${itemId}`;
      const body =
        itemType === "folder" ? { name: newName } : { originalName: newName };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to rename ${itemType}`);
      }

      this.hideModal("rename-modal");
      this.loadContent();
      this.loadFolderTree();
      this.showMessage("success", `${itemType} renamed successfully`);
      e.target.reset();
    } catch (error) {
      this.showMessage("error", error.message);
    }
  }

  async handleMove(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const destinationFolderId = formData.get("destinationFolderId") || null;

    // Get item details from the form's data attributes
    const form = e.target;
    const itemId = form.dataset.itemId;
    const itemType = form.dataset.itemType;

    try {
      const endpoint =
        itemType === "folder" ? `/folders/${itemId}` : `/files/${itemId}`;

      // For folders, use parentId. For files, use folderId
      const body =
        itemType === "folder"
          ? { parentId: destinationFolderId }
          : { folderId: destinationFolderId };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to move ${itemType}`);
      }

      this.hideModal("move-modal");
      this.loadContent();
      this.loadFolderTree();
      this.showMessage("success", `${itemType} moved successfully`);
      e.target.reset();
    } catch (error) {
      this.showMessage("error", error.message);
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

  showRenameModal(itemId, itemType, currentName) {
    const modal = document.getElementById("rename-modal");
    const form = document.getElementById("rename-form");
    const nameInput = document.getElementById("new-name");
    const typeSpan = document.getElementById("rename-item-type");

    // Set form data attributes
    form.dataset.itemId = itemId;
    form.dataset.itemType = itemType;

    // Set current name as default value
    nameInput.value = currentName;

    // Update modal title
    typeSpan.textContent = itemType.charAt(0).toUpperCase() + itemType.slice(1);

    this.showModal("rename-modal");

    // Focus and select the name input
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 100);
  }

  // Function to rename item from details panel
  renameItem(itemId, itemType) {
    // Find the current name from the details panel or content
    const detailsContent = document.getElementById("details-content");
    const nameElement = detailsContent.querySelector(".detail-item strong");
    let currentName = "";

    if (nameElement && nameElement.nextSibling) {
      currentName = nameElement.nextSibling.textContent.trim();
    }

    // Fall back to finding it in the main content area
    if (!currentName) {
      const itemElement = document.querySelector(`[data-id="${itemId}"]`);
      if (itemElement) {
        const nameEl = itemElement.querySelector(".item-name");
        currentName = nameEl ? nameEl.textContent.trim() : "";
      }
    }

    this.showRenameModal(itemId, itemType, currentName);
  }

  async showMoveModal(itemId, itemType, itemName) {
    const modal = document.getElementById("move-modal");
    const form = document.getElementById("move-form");
    const itemNameSpan = document.getElementById("move-item-name");
    const currentLocationSpan = document.getElementById(
      "move-current-location"
    );
    const submitButton = document.getElementById("move-submit-btn");

    // Set form data attributes
    form.dataset.itemId = itemId;
    form.dataset.itemType = itemType;

    // Update modal title and current location
    itemNameSpan.textContent = itemName;
    currentLocationSpan.textContent = this.getCurrentLocationText();

    // Reset selection
    document.getElementById("selected-destination").value = "";
    submitButton.disabled = true;

    this.showModal("move-modal");

    // Load folder tree for selection
    await this.loadMoveFolderTree(itemId, itemType);
  }

  getCurrentLocationText() {
    if (!this.currentFolderId) {
      return "Root Folder";
    }

    // Try to get current folder name from breadcrumb or folder tree
    const breadcrumbItems = document.querySelectorAll(".breadcrumb-item");
    if (breadcrumbItems.length > 0) {
      const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
      return lastItem.textContent.trim();
    }

    return "Current Folder";
  }

  async loadMoveFolderTree(excludeItemId, excludeItemType) {
    const treeContainer = document.getElementById("move-folder-tree");
    const loadingEl = document.getElementById("move-tree-loading");

    try {
      loadingEl.style.display = "block";

      const response = await fetch("/dashboard/tree");
      if (!response.ok) throw new Error("Failed to load folder tree");

      const folders = await response.json();

      loadingEl.style.display = "none";

      // Clear existing tree (except root folder)
      const existingItems = treeContainer.querySelectorAll(
        ".tree-item:not(.root-folder)"
      );
      existingItems.forEach((item) => item.remove());

      // Render folder tree
      this.renderMoveTree(
        folders,
        treeContainer,
        excludeItemId,
        excludeItemType
      );

      // Bind click events
      this.bindMoveTreeEvents();
    } catch (error) {
      loadingEl.style.display = "none";
      this.showMessage("error", "Failed to load folders");
    }
  }

  renderMoveTree(
    folders,
    container,
    excludeItemId,
    excludeItemType,
    level = 1
  ) {
    folders.forEach((folder) => {
      // Skip the folder we're trying to move (can't move into itself)
      if (excludeItemType === "folder" && folder.id === excludeItemId) {
        return;
      }

      const folderEl = document.createElement("div");
      folderEl.className = "tree-item";
      folderEl.style.paddingLeft = `${level * 20}px`;
      folderEl.dataset.folderId = folder.id;
      folderEl.innerHTML = `
        <i class="fas fa-folder"></i>
        <span>${folder.name}</span>
      `;

      container.appendChild(folderEl);

      // Recursively render children
      if (folder.children && folder.children.length > 0) {
        this.renderMoveTree(
          folder.children,
          container,
          excludeItemId,
          excludeItemType,
          level + 1
        );
      }
    });
  }

  bindMoveTreeEvents() {
    const treeContainer = document.getElementById("move-folder-tree");
    const selectedDestinationInput = document.getElementById(
      "selected-destination"
    );
    const submitButton = document.getElementById("move-submit-btn");

    treeContainer.querySelectorAll(".tree-item").forEach((item) => {
      item.addEventListener("click", () => {
        // Remove previous selection
        treeContainer.querySelectorAll(".tree-item").forEach((el) => {
          el.classList.remove("selected");
        });

        // Add selection to clicked item
        item.classList.add("selected");

        // Update hidden input and enable submit button
        const folderId = item.dataset.folderId || "";
        selectedDestinationInput.value = folderId;
        submitButton.disabled = false;

        // Update submit button text
        const folderName = item.querySelector("span").textContent;
        submitButton.textContent = folderId
          ? `Move to "${folderName}"`
          : "Move to Root";
      });
    });
  }

  // Utility function to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Utility function to format date
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Utility function to get file icon based on mime type
  getFileIcon(mimeType) {
    if (!mimeType) return "fas fa-file";

    // Image files
    if (mimeType.startsWith("image/")) {
      return "fas fa-file-image";
    }

    // Video files
    if (mimeType.startsWith("video/")) {
      return "fas fa-file-video";
    }

    // Audio files
    if (mimeType.startsWith("audio/")) {
      return "fas fa-file-audio";
    }

    // Document types
    if (mimeType.includes("pdf")) {
      return "fas fa-file-pdf";
    }

    if (mimeType.includes("word") || mimeType.includes("document")) {
      return "fas fa-file-word";
    }

    if (mimeType.includes("sheet") || mimeType.includes("excel")) {
      return "fas fa-file-excel";
    }

    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return "fas fa-file-powerpoint";
    }

    // Archive files
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    ) {
      return "fas fa-file-archive";
    }

    // Code files
    if (
      mimeType.includes("text/") ||
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("html") ||
      mimeType.includes("css")
    ) {
      return "fas fa-file-code";
    }

    // Default file icon
    return "fas fa-file";
  }

  // Utility function for copying share links

  // Share folder functionality
  async showShareModal(folderId, folderName) {
    const modal = document.getElementById("share-modal");
    const folderNameSpan = document.getElementById("share-folder-name");
    const createSection = document.getElementById("create-share-section");
    const createdSection = document.getElementById("share-created-section");
    const sharesSection = document.getElementById("my-shares-section");

    // Store folder info in modal
    modal.dataset.folderId = folderId;
    modal.dataset.folderName = folderName;

    // Update modal title
    folderNameSpan.textContent = folderName;

    // Reset sections
    createSection.style.display = "block";
    createdSection.style.display = "none";
    sharesSection.style.display = "none";

    // Reset form
    document.getElementById("share-form").reset();

    this.showModal("share-modal");
  }

  async createFolderShare(folderId, duration) {
    try {
      const response = await fetch("/share/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: folderId,
          duration: duration,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create share");
      }

      return result.share;
    } catch (error) {
      console.error("Error creating folder share:", error);
      throw error;
    }
  }

  showShareCreated(shareData) {
    const createSection = document.getElementById("create-share-section");
    const createdSection = document.getElementById("share-created-section");
    const shareLinkInput = document.getElementById("share-link");
    const expiresSpan = document.getElementById("share-expires-date");
    const createdSpan = document.getElementById("share-created-date");

    // Hide create form and show success
    createSection.style.display = "none";
    createdSection.style.display = "block";

    // Populate share data
    shareLinkInput.value = shareData.shareUrl;
    expiresSpan.textContent = new Date(shareData.expiresAt).toLocaleString();
    createdSpan.textContent = new Date(shareData.createdAt).toLocaleString();
  }

  async copyShareLinkToClipboard() {
    const shareLinkInput = document.getElementById("share-link");
    try {
      await navigator.clipboard.writeText(shareLinkInput.value);
      this.showMessage("success", "Share link copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers
      shareLinkInput.select();
      shareLinkInput.setSelectionRange(0, 99999);
      document.execCommand("copy");
      this.showMessage("success", "Share link copied to clipboard!");
    }
  }

  async loadUserShares() {
    const sharesSection = document.getElementById("my-shares-section");
    const sharesList = document.getElementById("shares-list");
    const loading = document.getElementById("shares-loading");

    try {
      loading.style.display = "block";

      const response = await fetch("/share/my-shares");
      if (!response.ok) throw new Error("Failed to load shares");

      const data = await response.json();
      const shares = data.shares || [];

      loading.style.display = "none";

      if (shares.length === 0) {
        sharesList.innerHTML = `
          <div class="empty-shares">
            <i class="fas fa-share-alt"></i>
            <h4>No shares yet</h4>
            <p>You haven't shared any folders yet.</p>
          </div>
        `;
      } else {
        sharesList.innerHTML = shares
          .map((share) => this.renderShareItem(share))
          .join("");
      }
    } catch (error) {
      loading.style.display = "none";
      this.showMessage("error", "Failed to load shares");
    }
  }

  renderShareItem(share) {
    const isExpired = new Date(share.expiresAt) < new Date();
    const statusClass = !share.isActive
      ? "inactive"
      : isExpired
      ? "expired"
      : "active";
    const statusText = !share.isActive
      ? "inactive"
      : isExpired
      ? "expired"
      : "active";

    return `
      <div class="share-item-new">
        <div class="share-item-info">
          <div class="share-item-name">
            <i class="fas fa-folder"></i> ${share.folder.name}
          </div>
          <div class="share-item-meta">
            <span><i class="fas fa-calendar-plus"></i> Created: ${new Date(
              share.createdAt
            ).toLocaleDateString()}</span>
            <span><i class="fas fa-clock"></i> Expires: ${new Date(
              share.expiresAt
            ).toLocaleDateString()}</span>
            <span><i class="fas fa-eye"></i> Accessed: ${share.accessCount} times</span>
          </div>
        </div>
        <div class="share-item-actions">
          <span class="share-status ${statusClass}">${statusText}</span>
          ${
            share.isActive && !isExpired
              ? `
            <button class="btn btn-secondary btn-icon" onclick="dashboard.copyShareUrl('${share.shareUrl}')" title="Copy Link">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-secondary btn-icon" onclick="dashboard.extendShare('${share.shareToken}')" title="Extend">
              <i class="fas fa-clock"></i>
            </button>
            <button class="btn btn-secondary btn-icon" onclick="dashboard.deactivateShare('${share.shareToken}')" title="Deactivate">
              <i class="fas fa-times"></i>
            </button>
          `
              : `
            <button class="btn btn-secondary btn-icon" onclick="dashboard.reactivateShare('${
              share.shareToken
            }')" title="Reactivate" ${isExpired ? "disabled" : ""}>
              <i class="fas fa-play"></i>
            </button>
          `
          }
        </div>
      </div>
    `;
  }

  async copyShareUrl(shareUrl) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      this.showMessage("success", "Share link copied to clipboard!");
    } catch (error) {
      this.showMessage("error", "Failed to copy link");
    }
  }

  async deactivateShare(shareToken) {
    if (!confirm("Are you sure you want to deactivate this share?")) return;

    try {
      const response = await fetch(`/share/deactivate/${shareToken}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to deactivate share");
      }

      this.showMessage("success", "Share deactivated successfully");
      this.loadUserShares(); // Refresh the list
    } catch (error) {
      this.showMessage("error", error.message);
    }
  }

  async extendShare(shareToken) {
    const duration = prompt(
      "Enter extension duration (e.g., '7d', '1h', '30m'):",
      "7d"
    );
    if (!duration) return;

    try {
      const response = await fetch(`/share/extend/${shareToken}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extend share");
      }

      this.showMessage("success", "Share extended successfully");
      this.loadUserShares(); // Refresh the list
    } catch (error) {
      this.showMessage("error", error.message);
    }
  }

  showManageShares() {
    const createSection = document.getElementById("create-share-section");
    const createdSection = document.getElementById("share-created-section");
    const sharesSection = document.getElementById("my-shares-section");

    createSection.style.display = "none";
    createdSection.style.display = "none";
    sharesSection.style.display = "block";

    this.loadUserShares();
  }

  showCreateShare() {
    const createSection = document.getElementById("create-share-section");
    const createdSection = document.getElementById("share-created-section");
    const sharesSection = document.getElementById("my-shares-section");

    createSection.style.display = "block";
    createdSection.style.display = "none";
    sharesSection.style.display = "none";
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
  const action = e.target.closest(".context-item")?.dataset.action;
  if (!action) return;

  const menu = e.target.closest("#context-menu");
  const itemId = menu.dataset.itemId;
  const itemType = menu.dataset.itemType;
  const itemName = menu.dataset.itemName;

  switch (action) {
    case "download":
      if (itemType === "file") {
        dashboard.downloadFile(itemId);
      } else {
        dashboard.showMessage("info", "Only files can be downloaded");
      }
      break;
    case "rename":
      dashboard.showRenameModal(itemId, itemType, itemName);
      break;
    case "copy-link":
      dashboard.copyShareLink(itemId, itemType);
      break;
    case "delete":
      dashboard.deleteItem(itemId, itemType);
      break;
    case "move":
      dashboard.showMoveModal(itemId, itemType, itemName);
      break;
    case "share":
      if (itemType === "folder") {
        dashboard.showShareModal(itemId, itemName);
      } else {
        dashboard.showMessage("info", "Only folders can be shared");
      }
      break;
    default:
      console.log("Unknown action:", action);
  }

  dashboard.hideContextMenu();
});
