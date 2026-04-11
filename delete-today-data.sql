-- ⚠️ ATENÇÃO: Este script apaga dados de HOJE
-- Execute com cuidado! Não há como desfazer.

-- Definir a data de hoje
DO $$
DECLARE
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Mostrar o que será deletado (para conferência)
    RAISE NOTICE 'Data de hoje: %', today_date;
    
    -- Contar registros antes de deletar
    RAISE NOTICE 'Agendamentos de hoje: %', (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) = today_date);
    RAISE NOTICE 'Transações de hoje: %', (SELECT COUNT(*) FROM transactions WHERE DATE(date) = today_date);
END $$;

-- ============================================
-- DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR
-- ============================================

-- 1. Deletar agendamentos de hoje
-- DELETE FROM appointments 
-- WHERE DATE(start_time) = CURRENT_DATE;

-- 2. Deletar transações de hoje
-- DELETE FROM transactions 
-- WHERE DATE(date) = CURRENT_DATE;

-- Verificar após deletar
-- SELECT 
--     (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) = CURRENT_DATE) as agendamentos_restantes,
--     (SELECT COUNT(*) FROM transactions WHERE DATE(date) = CURRENT_DATE) as transacoes_restantes;
