export const post = {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'postType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Article', value: 'article' },
          { title: 'Link',    value: 'link'    },
        ],
        layout: 'radio',
      },
      initialValue: 'article',
      validation: Rule => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Used as the URL for articles. Auto-generated from title.',
      hidden: ({ document }) => document?.postType === 'link',
    },
    {
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'The link this card points to.',
      hidden: ({ document }) => document?.postType !== 'link',
      validation: Rule => Rule.custom((val, ctx) => {
        if (ctx.document?.postType === 'link' && !val) return 'Required for link posts'
        return true
      }),
    },
    {
      name: 'excerpt',
      title: 'Excerpt / Description',
      type: 'text',
      rows: 3,
      description: 'Short summary shown on the card. 1–3 sentences.',
      validation: Rule => Rule.max(300),
    },
    {
      name: 'mainImage',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        },
      ],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'e.g. research, lpr, gaviscon, ppi-comparison, medical-professional',
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt text', type: 'string' }],
        },
      ],
      hidden: ({ document }) => document?.postType === 'link',
    },
  ],
  preview: {
    select: {
      title: 'title',
      postType: 'postType',
      media: 'mainImage',
      tags: 'tags',
    },
    prepare({ title, postType, media, tags }) {
      const tagStr = tags?.length ? ` [${tags.join(', ')}]` : ''
      return {
        title,
        subtitle: `${postType === 'link' ? '🔗 Link' : '📄 Article'}${tagStr}`,
        media,
      }
    },
  },
}
