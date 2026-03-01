// Cloudflare Pages Function: /api/yt-video?id=VIDEO_ID
// Fetches YouTube video page and extracts title, author, description
// No API key needed — parses the page HTML directly

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://tools.helloruru.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(context.request.url);
  const videoId = url.searchParams.get('id');

  if (!videoId || !/^[A-Za-z0-9_-]{10,12}$/.test(videoId)) {
    return new Response(JSON.stringify({ error: 'Invalid video ID' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  try {
    const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!ytRes.ok) {
      return new Response(JSON.stringify({ error: `YouTube returned ${ytRes.status}` }), {
        status: 502, headers: CORS_HEADERS,
      });
    }

    const html = await ytRes.text();

    // Strategy 1: Extract ytInitialPlayerResponse JSON
    const marker = 'var ytInitialPlayerResponse = ';
    const start = html.indexOf(marker);

    if (start !== -1) {
      const jsonStart = start + marker.length;
      // Find end: next ";\n" or ";</script>"
      const end1 = html.indexOf(';\nvar ', jsonStart);
      const end2 = html.indexOf(';</script>', jsonStart);
      const end = Math.min(
        end1 !== -1 ? end1 : Infinity,
        end2 !== -1 ? end2 : Infinity
      );

      if (end !== Infinity) {
        const data = JSON.parse(html.substring(jsonStart, end));
        const vd = data.videoDetails || {};

        return new Response(JSON.stringify({
          title: vd.title || '',
          author: vd.author || '',
          channelId: vd.channelId || '',
          description: vd.shortDescription || '',
          lengthSeconds: vd.lengthSeconds || '0',
          keywords: vd.keywords || [],
        }), { headers: CORS_HEADERS });
      }
    }

    // Strategy 2: Regex fallback for shortDescription
    const descMatch = html.match(/"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const titleMatch = html.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const authorMatch = html.match(/"author"\s*:\s*"((?:[^"\\]|\\.)*)"/);

    if (titleMatch) {
      return new Response(JSON.stringify({
        title: unescapeJson(titleMatch[1]),
        author: authorMatch ? unescapeJson(authorMatch[1]) : '',
        channelId: '',
        description: descMatch ? unescapeJson(descMatch[1]) : '',
        lengthSeconds: '0',
        keywords: [],
      }), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'Could not parse video data' }), {
      status: 500, headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

function unescapeJson(str) {
  try {
    return JSON.parse(`"${str}"`);
  } catch {
    return str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}
