import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { getPost, getPosts, urlFor } from '@/app/lib/sanity'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts
    .filter(p => p.postType === 'article' && p.slug?.current)
    .map(p => ({ slug: p.slug.current }))
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — Alginate Compare`,
    description: post.excerpt || '',
  }
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const ptComponents = {
  types: {
    image: ({ value }) => {
      const src = urlFor(value).width(800).url()
      return (
        <figure className="my-6">
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
            <Image src={src} alt={value.alt || ''} fill className="object-cover" sizes="800px" />
          </div>
          {value.alt && <figcaption className="text-center text-xs text-gray-400 mt-2">{value.alt}</figcaption>}
        </figure>
      )
    },
  },
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug)
  if (!post || post.postType !== 'article') notFound()

  const imgSrc = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).fit('crop').url() : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

      <Link href="/#resources" className="text-sm text-teal-600 hover:text-teal-800 font-medium mb-6 inline-block">
        ← Back
      </Link>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
        {post.title}
      </h1>

      {post.publishedAt && (
        <p className="text-sm text-gray-400 mb-6">{formatDate(post.publishedAt)}</p>
      )}

      {/* Hero image */}
      {imgSrc && (
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8">
          <Image src={imgSrc} alt={post.mainImage?.alt || post.title} fill className="object-cover" sizes="(max-width: 672px) 100vw, 672px" priority />
        </div>
      )}

      {/* Excerpt as lede */}
      {post.excerpt && (
        <p className="text-lg text-gray-600 leading-relaxed mb-8 font-medium border-l-4 border-teal-300 pl-4">
          {post.excerpt}
        </p>
      )}

      {/* Body */}
      {post.body && (
        <div className="prose prose-gray max-w-none">
          <PortableText value={post.body} components={ptComponents} />
        </div>
      )}

    </main>
  )
}
