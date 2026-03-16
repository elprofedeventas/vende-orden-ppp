export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const GAS_URL = process.env.GAS_URL
  if (!GAS_URL) return res.status(500).json({ error: 'GAS_URL no configurada' })

  try {
    const params = new URLSearchParams(req.query).toString()
    const url = params ? `${GAS_URL}?${params}` : GAS_URL
    const response = await fetch(url, { redirect: 'follow' })
    const text = await response.text()
    let data
    try { data = JSON.parse(text) }
    catch { return res.status(502).json({ error: 'Respuesta no JSON de GAS', raw: text.slice(0, 200) }) }
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Error al conectar con Apps Script', detail: err.message })
  }
}
