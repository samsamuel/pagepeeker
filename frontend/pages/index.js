

import Head from 'next/head'
import { useState, useEffect } from 'react'


export default function Home() {
  const [jobsMenuOpen, setJobsMenuOpen] = useState(true);
  const [url, setUrl] = useState('')
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(800)
  const [delay, setDelay] = useState(2)
  const [scale, setScale] = useState(1)
  const [format, setFormat] = useState('png')
  const [customJs, setCustomJs] = useState('')
  const [customCss, setCustomCss] = useState('')
  const [imagemagickScript, setImagemagickScript] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [screenshotReady, setScreenshotReady] = useState(false)
  const [pollError, setPollError] = useState(false)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  // New state for screenshot mode
  const [screenshotMode, setScreenshotMode] = useState('full'); // 'full' or 'viewport'
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    setMounted(true)
    fetchJobs()
  }, [])

  // Auto-refresh screenshot if refresh interval is set
  useEffect(() => {
    if (!jobId || !refresh || refresh <= 0) return;
    const interval = setInterval(() => {
      // Always fetch the latest image (bust cache)
      setImageUrl((prev) => prev ? prev.split('?')[0] + `?t=${Date.now()}` : prev);
      setScreenshotReady(false);
      pollForScreenshot(imageUrl);
    }, refresh * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, refresh, imageUrl]);

  // Fetch jobs from backend
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      setJobs([]);
    }
    setJobsLoading(false);
  };

  // Delete a job
  const handleDeleteJob = async (job_id) => {
    await fetch(`/api/jobs/${job_id}`, { method: 'DELETE' });
    fetchJobs();
  };


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
    setJobId('');
    const config = {
      url,
      width: Number(width),
      height: Number(height),
      delay: Number(delay),
      scale: Number(scale),
      format,
      custom_js: customJs,
      custom_css: customCss,
      imagemagick_script: imagemagickScript,
      refresh: Number(refresh),
      full_page: screenshotMode === 'full',
      viewport_height: screenshotMode === 'viewport' ? Number(viewportHeight) : undefined
    };
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    setImageUrl(data.image_url);
    setJobId(data.job_id);
    pollForScreenshot(data.image_url);
    fetchJobs();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Jobs Menu */}
      <div className="fixed top-0 left-0 w-full bg-white shadow z-10">
        <div className="max-w-4xl mx-auto p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Running Jobs</h2>
            <button
              className="ml-2 px-2 py-1 text-xs rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
              onClick={() => setJobsMenuOpen((open) => !open)}
            >
              {jobsMenuOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {jobsMenuOpen && (
            jobsLoading ? (
              <div>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div>No jobs found.</div>
            ) : (
              <ul className="divide-y">
                {jobs.map(job => {
                  // Build screenshot URL for this job
                  const ext = job.format && ['png','jpeg','jpg','webp','bmp','gif'].includes(job.format.toLowerCase()) ? job.format.toLowerCase() : 'png';
                  const screenshotUrl = `/screenshots/${job.job_id}/screenshot.${ext}`;
                  return (
                    <li key={job.job_id} className="flex items-center justify-between py-2">
                      <div>
                        <a
                          href={screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2 text-blue-700 underline hover:text-blue-900"
                        >
                          {job.job_id}
                        </a>
                        <span className="font-semibold">{job.url}</span>
                        {job.refresh > 0 && <span className="ml-2 text-blue-600 text-xs">(refresh: {job.refresh}s)</span>}
                      </div>
                      <button onClick={() => handleDeleteJob(job.job_id)} className="ml-4 px-2 py-1 bg-red-500 text-white rounded text-xs">Delete</button>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>
      </div>
      <Head>
        <title>PagePeeker</title>
      </Head>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md mt-24">
        <h1 className="text-2xl font-bold mb-4">Screenshot a Webpage</h1>
        <input
          type="url"
          className="border p-2 w-full mb-4"
          placeholder="https://example.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        {/* Screenshot mode selection */}
        <div className="mb-4">
          <label className="mr-4">
            <input
              type="radio"
              name="screenshotMode"
              value="full"
              checked={screenshotMode === 'full'}
              onChange={() => setScreenshotMode('full')}
            />{' '}
            Full Page
          </label>
          <label>
            <input
              type="radio"
              name="screenshotMode"
              value="viewport"
              checked={screenshotMode === 'viewport'}
              onChange={() => setScreenshotMode('viewport')}
            />{' '}
            Viewport
          </label>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            className="border p-2 w-1/2"
            placeholder="Width"
            value={width}
            min={100}
            onChange={e => setWidth(e.target.value)}
            required
          />
          {/* Show height input only for viewport mode */}
          {screenshotMode === 'viewport' ? (
            <input
              type="number"
              className="border p-2 w-1/2"
              placeholder="Viewport Height"
              value={viewportHeight}
              min={100}
              onChange={e => setViewportHeight(e.target.value)}
              required
            />
          ) : (
            <input
              type="number"
              className="border p-2 w-1/2 bg-gray-100 text-gray-400"
              placeholder="Height (ignored)"
              value={height}
              min={100}
              disabled
              readOnly
            />
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            className="border p-2 w-1/2"
            placeholder="Delay (s)"
            value={delay}
            min={0}
            onChange={e => setDelay(e.target.value)}
          />
          <input
            type="number"
            className="border p-2 w-1/2"
            placeholder="Scale"
            value={scale}
            min={0.1}
            step={0.1}
            onChange={e => setScale(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <select
            className="border p-2 w-full"
            value={format}
            onChange={e => setFormat(e.target.value)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>
        <textarea
          className="border p-2 w-full mb-4"
          placeholder="Custom JS (optional)"
          value={customJs}
          onChange={e => setCustomJs(e.target.value)}
          rows={2}
        />
        <textarea
          className="border p-2 w-full mb-4"
          placeholder="Custom CSS (optional)"
          value={customCss}
          onChange={e => setCustomCss(e.target.value)}
          rows={2}
        />
        <textarea
          className="border p-2 w-full mb-4"
          placeholder="ImageMagick Script (optional)"
          value={imagemagickScript}
          onChange={e => setImagemagickScript(e.target.value)}
          rows={2}
        />
        <input
          type="number"
          className="border p-2 w-full mb-4"
          placeholder="Refresh Interval (seconds, 0=off)"
          value={refresh}
          min={0}
          onChange={e => setRefresh(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={loading}>
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
