import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('BBotApp', () => {
  let dom;
  let window;
  let document;
  let BBotApp;
  let BBotAPI;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="b-bot-window">
            <div id="b-bot-messages"></div>
            <input id="b-bot-input" />
            <button id="b-bot-send-btn">Send</button>
          </div>
          <div id="b-bot-dock-item"></div>
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

    // Load BBotAPI first
    const apiCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/b-bot/b-bot-api.js'), 'utf8');
    eval(apiCode);
    BBotAPI = window.BBotAPI;

    // Load BBotApp
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/b-bot/b-bot.js'), 'utf8');
    eval(code);
    BBotApp = window.BBotAppClass;
  });

  it('should initialize b-bot app', () => {
    const app = new BBotApp();
    expect(app).toBeDefined();
    expect(app.windowId).toBe('b-bot-window');
    expect(app.dockItemId).toBe('b-bot-dock-item');
  });

  it('should add user message', () => {
    const app = new BBotApp();
    app.addMessage('Hello', false);

    const messages = document.getElementById('b-bot-messages');
    const messageDiv = messages.querySelector('.user-message');

    expect(messageDiv).toBeDefined();
    expect(messageDiv.textContent).toContain('Hello');
  });

  it('should add bot message', () => {
    const app = new BBotApp();
    app.addMessage('Hi there!', true);

    const messages = document.getElementById('b-bot-messages');
    const messageDiv = messages.querySelector('.bot-message');

    expect(messageDiv).toBeDefined();
    expect(messageDiv.textContent).toContain('Hi there!');
  });

  it('should escape HTML in messages', () => {
    const app = new BBotApp();
    const escaped = app.escapeHtml('<script>alert("xss")</script>');

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;');
  });

  it('should send message', async () => {
    const app = new BBotApp();
    const input = document.getElementById('b-bot-input');
    input.value = 'Hello';

    await app.sendMessage();

    expect(input.value).toBe('');
    const messages = document.getElementById('b-bot-messages');
    expect(messages.children.length).toBeGreaterThan(0);
  });

  it('should not send empty message', async () => {
    const app = new BBotApp();
    const input = document.getElementById('b-bot-input');
    input.value = '   ';

    const initialMessageCount = document.getElementById('b-bot-messages').children.length;
    await app.sendMessage();
    const finalMessageCount = document.getElementById('b-bot-messages').children.length;

    expect(finalMessageCount).toBe(initialMessageCount);
  });
});
