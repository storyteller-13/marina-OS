/**
 * Email Application Module
 * Self-contained email application (in-memory data only).
 */
const EMAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'friends', 'trash'];

class EmailApp extends BaseApp {
    constructor() {
        super({ windowId: 'email-window', dockItemId: 'email-dock-item' });
        this.data = new EmailData();
        this.currentFolder = 'inbox';
        this.el = {};
        this.init();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hasReply(email) {
        if (!email.from) return false;
        const sent = this.data.getFolder('sent');
        return sent.some(s => s.to === email.from &&
            (s.subject.startsWith('Re: ') || s.subject.toLowerCase().includes(email.subject.toLowerCase())));
    }

    init() {
        super.init();
        if (!this.window) return;
        this.cacheElements();
        this.setupEventListeners();
        this.updateFolderCounts();
    }

    cacheElements() {
        this.el.list = document.getElementById('email-list');
        this.el.view = document.getElementById('email-view');
        this.el.viewContent = document.getElementById('email-view-content');
        this.el.badge = document.getElementById('email-count-badge');
    }

    setupEventListeners() {
        super.setupEventListeners();
        const win = this.window;
        win.querySelectorAll('.email-folder[data-folder]').forEach(f => {
            f.addEventListener('click', () => this.switchFolder(f.dataset.folder));
        });
        win.querySelectorAll('.email-toolbar .email-btn[data-folder]').forEach(btn => {
            btn.addEventListener('click', () => this.switchFolder(btn.dataset.folder));
        });
        const backBtn = win.querySelector('#back-to-list');
        if (backBtn) backBtn.addEventListener('click', () => this.showEmailList());
    }

    open() {
        super.open();
        this.switchFolder(this.currentFolder);
    }

    switchFolder(folderName) {
        this.currentFolder = folderName;
        const win = this.window;
        win.querySelectorAll('.email-folder[data-folder]').forEach(f => {
            f.classList.toggle('active', f.dataset.folder === folderName);
        });
        win.querySelectorAll('.email-toolbar .email-btn[data-folder]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.folder === folderName);
        });
        this.renderEmails();
    }

    renderEmails() {
        const { list, view } = this.el;
        if (!list) return;
        if (view) view.style.display = 'none';
        list.style.display = 'block';

        const emails = this.data.getFolder(this.currentFolder);
        if (emails.length === 0) {
            list.innerHTML = `
                <div class="email-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">no emails yet</div>
                </div>
            `;
            this.updateFolderCounts();
            return;
        }

        list.innerHTML = emails.map(email => {
            const sender = email.from || email.to || 'unknown';
            const unread = !email.read;
            const replied = this.hasReply(email);
            return `
                <div class="email-item ${unread ? 'unread' : ''}" data-email-id="${email.id}">
                    <div class="email-item-header">
                        <div class="email-item-from">
                            ${replied ? '<span class="email-replied-icon">↩️</span>' : ''}
                            ${this.escapeHtml(sender)}
                        </div>
                        <div class="email-item-date">${this.escapeHtml(email.date)}</div>
                    </div>
                    <div class="email-item-subject">${this.escapeHtml(email.subject)}</div>
                    <div class="email-item-preview">${this.escapeHtml(email.preview || '')}</div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.email-item').forEach(item => {
            item.addEventListener('click', () => this.viewEmail(parseInt(item.dataset.emailId, 10)));
        });
        this.updateFolderCounts();
    }

    viewEmail(emailId) {
        const email = this.data.getEmail(this.currentFolder, emailId);
        if (!email) return;

        this.data.markAsRead(this.currentFolder, emailId);
        const { list, view, viewContent } = this.el;
        if (!view || !viewContent) return;

        if (list) list.style.display = 'none';
        view.style.display = 'flex';

        const recipient = email.to ? `to: ${email.to}` : `from: ${email.from}`;
        const body = (email.body || email.preview || '').split('\n')
            .map(line => (line.trim() === '' ? '<br>' : `<p>${this.escapeHtml(line.trim())}</p>`))
            .join('');

        viewContent.innerHTML = `
            <div class="email-view-meta">
                <div class="email-view-field"><strong>${this.escapeHtml(recipient)}</strong></div>
                <div class="email-view-field">date: ${this.escapeHtml(email.date)}</div>
                <div class="email-view-field">subject: ${this.escapeHtml(email.subject)}</div>
            </div>
            <div class="email-view-body">${body}</div>
        `;

        this.updateFolderCounts();
        const item = list?.querySelector(`.email-item[data-email-id="${emailId}"]`);
        if (item) {
            item.classList.remove('unread');
            const subj = item.querySelector('.email-item-subject');
            if (subj) {
                subj.style.fontWeight = 'normal';
                subj.style.color = '#d8b4fe';
            }
        }
    }

    showEmailList() {
        const { list, view } = this.el;
        if (list && view) {
            view.style.display = 'none';
            list.style.display = 'block';
        }
    }

    updateFolderCounts() {
        const win = this.window;
        EMAIL_FOLDERS.forEach(folder => {
            const count = this.data.getUnreadCount(folder);
            const el = win.querySelector(`.email-folder[data-folder="${folder}"] .folder-count`);
            if (el) el.textContent = count;
        });
        this.updateBadge();
    }

    updateBadge() {
        const badge = this.el.badge;
        if (!badge) return;
        const n = this.data.getUnreadCount('inbox');
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : String(n);
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
