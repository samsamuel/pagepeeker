

import Head from 'next/head'
import { useState, useEffect } from 'react'


export default function Home() {
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [screenshotReady, setScreenshotReady] = useState(false)
  const [pollError, setPollError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const pollForScreenshot = async (imgUrl, retries = 20, interval = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(imgUrl, { method: 'HEAD' });
        if (res.ok) {
          setScreenshotReady(true);
          setLoading(false);
          return;
        }
      } catch (err) {}
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    setPollError(true);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setScreenshotReady(false);
    setPollError(false);
    setImageUrl('');
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    setImageUrl(data.image_url);
    pollForScreenshot(data.image_url);
  };

  if (!mounted) return null;

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
      {loading && (
        <div className="mt-8 flex flex-col items-center">
          <div className="loader mb-2" style={{ border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite' }} />
          <p>Generating screenshot...</p>
        </div>
      )}
      {pollError && (
        <div className="mt-8 text-red-600">Screenshot could not be generated. Please try again.</div>
      )}
      {imageUrl && screenshotReady && !loading && (
        <div className="mt-8">
          <h2 className="mb-2 font-semibold">Latest Screenshot:</h2>
          <img
            src={imageUrl}
            alt="Screenshot"
            className="border rounded"
            onError={e => {
              e.target.onerror = null;
              e.target.src = '/placeholder.png';
            }}
          />
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
