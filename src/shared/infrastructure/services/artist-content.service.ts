import { Injectable } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { Event } from '../../domain/entities/event.entity';

export interface ArtistMetadata {
  artist: {
    id: string;
    artisticName: string;
    name: string;
    birthDate: string | null;
    biography: string | null;
    instagramUsername: string | null;
    youtubeUsername: string | null;
    xUsername: string | null;
    spotifyUsername: string | null;
    siteUrl: string | null;
    tiktokUsername: string | null;
    image: string | null;
  };
  events: Array<{
    id: string;
    title: string;
    description: string;
    code: string | null;
    date: string;
    location: string;
    city: string;
    state: string;
    category: string;
  }>;
  textContent: string;
  spotify?: any; // Dados do Spotify preservados quando existem
}

@Injectable()
export class ArtistContentService {
  /**
   * Constrói os metadados completos do artista em formato JSON
   */
  buildArtistMetadata(artist: Artist, events: Event[]): ArtistMetadata {
    // Converter birthDate para string se necessário (TypeORM pode retornar como string)
    let birthDateString: string | null = null;
    if (artist.birthDate) {
      if (artist.birthDate instanceof Date) {
        birthDateString = artist.birthDate.toISOString().split('T')[0];
      } else {
        // TypeORM pode retornar como string ou outro tipo
        const dateStr = String(artist.birthDate);
        birthDateString = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      }
    }

    const metadata: ArtistMetadata = {
      artist: {
        id: artist.id,
        artisticName: artist.artisticName,
        name: artist.name,
        birthDate: birthDateString,
        biography: artist.biography || null,
        instagramUsername: artist.instagramUsername || null,
        youtubeUsername: artist.youtubeUsername || null,
        xUsername: artist.xUsername || null,
        spotifyUsername: artist.spotifyUsername || null,
        siteUrl: artist.siteUrl || null,
        tiktokUsername: artist.tiktokUsername || null,
        image: artist.image || null,
      },
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        code: event.code || null,
        date: event.date.toISOString(),
        location: event.location,
        city: event.city,
        state: event.state,
        category: event.category,
      })),
      textContent: this.buildTextContent(artist, events),
    };

    return metadata;
  }

  /**
   * Constrói o texto consolidado para geração de embedding
   * Formato estruturado para melhor compreensão semântica
   */
  buildTextContent(artist: Artist, events: Event[]): string {
    const parts: string[] = [];

    // Informações principais do artista
    parts.push(`Artista: ${artist.artisticName}`);
    parts.push(`Nome completo: ${artist.name}`);
    
    if (artist.birthDate) {
      // Converter birthDate para Date se necessário
      const birthDate = artist.birthDate instanceof Date 
        ? artist.birthDate 
        : new Date(artist.birthDate);
      parts.push(`Data de nascimento: ${birthDate.toLocaleDateString('pt-BR')}`);
    }

    if (artist.biography) {
      parts.push(`Biografia: ${artist.biography}`);
    }

    // Redes sociais
    const socialNetworks: string[] = [];
    if (artist.instagramUsername) {
      socialNetworks.push(`Instagram: @${artist.instagramUsername}`);
    }
    if (artist.youtubeUsername) {
      socialNetworks.push(`YouTube: @${artist.youtubeUsername}`);
    }
    if (artist.xUsername) {
      socialNetworks.push(`X/Twitter: @${artist.xUsername}`);
    }
    if (artist.spotifyUsername) {
      socialNetworks.push(`Spotify: @${artist.spotifyUsername}`);
    }
    if (artist.tiktokUsername) {
      socialNetworks.push(`TikTok: @${artist.tiktokUsername}`);
    }
    if (socialNetworks.length > 0) {
      parts.push(`Redes sociais: ${socialNetworks.join(', ')}`);
    }

    if (artist.siteUrl) {
      parts.push(`Site: ${artist.siteUrl}`);
    }

    // Eventos vinculados
    if (events.length > 0) {
      parts.push(`\nEventos (${events.length}):`);
      events.forEach((event, index) => {
        parts.push(`${index + 1}. ${event.title}`);
        parts.push(`   Data: ${event.date.toLocaleString('pt-BR')}`);
        parts.push(`   Local: ${event.location}, ${event.city} - ${event.state}`);
        parts.push(`   Categoria: ${event.category}`);
        if (event.code) {
          parts.push(`   Código: ${event.code}`);
        }
      });
    }

    return parts.join('\n');
  }
}

