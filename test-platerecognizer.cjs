// Teste simples da API PlateRecognizer
const https = require('https');

const apiKey = '458b6823addeef83f7bd27dd39af4a7c2a3161ec';

// Teste 1: Verificar estatísticas (GET simples)
console.log('Testando conexão com PlateRecognizer...\n');

const options = {
  hostname: 'api.platerecognizer.com',
  port: 443,
  path: '/v1/statistics/',
  method: 'GET',
  headers: {
    'Authorization': `Token ${apiKey}`
  },
  timeout: 30000 // 30 segundos
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}\n`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Resposta:');
    console.log(JSON.parse(data));
    console.log('\n✅ Conexão funcionando!');
  });
});

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.error('Código:', error.code);
  
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
    console.log('\n⚠️  Possíveis causas:');
    console.log('1. Firewall do Windows bloqueando Node.js');
    console.log('2. Antivírus bloqueando a conexão');
    console.log('3. Proxy corporativo');
    console.log('\nSolução: Adicione Node.js às exceções do firewall');
  }
});

req.on('timeout', () => {
  console.error('❌ Timeout após 30 segundos');
  req.destroy();
});

req.end();
