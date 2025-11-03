export interface SpotifyArtistData {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string; height: number | null; width: number | null }>;
  external_urls: { spotify: string };
  topTracks: Array<{
    id: string;
    name: string;
    duration_ms: number;
    popularity: number;
    preview_url: string | null;
    album: {
      id: string;
      name: string;
      images: Array<{ url: string; height: number | null; width: number | null }>;
    };
  }>;
  albums: Array<{
    id: string;
    name: string;
    release_date: string;
    total_tracks: number;
    images: Array<{ url: string; height: number | null; width: number | null }>;
    album_type: string;
  }>;
  relatedArtists: Array<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
  }>;
}

export interface ISpotifyService {
  /**
   * Extrai o ID do artista de uma URL do Spotify
   * @param spotifyUrl URL do artista no Spotify (ex: https://open.spotify.com/artist/6nynI5RNNt5DJ9gB4jCRTb)
   * @returns ID do artista extraído da URL
   */
  extractArtistIdFromUrl(spotifyUrl: string): string;

  /**
   * Busca todos os dados disponíveis de um artista no Spotify
   * @param spotifyId ID do artista no Spotify
   * @returns Dados completos do artista incluindo top tracks, álbuns e artistas relacionados
   */
  fetchArtistData(spotifyId: string): Promise<SpotifyArtistData>;
}

