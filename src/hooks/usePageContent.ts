'use client'

import { useState, useEffect } from 'react'

export function usePageContent(slug: string) {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true)
        const response = await fetch(`/api/pages/${slug}`)

        if (response.ok) {
          const data = await response.json()
          setContent(data)
          setError(null)
        } else {
          // Page content not found is okay, use defaults
          setContent(null)
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching page content:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [slug])

  return { content, loading, error }
}
