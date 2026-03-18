export default async function handler(req, res) {
  const base = 'https://script.google.com/macros/s/AKfycby2uV1V6oEeVNK3wssqaCLdgjZkg5Fhqp_w0xK8etrZtfg3j3_ijxjZc6WRjOg44ZFo/exec'

  const url = `${base}?${new URLSearchParams(req.query)}`

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    })
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { success: false, error: 'Respuesta inválida de Apps Script', raw: text }
    }
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
