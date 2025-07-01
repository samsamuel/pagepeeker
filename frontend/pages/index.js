import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const data = await res.json()
    setImageUrl(data.image_url)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>PagePeeker</title>
      </Head>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Screenshot a Webpage</h1>
        <input
          type="url"
          className="border p-2 w-full mb-4"
          placeholder="https://example.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Processing...' : 'Get Screenshot'}
        </button>
      </form>
      {imageUrl && (
        <div className="mt-8">
          <h2 className="mb-2 font-semibold">Latest Screenshot:</h2>
          <img src={`/api${imageUrl}`} alt="Screenshot" className="border rounded" />
        </div>
      )}
    </div>
  )
}
