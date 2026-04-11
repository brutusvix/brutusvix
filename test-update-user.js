// Script de teste para atualizar usuário localmente
// Execute: node test-update-user.js

const userId = '29e6f546-2b58-4c1f-b28f-d55b45ee4017';
const token = 'SEU_TOKEN_AQUI'; // Cole o token do localStorage

const updates = {
  name: 'Gabriel da Hora Coutinho',
  lavadorTipo: '01',
  comissoesServico: {
    'Cera': 5,
    'Revitalização': 5,
    'Hig Bancos': 30,
    'Teto': 20,
    'Motor': 20,
    'Chassi Hatch': 30,
    'Chassi Sedan': 30,
    'Chassi SUV': 40,
    'Chassi Caminhonete': 50,
    'Pelo de Cachorro': 5
  }
};

fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updates)
})
.then(res => res.json())
.then(data => console.log('✅ Sucesso:', data))
.catch(err => console.error('❌ Erro:', err));
