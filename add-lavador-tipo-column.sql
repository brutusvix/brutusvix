-- Adicionar coluna lavador_tipo na tabela users
-- Tipo de lavador: '01' (meta 12 carros, R$10/carro) ou '02' (meta 15 carros, R$7/carro)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lavador_tipo TEXT CHECK (lavador_tipo IN ('01', '02'));

-- Comentário explicativo
COMMENT ON COLUMN users.lavador_tipo IS 'Tipo de lavador: 01 (meta 12 carros, R$10/carro) ou 02 (meta 15 carros, R$7/carro)';

-- Definir valor padrão '01' para lavadores existentes que não têm tipo definido
UPDATE users 
SET lavador_tipo = '01' 
WHERE role = 'LAVADOR' AND lavador_tipo IS NULL;
