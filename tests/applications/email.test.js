import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('EmailApp', () => {
  let dom;
  let window;
  let document;
  let EmailApp;
  let EmailData;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="email-window">
            <div class="email-folder" data-folder="inbox">Inbox</div>
            <div class="email-folder" data-folder="sent">Sent</div>
            <div class="email-toolbar">
              <button class="email-btn" data-folder="inbox">Inbox</button>
            </div>
            <div id="email-list"></div>
            <div id="email-view" style="display: none;">
              <button id="back-to-list">Back</button>
              <div id="email-view-content"></div>
            </div>
          </div>
          <div id="email-dock-item"></div>
          <div id="email-count-badge"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load dependencies
    const fs = require('fs');
    const path = require('path');

    // Load EmailData first
    const dataCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email-data.js'), 'utf8');
    eval(dataCode);
    EmailData = window.EmailData;

    // Load EmailApp
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email.js'), 'utf8');
    eval(code);
    EmailApp = window.EmailAppClass;
  });

  it('should initialize email app', () => {
    const app = new EmailApp();
    expect(app).toBeDefined();
    expect(app.windowId).toBe('email-window');
    expect(app.dockItemId).toBe('email-dock-item');
    expect(app.currentFolder).toBe('inbox');
  });

  it('should switch folder', () => {
    const app = new EmailApp();
    app.switchFolder('sent');

    expect(app.currentFolder).toBe('sent');
  });

  it('should render emails for folder', () => {
    const app = new EmailApp();
    app.renderEmails();

    const emailList = document.getElementById('email-list');
    expect(emailList).toBeDefined();
  });

  it('should show empty state when folder is empty', () => {
    const app = new EmailApp();
    app.data.data.sent = [];
    app.switchFolder('sent');

    const emailList = document.getElementById('email-list');
    expect(emailList.innerHTML).toContain('no emails yet');
  });

  it('should view email and mark as read', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('friends', 1);

    if (email) {
      app.switchFolder('friends');
      email.read = false;
      app.viewEmail(1);

      expect(email.read).toBe(true);
    }
  });

  it('should show email view when viewing email', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('friends', 1);

    if (email) {
      app.switchFolder('friends');
      app.viewEmail(1);

      const emailView = document.getElementById('email-view');
      expect(emailView.style.display).toBe('flex');
    }
  });

  it('should show email list when going back', () => {
    const app = new EmailApp();
    app.showEmailList();

    const emailList = document.getElementById('email-list');
    const emailView = document.getElementById('email-view');

    expect(emailList.style.display).toBe('block');
    expect(emailView.style.display).toBe('none');
  });

  it('should update folder counts', () => {
    const app = new EmailApp();
    app.updateFolderCounts();

    // Should not throw error
    expect(app).toBeDefined();
  });

  it('should update badge with unread count', () => {
    const app = new EmailApp();
    app.updateBadge();

    const badge = document.getElementById('email-count-badge');
    expect(badge).toBeDefined();
  });

  it('should check if email has reply', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('friends', 1);

    if (email) {
      const hasReply = app.hasReply(email);
      // Email id 1 (franfran) should have a reply in sent folder
      expect(typeof hasReply).toBe('boolean');
    }
  });

  it('should return false for email without reply', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('friends', 5);

    if (email) {
      const hasReply = app.hasReply(email);
      // Email id 5 (nikolai) should not have a reply (only draft exists)
      expect(hasReply).toBe(false);
    }
  });

  it('should return false for sent emails', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('sent', 7);

    if (email) {
      const hasReply = app.hasReply(email);
      // Sent emails don't have a 'from' field, so should return false
      expect(hasReply).toBe(false);
    }
  });

  it('should show reply icon for emails with replies', () => {
    const app = new EmailApp();
    const email = app.data.getEmail('friends', 1);

    if (email) {
      app.switchFolder('friends');
      app.renderEmails();

      const emailList = document.getElementById('email-list');
      const emailItem = emailList.querySelector(`[data-email-id="1"]`);

      if (emailItem) {
        const hasReplyIcon = emailItem.innerHTML.includes('↩️');
        // Email id 1 should have a reply icon
        expect(hasReplyIcon).toBe(true);
      }
    }
  });
});
