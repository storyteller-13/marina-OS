/**
 * Vercel Serverless Function - NASA APOD API Proxy
 * Proxies requests to the NASA APOD API to avoid CORS and rate limiting issues
 * 
 * Set NASA_API_KEY in Vercel environment variables for better rate limits
 * Get your free API key at: https://api.nasa.gov/
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use environment variable API key if available, otherwise use DEMO_KEY
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    
    // Get date from query params, default to today
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`;

    // Fetch from NASA API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'vonsteinkirch.com/1.0',
      },
    });

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: response.headers.get('Retry-After') || 3600
        });
      }
      
      throw new Error(`NASA API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the data with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);

  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Failed to fetch APOD',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

