-- Run in Supabase SQL editor (market-metrics project)
-- Normalizes existing watchlist.sector values to standard GICS sectors.

UPDATE watchlist
SET sector = CASE
  WHEN sector IS NULL OR trim(sector) = '' THEN NULL
  WHEN lower(sector) ~ 'tech|computer|software|semiconductor' THEN 'Technology'
  WHEN lower(sector) ~ 'health|pharma|biotech|medical' THEN 'Healthcare'
  WHEN lower(sector) ~ 'bank|financ|insurance|invest|blank check' THEN 'Financials'
  WHEN lower(sector) ~ 'retail|consumer disc|auto|hotel|restaurant' THEN 'Consumer Discretionary'
  WHEN lower(sector) ~ 'food|beverage|consumer staple|household' THEN 'Consumer Staples'
  WHEN lower(sector) ~ 'energy|oil|gas|petroleum' THEN 'Energy'
  WHEN lower(sector) ~ 'industrial|manufactur|aerospace|defense|machinery|transport' THEN 'Industrials'
  WHEN lower(sector) ~ 'material|chemical|mining|steel' THEN 'Materials'
  WHEN lower(sector) ~ 'real estate|reit|property' THEN 'Real Estate'
  WHEN lower(sector) ~ 'util|electric|water|gas distribut' THEN 'Utilities'
  WHEN lower(sector) ~ 'communication|media|telecom|entertainment|internet' THEN 'Communication Services'
  ELSE 'Other'
END
WHERE sector IS NOT NULL
  AND trim(sector) != ''
  AND sector NOT IN (
    'Technology',
    'Healthcare',
    'Financials',
    'Consumer Discretionary',
    'Consumer Staples',
    'Energy',
    'Industrials',
    'Materials',
    'Real Estate',
    'Utilities',
    'Communication Services',
    'Other'
  );
