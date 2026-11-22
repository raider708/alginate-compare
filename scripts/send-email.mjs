#!/usr/bin/env node
// Sends the weekly summary email written by discover-products.mjs --email-dir.
//
//   node scripts/send-email.mjs <dir>     (reads <dir>/subject.txt and <dir>/body.html)
//
// Settings (GitHub secrets / variables):
//   SMTP_USERNAME, SMTP_PASSWORD   secrets: the sending account (for Gmail, an app password)
//   EMAIL_TO                       variable: where to send it (default: SMTP_USERNAME)
//   SMTP_HOST, SMTP_PORT           variables: default smtp.gmail.com, 465
// Without SMTP_PASSWORD it does nothing, so the job still works before email is set up.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'

const dir = process.argv[2]
const { SMTP_USERNAME: user, SMTP_PASSWORD: pass } = process.env
if (!user || !pass) {
  console.log('Email not set up (SMTP_USERNAME / SMTP_PASSWORD secrets), so no email was sent.')
  process.exit(0)
}

let subject, html
try {
  subject = (await readFile(path.join(dir, 'subject.txt'), 'utf8')).trim()
  html = await readFile(path.join(dir, 'body.html'), 'utf8')
} catch {
  // The discovery script crashed before writing the email; say so instead of staying quiet.
  const run = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null
  subject = 'Alginate Compare weekly: the discovery job failed'
  html = `<p>The weekly product discovery job crashed before it could write a summary.${run ? ` <a href="${run}">See the run log</a>.` : ''}</p>`
}

const port = Number(process.env.SMTP_PORT || 465)
const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } })
const info = await transport.sendMail({ from: `Alginate Compare <${user}>`, to: process.env.EMAIL_TO || user, subject, html })
console.log(`Sent "${subject}" (${info.messageId})`)
