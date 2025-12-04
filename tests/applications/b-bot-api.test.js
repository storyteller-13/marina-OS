import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('BBotAPI', () => {
  let dom;
  let window;
  let document;
  let BBotAPI;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load BBotAPI class
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/b-bot/b-bot-api.js'), 'utf8');
    eval(code);
    BBotAPI = window.BBotAPI;
  });

  it('should initialize with config', () => {
    const api = new BBotAPI();
    expect(api.config).toBeDefined();
    expect(api.config.model).toBe('gpt-3.5-turbo');
  });

  it('should return sleeping message', async () => {
    const api = new BBotAPI();
    api.config.useOllama = false; // Disable Ollama to test sleeping message
    const response = await api.getResponse('hello');

    expect(response).toBe("i'm sleeping for now, come back later");
  });

  it('should have fallback response for hello', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('hello');

    expect(response).toContain('hello');
  });

  it('should have fallback response for help', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('help');

    expect(response).toContain('help');
  });

  it('should have fallback response for who are you', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('who are you');

    expect(response).toContain('b-bot');
  });

  it('should have fallback response for goodbye', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('goodbye');

    expect(response).toContain('goodbye');
  });

  it('should have fallback response for thanks', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('thanks');

    expect(response).toContain('welcome');
  });

  it('should have fallback response for time', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('what time is it');

    expect(response).toContain('time');
  });

  it('should have fallback response for date', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('what is the date');

    expect(response).toContain('today');
  });

  it('should have fallback response for joke', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('tell me a joke');

    expect(response.length).toBeGreaterThan(0);
  });

  it('should return default response for unknown input', () => {
    const api = new BBotAPI();
    const response = api.getFallbackResponse('random text');

    expect(response.length).toBeGreaterThan(0);
    expect(typeof response).toBe('string');
  });
});
