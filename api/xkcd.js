/**
 * Vercel Serverless Function - XKCD API Proxy
 * Proxies requests to the XKCD API to avoid CORS issues
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
    // Get the comic number from query params, default to latest (info.0.json)
    const comicNumber = req.query.num || '0';
    const apiUrl = comicNumber === '0' 
      ? 'https://xkcd.com/info.0.json'
      : `https://xkcd.com/${comicNumber}/info.0.json`;

    // Fetch from XKCD API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'vonsteinkirch.com/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`XKCD API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the data with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);

  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Failed to fetch XKCD comic',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

