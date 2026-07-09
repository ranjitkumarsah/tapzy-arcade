// Vercel Serverless Function: returns the bot's own profile photo (the one set
// in BotFather) as an image, so the splash screen can show it without exposing
// the bot token to the client. Falls back to 404 (client then uses /logo.png).
//
// Cached at the edge for a day so it isn't refetched on every launch.

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) {
    res.statusCode = 404
    return res.end()
  }

  try {
    const botId = token.split(':')[0]
    const api = `https://api.telegram.org/bot${token}`

    // 1) find the bot's latest profile photo
    const photosRes = await fetch(
      `${api}/getUserProfilePhotos?user_id=${botId}&limit=1`,
    )
    const photos = await photosRes.json()
    const sizes = photos?.result?.photos?.[0]
    if (!sizes || !sizes.length) {
      res.statusCode = 404
      return res.end()
    }

    // 2) resolve the largest size to a file path
    const largest = sizes[sizes.length - 1]
    const fileRes = await fetch(`${api}/getFile?file_id=${largest.file_id}`)
    const fileData = await fileRes.json()
    const filePath = fileData?.result?.file_path
    if (!filePath) {
      res.statusCode = 404
      return res.end()
    }

    // 3) fetch the actual image bytes (this URL contains the token — stays server-side)
    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${filePath}`,
    )
    if (!imgRes.ok) {
      res.statusCode = 404
      return res.end()
    }

    const buf = Buffer.from(await imgRes.arrayBuffer())
    res.statusCode = 200
    res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return res.end(buf)
  } catch (err) {
    console.error('botPhoto error:', err)
    res.statusCode = 404
    return res.end()
  }
}
