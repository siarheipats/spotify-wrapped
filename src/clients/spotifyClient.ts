type SpotifyImage = { url: string; width: number; height: number };
export type SpotifyArtist = { id: string; name: string; images: SpotifyImage[] };

const CLIENT_ID = (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const CLIENT_SECRET = (import.meta as any).env?.VITE_SPOTIFY_CLIENT_SECRET as string | undefined;

let token: { access_token: string; expires_at: number } | null = null;

async function fetchToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Missing VITE_SPOTIFY_CLIENT_ID/SECRET env vars");
  const now = Date.now();
  if (token && token.expires_at > now + 5000) return token.access_token;
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  token = { access_token: data.access_token, expires_at: now + (data.expires_in ?? 3600) * 1000 };
  return token.access_token;
}

export async function searchArtistByName(name: string): Promise<SpotifyArtist | null> {
  const t = await fetchToken();
  const url = `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(name)}&type=artist&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.artists?.items?.[0];
  if (!item) return null;
  return { id: item.id as string, name: item.name as string, images: (item.images ?? []) as SpotifyImage[] };
}

export async function getArtistsByIds(ids: string[]): Promise<SpotifyArtist[]> {
  if (ids.length === 0) return [];
  const t = await fetchToken();
  const url = `https://api.spotify.com/v1/artists?ids=${encodeURIComponent(ids.join(","))}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) return [];
  const data = await res.json();
  const arr = (data?.artists ?? []) as any[];
  return arr.map((a) => ({ id: a.id as string, name: a.name as string, images: (a.images ?? []) as SpotifyImage[] }));
}

export async function getArtistImageByName(name: string): Promise<string | undefined> {
  const artist = await searchArtistByName(name);
  return artist?.images?.[0]?.url;
}
