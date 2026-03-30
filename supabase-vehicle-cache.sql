-- ============================================
-- TABELA DE CACHE DE VEÍCULOS
-- ============================================
-- Armazena dados de veículos já processados
-- para preenchimento automático em visitas futuras

CREATE TABLE IF NOT EXISTS vehicle_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  marca TEXT,
  modelo TEXT,
  cor TEXT,
  tipo TEXT DEFAULT 'Carro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para busca rápida
  CONSTRAINT placa_format CHECK (placa ~ '^[A-Z0-9]{7}$')
);

-- Índice para busca rápida por placa
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_placa ON vehicle_cache(placa);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_vehicle_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_cache_updated_at
  BEFORE UPDATE ON vehicle_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_cache_updated_at();

-- Comentários
COMMENT ON TABLE vehicle_cache IS 'Cache de dados de veículos para preenchimento automático';
COMMENT ON COLUMN vehicle_cache.placa IS 'Placa do veículo (formato brasileiro: 7 caracteres)';
COMMENT ON COLUMN vehicle_cache.marca IS 'Marca do veículo (ex: Volkswagen, Fiat)';
COMMENT ON COLUMN vehicle_cache.modelo IS 'Modelo do veículo (ex: Gol, Uno)';
COMMENT ON COLUMN vehicle_cache.cor IS 'Cor do veículo (ex: Branco, Preto)';
COMMENT ON COLUMN vehicle_cache.tipo IS 'Tipo do veículo (ex: Sedan, SUV, Pickup)';
