/**
 * Vercel Serverless Function - Ollama Proxy
 * Proxies requests to Ollama server to avoid CORS issues
 *
 * Set OLLAMA_URL environment variable in Vercel dashboard:
 * - For remote server: https://your-ollama-server.com
 * - For localhost during dev: http://localhost:11434
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST and GET methods
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Ollama URL from environment variable
  const ollamaUrl = process.env.OLLAMA_URL;

  // Check if OLLAMA_URL is configured
  if (!ollamaUrl) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'OLLAMA_URL environment variable not set',
      message: 'Please set OLLAMA_URL in your Vercel project settings (e.g., https://your-ollama-server.com:11434)',
      detail: 'The proxy requires OLLAMA_URL to be configured in Vercel environment variables'
    });
  }

  const path = req.query.path || [];
  const endpoint = Array.isArray(path) ? path.join('/') : path;

  // Construct the full URL
  const url = `${ollamaUrl}/api/${endpoint}`;

  try {
    // Forward the request to Ollama
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Include body for POST requests
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);

    // Get response data
    const contentType = response.headers.get('content-type') || '';

    // Handle streaming responses (for model downloads) - simplified for now
    if (contentType.includes('application/x-ndjson') || contentType.includes('text/plain')) {
      // For streaming, we'll buffer and send as JSON array
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
      }

      const fullText = chunks.join('');
      const lines = fullText.split('\n').filter(line => line.trim());
      const jsonData = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json(jsonData);
    }

    // Handle JSON responses
    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Provide more helpful error messages
    let errorMessage = error.message || 'Unknown error';
    let detail = '';

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Connection refused') || errorMessage.includes('Failed to establish')) {
      detail = `Cannot connect to ${ollamaUrl}. Make sure the Ollama server is running and accessible.`;
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      detail = `Cannot resolve hostname for ${ollamaUrl}. Check that the URL is correct.`;
    } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      detail = `Connection to ${ollamaUrl} timed out. The server may be down or unreachable.`;
    }

    res.status(500).json({
      error: 'Failed to connect to Ollama server',
      message: errorMessage,
      detail: detail || `Error connecting to ${ollamaUrl}`,
      ollamaUrl: ollamaUrl // Include the URL being used for debugging
    });
  }
}
