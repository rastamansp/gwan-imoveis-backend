import { Injectable, Inject } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { Property } from '../../shared/domain/entities/property.entity';
import { PropertyImage } from '../../shared/domain/entities/property-image.entity';
import { PropertyType } from '../../shared/domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../../shared/domain/value-objects/property-purpose.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { RealtorContact } from './realtor-contact-resolver.service';

const TYPE_LABEL: Record<PropertyType, string> = {
  [PropertyType.CASA]: 'Casa',
  [PropertyType.APARTAMENTO]: 'Apartamento',
  [PropertyType.TERRENO]: 'Terreno',
  [PropertyType.SALA_COMERCIAL]: 'Sala Comercial',
};

const PURPOSE_LABEL: Record<PropertyPurpose, string> = {
  [PropertyPurpose.RENT]: 'Locação',
  [PropertyPurpose.SALE]: 'Venda',
  [PropertyPurpose.INVESTMENT]: 'Investimento',
};

const PAGE_MARGIN = 50;
const ACCENT = '#0F766E';
const MUTED = '#64748B';
const TEXT = '#1F2937';

@Injectable()
export class PropertyPdfService {
  constructor(@Inject('ILogger') private readonly logger: ILogger) {}

  async generate(
    property: Property,
    images: PropertyImage[],
    contact: RealtorContact | null,
  ): Promise<Buffer> {
    const orderedImages = this.orderImages(images, property.coverImageUrl);
    const downloaded = await this.downloadImages(orderedImages.map((img) => img.url));

    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Title: property.title,
        Subject: `Anúncio: ${property.title}`,
        Author: 'Imóveis',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderHeader(doc, property);
    this.renderCover(doc, downloaded[0]);
    this.renderKeyData(doc, property);
    this.renderAmenities(doc, property);
    this.renderDescription(doc, property);
    this.renderRealtor(doc, property, contact);
    this.renderGallery(doc, downloaded.slice(1));
    this.renderFooter(doc, property);

    doc.end();
    return done;
  }

  private orderImages(images: PropertyImage[], coverUrl?: string): PropertyImage[] {
    const sorted = [...images].sort((a, b) => {
      if (a.isCover && !b.isCover) return -1;
      if (!a.isCover && b.isCover) return 1;
      return a.order - b.order;
    });

    if (coverUrl && !sorted.some((img) => img.isCover)) {
      const idx = sorted.findIndex((img) => img.url === coverUrl);
      if (idx > 0) {
        const [cover] = sorted.splice(idx, 1);
        sorted.unshift(cover);
      }
    }

    return sorted;
  }

