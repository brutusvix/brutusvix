import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const plateRecognizerKey = process.env.PLATE_RECOGNIZER_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

// Rate limiting simples em memória (para produção, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 100 por hora (para testes)
  const ip = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
  if (!checkRateLimit(ip, 100, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Limite de análises atingido. Tente em 1 hora.' });
  }

  // Autenticação
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Supabase config missing:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey, 
      hasAnonKey: !!supabaseAnonKey 
    });
    return res.status(500).json({ 
      error: 'Supabase not configured',
      details: 'Missing environment variables. Check Vercel settings.'
    });
  }

  if (!plateRecognizerKey) {
    console.error('PLATE_RECOGNIZER_API_KEY not configured');
    return res.status(500).json({ 
      error: 'PlateRecognizer API não configurada',
      details: 'Missing PLATE_RECOGNIZER_API_KEY in Vercel environment variables'
    });
  }

  try {
    // Usar o token do usuário para autenticar
    console.log('Authenticating user with Supabase...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Has Anon Key:', !!supabaseAnonKey);
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error) {
      console.error('Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return res.status(403).json({ 
        error: 'Falha na autenticação', 
        details: error.message,
        hint: 'Token pode estar expirado. Faça logout e login novamente.'
      });
    }
    
    if (!user) {
      console.error('No user returned from Supabase');
      return res.status(403).json({ 
        error: 'Usuário não encontrado',
        hint: 'Token inválido. Faça logout e login novamente.'
      });
    }

    console.log('User authenticated successfully:', user.id);

    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    console.log('Starting PlateRecognizer analysis for user:', user.id);
    
    const base64Data = image.split(',')[1];
    
    if (!base64Data) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }

    let result: any = {
      marca: null,
      modelo: null,
      cor: null,
      tipo: 'Carro',
      placa: null,
      nivel_sujeira: 'Médio'
    };

    // Usar PlateRecognizer com multipart/form-data
    console.log('Calling PlateRecognizer API...');
    
    // Criar boundary para multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Construir corpo multipart/form-data
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="upload"\r\n\r\n`;
    body += `${base64Data}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="regions"\r\n\r\n`;
    body += `br\r\n`;
    body += `--${boundary}--\r\n`;
    
    const prResponse = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${plateRecognizerKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body
    });

    const prData = await prResponse.json();
    console.log('PlateRecognizer response:', JSON.stringify(prData, null, 2));

    if (!prResponse.ok) {
      console.error('PlateRecognizer API error:', prData);
      return res.status(500).json({ 
        error: 'Erro ao processar imagem com PlateRecognizer',
        details: prData 
      });
    }
    
    if (prData.results && prData.results.length > 0) {
      const plateData = prData.results[0];
      result.placa = plateData.plate?.toUpperCase();
      
      // PlateRecognizer também detecta tipo de veículo
      if (plateData.vehicle) {
        result.tipo = plateData.vehicle.type || result.tipo;
      }
      
      console.log('Plate detected:', result.placa);
    } else {
      console.log('No plates detected in image');
      return res.status(400).json({ 
        error: 'Nenhuma placa detectada na imagem. Tire uma foto mais próxima da placa.' 
      });
    }
    
    // Buscar no cache do banco de dados
    if (result.placa) {
      console.log('Searching vehicle cache for plate:', result.placa);
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: cachedVehicle, error: cacheError } = await supabaseAdmin
        .from('vehicle_cache')
        .select('marca, modelo, cor, tipo')
        .eq('placa', result.placa)
        .single();
      
      if (!cacheError && cachedVehicle) {
        console.log('Found in cache:', cachedVehicle);
        result.marca = cachedVehicle.marca;
        result.modelo = cachedVehicle.modelo;
        result.cor = cachedVehicle.cor;
        result.tipo = cachedVehicle.tipo || result.tipo;
        
        console.log('Final result (from cache):', result);
        return res.status(200).json(result);
      } else {
        console.log('Not found in cache, will try AI detection');
      }
    }
    
    console.log('Final result:', result);
    
    // Se não encontrou no cache, tentar com Groq Vision
    if (groqApiKey && (!result.marca || !result.modelo || !result.cor)) {
      try {
        console.log('Trying Groq Vision for make/model/color...');
        console.log('Has Groq API Key:', !!groqApiKey);
        
        const groqPrompt = `Analise esta imagem de veículo e identifique:
- Marca (ex: Volkswagen, Fiat, Chevrolet, Toyota)
- Modelo (ex: Gol, Uno, Onix, Corolla)
- Cor (ex: Branco, Preto, Prata, Vermelho)

Responda APENAS com um objeto JSON válido neste formato exato:
{"marca":"Volkswagen","modelo":"Gol","cor":"Branco"}`;

        const groqResponse = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.2-90b-vision-preview',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: groqPrompt
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:image/jpeg;base64,${base64Data}`
                      }
                    }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 100
            })
          }
        );

        console.log('Groq response status:', groqResponse.status);

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          console.log('Groq raw response:', JSON.stringify(groqData, null, 2));
          
          const groqText = groqData.choices?.[0]?.message?.content;
          
          if (groqText) {
            console.log('Groq text response:', groqText);
            
            // Limpar resposta (remover markdown se houver)
            let cleanText = groqText.trim();
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // Extrair JSON da resposta
            let groqResult;
            try {
              groqResult = JSON.parse(cleanText);
            } catch {
              const jsonMatch = cleanText.match(/\{[^}]*\}/);
              if (jsonMatch) {
                try {
                  groqResult = JSON.parse(jsonMatch[0]);
                } catch (e) {
                  console.log('Failed to parse extracted JSON:', jsonMatch[0]);
                }
              }
            }
            
            if (groqResult) {
              result.marca = result.marca || groqResult.marca;
              result.modelo = result.modelo || groqResult.modelo;
              result.cor = result.cor || groqResult.cor;
              console.log('Groq enhanced result:', result);
              
              // Salvar no cache para próxima vez
              if (result.placa && (result.marca || result.modelo || result.cor)) {
                console.log('Saving to cache:', result);
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                await supabaseAdmin
                  .from('vehicle_cache')
                  .upsert({
                    placa: result.placa,
                    marca: result.marca,
                    modelo: result.modelo,
                    cor: result.cor,
                    tipo: result.tipo
                  }, {
                    onConflict: 'placa'
                  });
              }
            } else {
              console.log('Could not parse Groq JSON response');
            }
          } else {
            console.log('No text in Groq response');
          }
        } else {
          const errorText = await groqResponse.text();
          console.error('Groq API error:', groqResponse.status, errorText);
        }
      } catch (groqError: any) {
        console.error('Groq Vision error (non-critical):', groqError.message);
        console.error('Groq error stack:', groqError.stack);
        // Não falhar se Groq não funcionar
      }
    } else {
      console.log('Skipping Groq:', {
        hasKey: !!groqApiKey,
        hasMarca: !!result.marca,
        hasModelo: !!result.modelo,
        hasCor: !!result.cor
      });
    }
    
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Vehicle analysis error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ 
      error: 'Erro ao processar imagem. Tente novamente.',
      details: err.message 
    });
  }
}
