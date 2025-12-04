/**
 * Email Application Module
 * Self-contained email application
 */
class EmailApp {
    constructor() {
        this.windowId = 'email-window';
        this.dockItemId = 'email-dock-item';
        this.data = new EmailData();
        this.currentFolder = 'inbox';
        this.window = null;
        this.dockItem = null;

        this.init();
    }

    // Helper method to escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if an email has been replied to
    hasReply(email) {
        if (!email.from) return false; // Can't reply to sent emails

        const sentEmails = this.data.getFolder('sent');
        return sentEmails.some(sentEmail => {
            // Check if the sent email is a reply to this email
            // A reply typically has "Re: " prefix and is sent to the original sender
            const isReply = sentEmail.to === email.from &&
                          (sentEmail.subject.startsWith('Re: ') ||
                           sentEmail.subject.toLowerCase().includes(email.subject.toLowerCase()));
            return isReply;
        });
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);

        if (!this.window) {
            console.error('Email window not found');
            return;
        }

        this.setupEventListeners();
        this.updateFolderCounts();
    }

    setupEventListeners() {
        // Setup dock item click handler
        if (this.dockItem) {
            this.dockItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
                return false;
            });
        }

        // Setup folder switching
        const emailFolders = this.window.querySelectorAll('.email-folder[data-folder]');
        emailFolders.forEach(folder => {
            folder.addEventListener('click', () => {
                this.switchFolder(folder.dataset.folder);
            });
        });

        // Setup toolbar buttons
        const toolbarButtons = this.window.querySelectorAll('.email-toolbar .email-btn[data-folder]');
        toolbarButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchFolder(button.dataset.folder);
            });
        });

        // Setup back button
        const backButton = this.window.querySelector('#back-to-list');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showEmailList();
            });
        }
    }

    open() {
        if (!this.window) return;

        // Use window manager if available
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
        } else {
            // Fallback
            const dockItems = document.querySelectorAll('.dock-item');
            dockItems.forEach(di => di.classList.remove('active'));
            if (this.dockItem) {
                this.dockItem.classList.add('active');
            }

            this.window.style.display = 'block';
            this.window.style.opacity = '0';
            this.window.style.transform = 'translate(0, 0) scale(0.9)';

            void this.window.offsetHeight;

            requestAnimationFrame(() => {
                this.window.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.window.style.opacity = '1';
                this.window.style.transform = 'translate(0, 0) scale(1)';
            });

            if (window.bringToFront) {
                window.bringToFront(this.window);
            }
        }

        // Ensure active states are set for current folder
        this.switchFolder(this.currentFolder);
    }

    close() {
        if (this.dockItem) {
            this.dockItem.classList.remove('active');
        }
    }

    switchFolder(folderName) {
        this.currentFolder = folderName;

        // Update active folder in sidebar
        const emailFolders = this.window.querySelectorAll('.email-folder[data-folder]');
        emailFolders.forEach(f => {
            if (f.dataset.folder === folderName) {
                f.classList.add('active');
            } else {
                f.classList.remove('active');
            }
        });

        // Update active toolbar buttons
        const toolbarButtons = this.window.querySelectorAll('.email-toolbar .email-btn[data-folder]');
        toolbarButtons.forEach(btn => {
            if (btn.dataset.folder === folderName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Render emails for new folder
        this.renderEmails();
    }

    renderEmails() {
        const emailList = document.getElementById('email-list');
        const emailView = document.getElementById('email-view');
        if (!emailList) return;

        // Hide email view, show list
        if (emailView) {
            emailView.style.display = 'none';
        }
        emailList.style.display = 'block';

        const emails = this.data.getFolder(this.currentFolder);

        if (emails.length === 0) {
            emailList.innerHTML = `
                <div class="email-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">no emails yet</div>
                    <div class="empty-subtext">emails will appear here</div>
                </div>
            `;
            this.updateFolderCounts();
            return;
        }

        emailList.innerHTML = emails.map(email => {
            const sender = email.from || email.to || 'unknown';
            const isUnread = !email.read;
            const hasBeenReplied = this.hasReply(email);
            return `
                <div class="email-item ${isUnread ? 'unread' : ''}" data-email-id="${email.id}">
                    <div class="email-item-header">
                        <div class="email-item-from">
                            ${hasBeenReplied ? '<span class="email-replied-icon">↩️</span>' : ''}
                            ${this.escapeHtml(sender)}
                        </div>
                        <div class="email-item-date">${this.escapeHtml(email.date)}</div>
                    </div>
                    <div class="email-item-subject">${this.escapeHtml(email.subject)}</div>
                    <div class="email-item-preview">${this.escapeHtml(email.preview || '')}</div>
                </div>
            `;
        }).join('');

        // Add click handlers to email items
        const emailItems = emailList.querySelectorAll('.email-item');
        emailItems.forEach(item => {
            item.addEventListener('click', () => {
                const emailId = parseInt(item.dataset.emailId);
                this.viewEmail(emailId);
            });
        });

        // Update folder counts
        this.updateFolderCounts();
    }

    viewEmail(emailId) {
        // Always get fresh email data to ensure we have the latest content
        const email = this.data.getEmail(this.currentFolder, emailId);

        if (!email) return;

        // Mark as read
        this.data.markAsRead(this.currentFolder, emailId);

        const emailList = document.getElementById('email-list');
        const emailView = document.getElementById('email-view');
        const emailViewContent = document.getElementById('email-view-content');

        if (!emailView || !emailViewContent) return;

        // Hide list, show view
        if (emailList) {
            emailList.style.display = 'none';
        }
        emailView.style.display = 'flex';

        // Clear content first to ensure update
        emailViewContent.innerHTML = '';

        // Force a reflow to ensure the DOM is ready
        void emailViewContent.offsetHeight;

        // Render email content - re-fetch email data right before rendering to ensure latest content
        const currentEmail = this.data.getEmail(this.currentFolder, emailId);
        if (!currentEmail) return;

        const sender = currentEmail.from || currentEmail.to || 'unknown';
        const recipient = currentEmail.to ? `to: ${currentEmail.to}` : `from: ${currentEmail.from}`;
        const emailBody = currentEmail.body || currentEmail.preview || '';

        // Format the body text - preserve line breaks and empty lines
        const lines = emailBody.split('\n');
        const formattedBody = lines.map((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') {
                // Preserve empty lines as line breaks
                return '<br>';
            }
            // Use trimmed line for paragraph content to avoid extra whitespace
            return `<p>${trimmedLine}</p>`;
        }).join('');

        // Use textContent first to clear, then set innerHTML to ensure update
        emailViewContent.textContent = '';
        emailViewContent.innerHTML = `
            <div class="email-view-meta">
                <div class="email-view-field"><strong>${recipient}</strong></div>
                <div class="email-view-field">date: ${currentEmail.date}</div>
                <div class="email-view-field">subject: ${currentEmail.subject}</div>
            </div>
            <div class="email-view-body">
                ${formattedBody}
            </div>
        `;

        // Update folder counts
        this.updateFolderCounts();

        // Update the email item in the list to show as read
        const emailItem = emailList?.querySelector(`.email-item[data-email-id="${emailId}"]`);
        if (emailItem) {
            emailItem.classList.remove('unread');
            const subjectElement = emailItem.querySelector('.email-item-subject');
            if (subjectElement) {
                subjectElement.style.fontWeight = 'normal';
                subjectElement.style.color = '#d8b4fe';
            }
        }
    }

    showEmailList() {
        const emailList = document.getElementById('email-list');
        const emailView = document.getElementById('email-view');
        if (emailList && emailView) {
            emailView.style.display = 'none';
            emailList.style.display = 'block';
        }
    }

    updateFolderCounts() {
        const folders = ['inbox', 'sent', 'drafts', 'friends', 'trash'];
        folders.forEach(folder => {
            const count = this.data.getUnreadCount(folder);
            const folderElement = document.querySelector(`.email-folder[data-folder="${folder}"]`);
            if (folderElement) {
                const countElement = folderElement.querySelector('.folder-count');
                if (countElement) {
                    countElement.textContent = count;
                }
            }
        });

        // Update email count badge on dock icon
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.getElementById('email-count-badge');
        if (!badge) return;

        const unreadCount = this.data.getUnreadCount('inbox');

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Expose class constructor for testing
window.EmailAppClass = EmailApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.EmailApp = new EmailApp();
    });
} else {
    window.EmailApp = new EmailApp();
}

// Expose open function globally for onclick handlers
window.openEmailWindow = function() {
    if (window.EmailApp) {
        window.EmailApp.open();
    }
};
