import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn:    process.env.NODE_ENV === 'production',
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}

// Fetch all posts, newest first
export async function getPosts() {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
      postType,
      title,
      slug,
      externalUrl,
      excerpt,
      mainImage,
      tags,
      publishedAt,
    }`,
    {},
    { next: { revalidate: 60 } }  // revalidate every minute
  )
}

// Fetch a single article by slug (articles only)
export async function getPost(slug) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      postType,
      title,
      slug,
      externalUrl,
      excerpt,
      mainImage,
      tags,
      publishedAt,
      body,
    }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}
