import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const apiKey = process.env.CMC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Normalize incoming symbol (strip common quote assets if user passed a pair like BTCUSDT)
    const raw = params.symbol.toUpperCase();
    const baseSymbol = raw.replace(/(USDT|BUSD|USDC|USD|BTC|ETH)$/i, '').toUpperCase();

    const headers = {
      'X-CMC_PRO_API_KEY': apiKey,
      'Accept': 'application/json',
    } as const;

    async function fetchText(url: string) {
      const res = await fetch(url, { headers, cache: 'no-store' });
      const text = await res.text();
      return { res, text };
    }

    // Attempt direct symbol lookup first
    const infoUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${encodeURIComponent(baseSymbol)}`;
    console.log('[coin-info] Fetching metadata for symbol:', baseSymbol, 'original:', raw);
    let { res: metadataResponse, text: metadataText } = await fetchText(infoUrl);

    if (metadataResponse.ok) {
      let metadataData: any;
      try {
        metadataData = JSON.parse(metadataText);
      } catch (e) {
        console.error('[coin-info] Failed to parse metadata JSON:', metadataText);
        return NextResponse.json({ error: 'Invalid JSON from upstream', body: metadataText }, { status: 502 });
      }
      if (!metadataData?.data || Object.keys(metadataData.data).length === 0) {
        console.warn('[coin-info] Empty data for symbol', baseSymbol);
        // fall through to map/id lookup
      } else {
        return NextResponse.json({ symbol: baseSymbol, data: metadataData.data });
      }
    } else {
      console.warn('[coin-info] primary lookup failed', metadataResponse.status, metadataText);
      // Continue to fallback instead of returning immediately
    }

    // Fallback: map symbol -> id, then info by id
    const mapUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${encodeURIComponent(baseSymbol)}`;
    console.log('[coin-info] Fallback: map lookup for', baseSymbol);
    const { res: mapRes, text: mapText } = await fetchText(mapUrl);
    if (!mapRes.ok) {
      console.error('[coin-info] map lookup failed', mapRes.status, mapText);
      return NextResponse.json({ error: 'Map lookup failed', upstreamStatus: mapRes.status, upstreamBody: mapText }, { status: mapRes.status });
    }
    let mapJson: any;
    try {
      mapJson = JSON.parse(mapText);
    } catch (e) {
      console.error('[coin-info] map JSON parse failed', mapText);
      return NextResponse.json({ error: 'Invalid JSON from map endpoint', body: mapText }, { status: 502 });
    }
    const id = mapJson?.data?.[0]?.id;
    if (!id) {
      console.warn('[coin-info] No id found for symbol', baseSymbol, mapJson);
      return NextResponse.json({ error: 'Symbol not found', symbol: baseSymbol, map: mapJson }, { status: 404 });
    }

    const byIdUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${encodeURIComponent(String(id))}`;
    console.log('[coin-info] Fetching metadata by id:', id, 'for symbol:', baseSymbol);
    const { res: byIdRes, text: byIdText } = await fetchText(byIdUrl);
    if (!byIdRes.ok) {
      console.error('[coin-info] info-by-id failed', byIdRes.status, byIdText);
      return NextResponse.json({ error: 'Info by id failed', upstreamStatus: byIdRes.status, upstreamBody: byIdText }, { status: byIdRes.status });
    }
    let byIdJson: any;
    try {
      byIdJson = JSON.parse(byIdText);
    } catch (e) {
      console.error('[coin-info] info-by-id JSON parse failed', byIdText);
      return NextResponse.json({ error: 'Invalid JSON from info-by-id', body: byIdText }, { status: 502 });
    }
    const dataObj = byIdJson?.data;
    if (!dataObj || Object.keys(dataObj).length === 0) {
      return NextResponse.json({ error: 'No data for id', id, body: byIdJson }, { status: 404 });
    }
    const firstKey = Object.keys(dataObj)[0];
    const normalizedPayload = { [baseSymbol]: [dataObj[firstKey]] };
    return NextResponse.json({ symbol: baseSymbol, data: normalizedPayload });
  } catch (error: any) {
    console.error('[coin-info] Fatal error fetching coin info:', error);
    return NextResponse.json({ error: 'Failed to fetch coin information', message: error?.message }, { status: 500 });
  }
}
