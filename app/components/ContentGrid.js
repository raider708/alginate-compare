'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/app/lib/sanity'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function PostCard({ post }) {
  const isLink    = post.postType === 'link'
  const href      = isLink ? post.externalUrl : `/blog/${post.slug?.current}`
  const imgSrc    = post.mainImage ? urlFor(post.mainImage).width(600).height(340).fit('crop').url() : null
  const external  = isLink ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <a
      href={href}
      {...external}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-gray-100 shrink-0">
        {imgSrc ? (
          <Image src={imgSrc} alt={post.mainImage?.alt || post.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl select-none">
            {isLink ? '🔗' : '📄'}
          </div>
        )}
        {isLink && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            External ↗
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-teal-700 transition-colors">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {post.publishedAt && (
          <p className="text-xs text-gray-400 mt-auto pt-1">
            {formatDate(post.publishedAt)}
          </p>
        )}
      </div>
    </a>
  )
}

export default function ContentGrid({ posts }) {
  const [activeTag, setActiveTag] = useState(null)
  const [activeType, setActiveType] = useState(null)  // null | 'article' | 'link'

  // Collect all unique tags across all posts
  const allTags = useMemo(() => {
    const set = new Set()
    posts.forEach(p => p.tags?.forEach(t => set.add(t)))
    return [...set].sort()
  }, [posts])

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (activeTag  && !p.tags?.includes(activeTag))  return false
      if (activeType && p.postType !== activeType)      return false
      return true
    })
  }, [posts, activeTag, activeType])

  if (!posts.length) return null

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Research & Resources</h2>
      <p className="text-gray-500 text-sm mb-5">Articles, links, and resources on sodium alginate and acid reflux.</p>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {/* Type toggles */}
        <button
          onClick={() => setActiveType(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            activeType === null ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveType('article')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            activeType === 'article' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveType('link')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            activeType === 'link' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
          }`}
        >
          Links
        </button>

        {/* Divider */}
        {allTags.length > 0 && <span className="text-gray-200 select-none">|</span>}

        {/* Tag pills */}
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(t => t === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTag === tag
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {tag}
          </button>
        ))}

        <span className="ml-auto text-xs text-gray-400">{filtered.length} items</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No items match the current filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(post => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
