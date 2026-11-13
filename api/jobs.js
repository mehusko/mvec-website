// Public list of open jobs for the /jobs page.
import { loadJobs } from '../lib/jobs.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const data = await loadJobs();
  const jobs = (data.jobs || []).filter((j) => !j.closed);
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json({ sample: Boolean(data.sample), jobs });
}
