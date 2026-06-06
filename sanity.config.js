'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name:    'alginate-compare',
  title:   'Alginate Compare',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    visionTool(),   // lets you run GROQ queries directly in the studio — handy for debugging
  ],
  schema: { types: schemaTypes },
  basePath: '/studio',
})
