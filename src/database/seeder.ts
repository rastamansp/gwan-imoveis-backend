import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/domain/entities/user.entity';
import { Property } from '../shared/domain/entities/property.entity';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';
import { PropertyType } from '../shared/domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../shared/domain/value-objects/property-purpose.enum';
import * as bcrypt from 'bcryptjs';

// UUIDs fixos para permitir seed idempotente
const ADMIN_ID    = '00000000-0000-0000-0000-000000000001';
const CORRETOR_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID     = '00000000-0000-0000-0000-000000000003';
const TEST_ID     = '00000000-0000-0000-0000-000000000004';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async seed(): Promise<void> {
    console.log('🌱 Iniciando seed do banco de dados...');

    await this.createAdminUser();
    await this.createCorretorUser();
    await this.createRegularUser();
    await this.createTestUser();
    await this.createProperties();

    console.log('✅ Seed do banco de dados concluído!');
  }

  private async createAdminUser(): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: 'admin@gwanshop.com' } });
    if (existing) return;

    const user = User.create(
      ADMIN_ID,
      'Administrador do Sistema',
      'admin@gwanshop.com',
      await bcrypt.hash('admin123', 10),
      '+5511999999999',
      null,
      null,
      UserRole.ADMIN,
    );
    await this.userRepository.save(user);
    console.log('👤 Usuário admin criado');
  }

  private async createCorretorUser(): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: 'corretor@litoralimoveis.com.br' } });
    if (existing) return;

    const user = User.create(
      CORRETOR_ID,
      'João Silva Corretor',
      'corretor@litoralimoveis.com.br',
      await bcrypt.hash('corretor123', 10),
      '+5511888888888',
      null,
      null,
      UserRole.CORRETOR,
    );
    await this.userRepository.save(user);
    console.log('👤 Usuário corretor criado');
  }

  private async createRegularUser(): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: 'usuario@gwanshop.com' } });
    if (existing) return;

    const user = User.create(
      USER_ID,
      'Maria Santos',
      'usuario@gwanshop.com',
      await bcrypt.hash('usuario123', 10),
      '+5511777777777',
      null,
      null,
      UserRole.USER,
    );
    await this.userRepository.save(user);
    console.log('👤 Usuário comum criado');
  }

  private async createTestUser(): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: 'joao@email.com' } });
    if (existing) {
      console.log('👤 Usuário de teste já existe');
      return;
    }

    const user = User.create(
      TEST_ID,
      'João Silva',
      'joao@email.com',
      await bcrypt.hash('senha123', 10),
      '+5511666666666',
      null,
      null,
      UserRole.USER,
    );
    await this.userRepository.save(user);
    console.log('👤 Usuário de teste criado (joao@email.com / senha123)');
  }

  private async createProperties(): Promise<void> {
    const count = await this.propertyRepository.count();
    if (count > 0) {
      console.log(`🏠 Imóveis já existem (${count} registros) — seed ignorado`);
      return;
    }

    // Dados espelhados da produção (imoveis-api.gwan.cloud/api/properties)
    const properties: Partial<Property>[] = [
      {
        title: 'Casa Anual Camburi — 80m da Praia',
        description:
          'Casa rústica praiana, a poucos passos da areia. 3 suítes amplas com ar-condicionado, lavabo, sala ampla integrada em dois ambientes, lareira charmosa, pé direito alto, cozinha americana equipada, lavanderia, jardim nos fundos com grandes portas de vidro. Estilo confortável e aconchegante.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 11500,
        neighborhood: 'Camburi',
        city: 'São Sebastião',
        bedrooms: 3,
        bathrooms: 0,
        area: 1,
        garageSpaces: 0,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: true,
        hasGourmetArea: false,
        furnished: true,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Anual Boiçucanga — Nova, nunca usada',
        description:
          'Casa recém-construída em residencial com apenas 5 casas, a 70 metros da praia. Entrada privativa, quintal e piscina privativa, churrasqueira e área gourmet, lavanderia, 2 suítes amplas (piso superior), banheiro completo (piso inferior), sala integrada com cozinha, pé direito alto. Entregue totalmente mobiliada com móveis e eletros novos. Incluso IPTU, condomínio e água. Aceita pets.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 7000,
        neighborhood: 'Boiçucanga',
        city: 'São Sebastião',
        bedrooms: 2,
        bathrooms: 2,
        area: 1,
        garageSpaces: 3,
        hasPool: true,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: false,
        hasGourmetArea: true,
        furnished: true,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Anual Maresias',
        description:
          "Casa em condomínio a 650 metros da praia de Maresias. Estilo Bali, acomoda até 10 pessoas. 2 suítes e 1 quarto com ar-condicionado, mezanino, 3 vagas cobertas, churrasqueira, área gourmet com ventilador, área externa com jardim arborizado e coqueiros, claraboia, ducha externa, Smart TV 55'. Incluso água e IPTU.",
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 5000,
        neighborhood: 'Maresias',
        city: 'São Sebastião',
        bedrooms: 3,
        bathrooms: 0,
        area: 1,
        garageSpaces: 3,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: true,
        hasGourmetArea: true,
        furnished: true,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Camburi Sertão do Piavu — Oportunidade',
        description:
          'Casa com ~200m² de construção em terreno de 630m², localizada no Sertão do Piavu, Camburi. 3 quartos (1 suíte), banheiro social, sala integrada à cozinha, lavanderia, piscina 6x3, churrasqueira grande, banheiro externo, quarto de despensa, área verde com frutas nativas. Escritura de posse há 25 anos. Aceita carro como parte do pagamento.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 450000,
        neighborhood: 'Sertão do Piavu / Camburi',
        city: 'São Sebastião',
        bedrooms: 3,
        bathrooms: 2,
        area: 200,
        garageSpaces: 0,
        hasPool: true,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: true,
        hasGourmetArea: true,
        furnished: false,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Anual Camburi — Village',
        description:
          'Casa em Village Camburi, 1,5 km das praias de Camburi e Camburizinho. 3 quartos amplos, 2 banheiros, 4 vagas de garagem, 190m² de área construída, terraço gourmet, gramado nos fundos (maior que o padrão), sótão amplo, tanque externo. Incluso condomínio, água e IPTU. Também disponível para venda (R$ 750.000). Portaria 24h, monitoramento por câmeras.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 4000,
        neighborhood: 'Camburi',
        city: 'São Sebastião',
        bedrooms: 3,
        bathrooms: 2,
        area: 190,
        garageSpaces: 4,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: true,
        hasGourmetArea: true,
        furnished: false,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Anual Camburi Lado Praia',
        description:
          'Casa a 5 minutos da praia, entre Camburi e Camburizinho. 1 sala, 1 cozinha com balcão americano, 1 banheiro completo, 1 quarto, 1 mezanino e área de serviço. Sem mobília. Acomoda 2 adultos. Incluso IPTU e água. Não aceita pets.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 1450,
        neighborhood: 'Camburi',
        city: 'São Sebastião',
        bedrooms: 1,
        bathrooms: 1,
        area: 1,
        garageSpaces: 0,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: false,
        hasGourmetArea: false,
        furnished: false,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Anual Camburizinho — 100m da praia',
        description:
          'Casa ampla estilo fazenda, térrea, pé direito alto. Sala de estar integrada com jantar, sala de lareira, cozinha ampla com muitos armários. 4 quartos (1 suíte), todos com guarda-roupas embutidos, 1 banheiro, área gourmet coberta com churrasqueira, gramado espaçoso, garagem para 4 carros. Incluso água. Aceita pets.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 6500,
        neighborhood: 'Camburizinho',
        city: 'São Sebastião',
        bedrooms: 4,
        bathrooms: 1,
        area: 1,
        garageSpaces: 4,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: true,
        hasGourmetArea: true,
        furnished: false,
        realtorId: CORRETOR_ID,
      },
      {
        title: 'Casa Village Camburi',
        description:
          'Casa nova (aprox. 4 anos) localizada no centro do condomínio, em rua extremamente tranquila. Grande investimento em madeiras nobres. Terreno de 200m², área construída de 75m², 3 dormitórios (1 suíte), sala e cozinha integradas, banheiro social + lavabo. 1,2 km da praia. Aceita financiamento.',
        type: PropertyType.CASA,
        purpose: PropertyPurpose.RENT,
        price: 730000,
        neighborhood: 'Sertão de Camburi',
        city: 'São Sebastião',
        bedrooms: 3,
        bathrooms: 2,
        area: 75,
        garageSpaces: 0,
        hasPool: false,
        hasJacuzzi: false,
        oceanFront: false,
        hasGarden: false,
        hasGourmetArea: false,
        furnished: false,
        realtorId: CORRETOR_ID,
      },
    ];

    for (const data of properties) {
      const property = this.propertyRepository.create(data);
      await this.propertyRepository.save(property);
    }

    console.log(`🏠 ${properties.length} imóveis criados com sucesso`);
  }
}
