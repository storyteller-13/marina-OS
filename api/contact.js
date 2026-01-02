/**
 * Vercel Serverless Function - Contact Form Handler
 * Sends emails from the contact form to contact@vonsteinkirch.com
 * 
 * Configure email service in Vercel environment variables:
 * - RESEND_API_KEY: API key for Resend (recommended, free tier available)
 * - Or configure SMTP settings for nodemailer
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, email, and message are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Try to send email using Resend (if configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      // Use Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Contact Form <noreply@vonsteinkirch.com>',
          to: ['contact@vonsteinkirch.com'],
          reply_to: email,
          subject: `Contact Form: ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          `,
          text: `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}
          `.trim(),
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send email via Resend');
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ 
        success: true,
        message: 'Email sent successfully' 
      });
    }

    // Fallback: If no email service is configured, return an error with instructions
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Email service not configured',
      message: 'Please configure RESEND_API_KEY in Vercel environment variables',
      detail: 'Get a free API key at https://resend.com/api-keys'
    });

  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