  private async downloadImages(urls: string[]): Promise<Array<Buffer | null>> {
    return Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            this.logger.warn('PDF: imagem indisponível', { url, status: res.status });
            return null;
          }
          return Buffer.from(await res.arrayBuffer());
        } catch (err) {
          this.logger.warn('PDF: falha ao baixar imagem', {
            url,
            error: err instanceof Error ? err.message : String(err),
          });
          return null;
        }
      }),
    );
  }

  private renderHeader(doc: PDFKit.PDFDocument, property: Property): void {
    doc
      .fillColor(ACCENT)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('IMÓVEIS', { align: 'left' });

    doc
      .fillColor(TEXT)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(property.title, { align: 'left' });

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(11)
      .text(
        `${TYPE_LABEL[property.type] ?? property.type} • ${PURPOSE_LABEL[property.purpose] ?? property.purpose} • ${property.neighborhood}, ${property.city}`,
        { align: 'left' },
      );

    doc.moveDown(0.5);
    doc
      .strokeColor(ACCENT)
      .lineWidth(2)
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
      .stroke();
    doc.moveDown(0.7);
  }

  private renderCover(doc: PDFKit.PDFDocument, cover: Buffer | null): void {
    if (!cover) return;
    const width = doc.page.width - PAGE_MARGIN * 2;
    const height = 260;
    try {
      doc.image(cover, PAGE_MARGIN, doc.y, { width, height, fit: [width, height], align: 'center' });
      doc.y = doc.y + height + 12;
    } catch (err) {
      this.logger.warn('PDF: falha ao renderizar capa', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private renderKeyData(doc: PDFKit.PDFDocument, property: Property): void {
    const price = this.formatCurrency(Number(property.price));
    doc
      .fillColor(ACCENT)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(price, PAGE_MARGIN, doc.y, { continued: false });

    doc.moveDown(0.4);

    const items: string[] = [];
    items.push(`${Number(property.area)} m²`);
    if (property.bedrooms !== undefined && property.bedrooms !== null) {
      items.push(`${property.bedrooms} ${property.bedrooms === 1 ? 'quarto' : 'quartos'}`);
    }
    if (property.bathrooms !== undefined && property.bathrooms !== null) {
      items.push(`${property.bathrooms} ${property.bathrooms === 1 ? 'banheiro' : 'banheiros'}`);
    }
    if (property.garageSpaces !== undefined && property.garageSpaces !== null && property.garageSpaces > 0) {
      items.push(`${property.garageSpaces} ${property.garageSpaces === 1 ? 'vaga' : 'vagas'}`);
    }

    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(12)
      .text(items.join('  •  '), PAGE_MARGIN, doc.y);

    doc.moveDown(0.8);
  }

  private renderAmenities(doc: PDFKit.PDFDocument, property: Property): void {
    const amenities: string[] = [];
    if (property.hasPool) amenities.push('Piscina');
    if (property.hasJacuzzi) amenities.push('Hidromassagem');
    if (property.oceanFront) amenities.push('Frente para o mar');
    if (property.hasGarden) amenities.push('Jardim');
    if (property.hasGourmetArea) amenities.push('Área gourmet');
    if (property.furnished) amenities.push('Mobiliado');

    if (amenities.length === 0) return;

    this.sectionTitle(doc, 'Comodidades');
    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(11)
      .text(amenities.map((a) => `• ${a}`).join('   '), PAGE_MARGIN, doc.y, {
        width: doc.page.width - PAGE_MARGIN * 2,
      });
    doc.moveDown(0.8);
  }

  private renderDescription(doc: PDFKit.PDFDocument, property: Property): void {
    if (!property.description) return;
    this.sectionTitle(doc, 'Descrição');
    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(11)
      .text(property.description, PAGE_MARGIN, doc.y, {
        width: doc.page.width - PAGE_MARGIN * 2,
        align: 'justify',
      });
    doc.moveDown(0.8);
  }

  private renderRealtor(
    doc: PDFKit.PDFDocument,
    property: Property,
    contact: RealtorContact | null,
  ): void {
    if (!property.realtor) return;
    this.sectionTitle(doc, 'Contato');

    const realtor = property.realtor;
    const profile = realtor.realtorProfile;
    const lines: string[] = [];
    const name = profile?.contactName || realtor.name;
    const business = profile?.businessName;
    if (business && business !== name) {
      lines.push(`${name} — ${business}`);
    } else {
      lines.push(name);
    }
    const email = profile?.email || realtor.email;
    if (email) lines.push(`Email: ${email}`);

    const whatsapp = contact?.whatsapp || profile?.whatsappBusiness || realtor.whatsappNumber;
    if (whatsapp) lines.push(`WhatsApp: ${whatsapp}`);

    const phone = profile?.phone || realtor.phone;
    if (phone && phone !== whatsapp) lines.push(`Telefone: ${phone}`);

    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(11)
      .text(lines.join('\n'), PAGE_MARGIN, doc.y, {
        width: doc.page.width - PAGE_MARGIN * 2,
      });
    doc.moveDown(0.8);
  }

  private renderGallery(doc: PDFKit.PDFDocument, images: Array<Buffer | null>): void {
    const valid = images.filter((img): img is Buffer => img !== null);
    if (valid.length === 0) return;

    doc.addPage();
    this.sectionTitle(doc, 'Galeria de fotos');

    const gap = 10;
    const cols = 2;
    const cellWidth = (doc.page.width - PAGE_MARGIN * 2 - gap * (cols - 1)) / cols;
    const cellHeight = 180;
    const bottomLimit = doc.page.height - PAGE_MARGIN;

    let col = 0;
    let rowTop = doc.y;

    for (const img of valid) {
      if (rowTop + cellHeight > bottomLimit) {
        doc.addPage();
        rowTop = doc.y;
        col = 0;
      }

      const x = PAGE_MARGIN + col * (cellWidth + gap);
      try {
        doc.image(img, x, rowTop, { fit: [cellWidth, cellHeight], align: 'center', valign: 'center' });
      } catch (err) {
        this.logger.warn('PDF: falha ao renderizar imagem da galeria', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      col++;
      if (col >= cols) {
        col = 0;
        rowTop += cellHeight + gap;
        doc.y = rowTop;
      }
    }
  }

  private renderFooter(doc: PDFKit.PDFDocument, property: Property): void {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - PAGE_MARGIN + 10;
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Ref. ${property.id.slice(0, 8)}  •  Gerado em ${this.formatDate(new Date())}  •  imoveis.gwan.cloud`,
          PAGE_MARGIN,
          y,
          { width: doc.page.width - PAGE_MARGIN * 2, align: 'center' },
        );
    }
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fillColor(ACCENT)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(title, PAGE_MARGIN, doc.y);
    doc.moveDown(0.25);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
