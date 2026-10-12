// RFC 4180 CSV parser: handles quoted fields, "" escapes, and newlines inside quotes.
export function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

// Returns one object per data row, keyed by the header row (trimmed, as written in the sheet).
export function parseCSVObjects(text) {
  const [header, ...rows] = parseCSV(text)
  if (!header) return []
  const keys = header.map(h => h.trim())
  return rows.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

export function toCSV(rows) {
  const esc = v => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(esc).join(',')).join('\n') + '\n'
}
