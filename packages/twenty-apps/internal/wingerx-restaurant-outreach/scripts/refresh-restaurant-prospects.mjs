import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { workspaceClient } from './twenty-rest.mjs';

const MARKETS = {
  Ranchi: ['Jharkhand', '85.23,23.26,85.45,23.47'],
  Varanasi: ['Uttar Pradesh', '82.90,25.24,83.09,25.39'],
  'New Delhi': ['Delhi', '76.85,28.41,77.34,28.89'],
  Ahmedabad: ['Gujarat', '72.43,22.92,72.73,23.15'],
  Surat: ['Gujarat', '72.72,21.08,72.94,21.29'],
  Vadodara: ['Gujarat', '73.09,22.23,73.28,22.40'],
  Mumbai: ['Maharashtra', '72.76,18.88,72.98,19.32'],
};
const COLUMNS = {
  name: 'Restaurant', sourceId: 'Source ID', market: 'Market', state: 'State',
  category: 'Category', businessPhone: 'Business phone', businessEmail: 'Business email',
  website: 'Website', address: 'Address',
};
const EXCLUDED_CATEGORIES = new Set(['internet_cafe', 'restaurant_equipment_and_supply', 'restaurant_wholesale']);
const FOOD_TYPES = new Set(['restaurant', 'cafe', 'fast_food_restaurant', 'coffee_shop', 'bakery', 'food_court']);

const indianNumber = (input) => {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.startsWith('0091') && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return /^[1-9]\d{9}$/.test(digits) && new Set(digits).size >= 4 &&
    !['1234567890', '9876543210', '0123456789'].includes(digits) ? '+91 ' + digits : '';
};

const emailAddress = (input) => {
  const email = String(input ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
};

export const restaurantFromPlace = (feature, market, state) => {
  const place = feature.properties ?? {};
  const primary = place.taxonomy?.primary ?? '';
  const category = primary || place.basic_category || '';
  const location = place.addresses?.[0];
  const name = String(place.names?.primary ?? '').trim();
  const sourceId = String(feature.id ?? place.id ?? '').trim();
  const businessPhone = (place.phones ?? []).map(indianNumber).find(Boolean);

  if (
    !name || !sourceId || !businessPhone ||
    !Number.isFinite(place.confidence) || place.confidence < 0.55 ||
    /closed/i.test(place.operating_status ?? '') ||
    (location?.country && location.country !== 'IN') ||
    EXCLUDED_CATEGORIES.has(category) ||
    !(FOOD_TYPES.has(place.basic_category) ||
      /(^|_)(restaurant|cafe|diner|pizzeria|dhaba|fast_food|food_court)($|_)/.test(primary) ||
      place.taxonomy?.hierarchy?.includes('restaurant'))
  ) {
    return null;
  }

  return {
    name, sourceId, market, state,
    category: category.replaceAll('_', ' '),
    businessPhone,
    businessEmail: (place.emails ?? []).map(emailAddress).find(Boolean) ?? '',
    website: (place.websites ?? []).find((site) => /^https?:\/\//i.test(site)) ?? '',
    address: location?.freeform ?? '',
  };
};

const recordKeys = (row) => [
  ['id', row.sourceId?.trim()],
  ['phone', indianNumber(row.businessPhone)],
  ['email', emailAddress(row.businessEmail)],
].filter(([, value]) => value).map(([kind, value]) => kind + ':' + value);

export const newProspects = (candidates, existing) => {
  const seen = new Set(existing.flatMap(recordKeys));
  return candidates.filter((row) => {
    const keys = recordKeys(row);
    if (keys.some((key) => seen.has(key))) {
      return false;
    }
    keys.forEach((key) => seen.add(key));
    return true;
  });
};

const getExistingProspects = async (client) => {
  const records = [];
  const cursors = new Set();
  let cursor;
  do {
    const page = await client.listPage('restaurantProspects', cursor ? { starting_after: cursor } : {});
    records.push(...page.records);
    cursor = page.next;
    if (cursor && cursors.has(cursor)) {
      throw new Error('Twenty returned a repeated pagination cursor.');
    }
    cursors.add(cursor);
  } while (cursor);
  return records;
};

const downloadMarket = async (market, [state, bounds]) => {
  const child = spawn(process.env.WINGERX_OVERTURE_BIN || 'overturemaps', [
    'download', '--bbox=' + bounds, '--type=place', '-f', 'geojsonseq',
  ], {
    stdio: ['ignore', 'pipe', 'inherit'],
    signal: AbortSignal.timeout(15 * 60_000),
    env: Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !/(_API_KEY|_TOKEN|_SECRET|_PASSWORD)$/.test(key)),
    ),
  });
  const finished = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error('Overture download failed for ' + market)));
  });
  const read = async () => {
    const records = [];
    for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
      const value = line.replace(/^\u001e/, '').trim();
      if (value) {
        const row = restaurantFromPlace(JSON.parse(value), market, state);
        if (row) {
          records.push(row);
        }
      }
    }
    return records;
  };
  try {
    const [records] = await Promise.all([read(), finished]);
    return records;
  } finally {
    if (child.exitCode === null) {
      child.kill();
    }
  }
};

const cell = (input) => {
  const value = String(input ?? '');
  const safe = /^[=+@-]/.test(value.trimStart()) && !/^\+91 \d{10}$/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
};

const main = async () => {
  const [output, ...selected] = process.argv.slice(2);
  const markets = selected.length ? [...new Set(selected)] : Object.keys(MARKETS);
  if (!output || !output.endsWith('.csv') || markets.some((market) => !Object.hasOwn(MARKETS, market))) {
    throw new Error('Usage: node scripts/refresh-restaurant-prospects.mjs output.csv [market ...]');
  }

  const existing = await getExistingProspects(workspaceClient());
  const candidates = [];
  for (const market of markets) {
    candidates.push(...await downloadMarket(market, MARKETS[market]));
  }

  const rows = newProspects(candidates, existing);
  const csv = [
    Object.values(COLUMNS).map(cell).join(','),
    ...rows.map((row) => Object.keys(COLUMNS).map((key) => cell(row[key])).join(',')),
  ].join('\r\n') + '\r\n';
  await writeFile(output, csv, { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({
    source: 'Overture Maps Foundation and contributors',
    license: 'https://docs.overturemaps.org/attribution/',
    markets, existing: existing.length, candidates: candidates.length, newProspects: rows.length,
  }));
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
