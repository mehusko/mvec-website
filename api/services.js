// Public list of services and prices. Edited in the admin ("Services & prices"); falls back to the standard list
// until the admin has any, or if the database is unavailable.
import { query } from '../lib/db.js';

const DEFAULTS = [
  { name: 'Housemaids', summary: 'Deep cleaning, laundry and ironing, kitchen upkeep.', price: '$300–500 a month' },
  { name: 'Nannies & Childcare', summary: 'Child supervision, educational activities, meal preparation.', price: '$350–550 a month' },
  { name: 'Cooks & Chefs', summary: 'Meal planning, grocery shopping, special diets.', price: '$400–600 a month' },
  { name: 'Elderly Care', summary: 'Personal care, medication reminders, companionship.', price: '$400–650 a month' },
  { name: 'Drivers', summary: 'School runs, shopping trips, airport transfers.', price: '$350–500 a month' },
  { name: 'General Helpers', summary: 'Gardening, pet care, maintenance.', price: '$250–400 a month' },
];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  try {
    const rows = await query("SELECT data FROM records WHERE entity = 'services' AND status = 'published' AND deleted_at IS NULL");
    const list = rows.map((r) => { try { return JSON.parse(r.data); } catch { return null; } }).filter((d) => d && d.name)
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999))
      .map((d) => ({ name: d.name, summary: d.summary || '', price: d.price || '' }));
    return res.status(200).json({ services: list.length ? list : DEFAULTS });
  } catch {
    return res.status(200).json({ services: DEFAULTS });
  }
}
