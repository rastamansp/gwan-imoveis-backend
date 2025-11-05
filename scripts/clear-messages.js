const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearMessages() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: false,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conectado com sucesso!');

    console.log('🗑️  Limpando mensagens...');
    const result = await dataSource.query('DELETE FROM messages');
    console.log(`✅ Mensagens deletadas!`);

    // Verificar quantidade restante
    const countResult = await dataSource.query('SELECT COUNT(*) as total FROM messages');
    const total = countResult[0]?.total || 0;
    console.log(`📊 Total de mensagens restantes: ${total}`);

    await dataSource.destroy();
    console.log('✅ Conexão fechada com sucesso!');
    console.log('');
    console.log('⚠️  IMPORTANTE: Agora você precisa limpar o cache Redis também!');
    console.log('   Execute: redis-cli FLUSHDB');
    console.log('   Ou reinicie o Redis para limpar o cache em memória.');
  } catch (error) {
    console.error('❌ Erro ao limpar mensagens:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

clearMessages();

