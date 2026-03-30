import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const plateRecognizerKey = process.env.PLATE_RECOGNIZER_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

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
      result.placa = plateData.plate;
      
      // PlateRecognizer também detecta marca/modelo/cor em alguns casos
      if (plateData.vehicle) {
        result.tipo = plateData.vehicle.type || result.tipo;
        result.marca = plateData.vehicle.make || result.marca;
        result.modelo = plateData.vehicle.model || result.modelo;
        
        // Cor pode vir como array
        if (plateData.vehicle.color && Array.isArray(plateData.vehicle.color) && plateData.vehicle.color.length > 0) {
          result.cor = plateData.vehicle.color[0].name || result.cor;
        }
      }
      
      console.log('Successfully extracted vehicle data:', result);
    } else {
      console.log('No plates detected in image');
      return res.status(400).json({ 
        error: 'Nenhuma placa detectada na imagem. Tire uma foto mais próxima da placa.' 
      });
    }
    
    console.log('Final result:', result);
    
    // Se não detectou marca/modelo/cor, tentar com Gemini Vision
    if (geminiApiKey && (!result.marca || !result.modelo || !result.cor)) {
      try {
        console.log('Trying Gemini Vision for make/model/color...');
        console.log('Has Gemini API Key:', !!geminiApiKey);
        
        const geminiPrompt = `Analise esta imagem de veículo e retorne APENAS um objeto JSON válido com marca, modelo e cor. Formato: {"marca":"Toyota","modelo":"Corolla","cor":"Prata"}`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: geminiPrompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 100,
                topP: 0.95,
                topK: 40
              }
            })
          }
        );

        console.log('Gemini response status:', geminiResponse.status);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          console.log('Gemini raw response:', JSON.stringify(geminiData, null, 2));
          
          const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (geminiText) {
            console.log('Gemini text response:', geminiText);
            
            // Limpar resposta (remover markdown se houver)
            let cleanText = geminiText.trim();
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // Extrair JSON da resposta
            let geminiResult;
            try {
              geminiResult = JSON.parse(cleanText);
            } catch {
              const jsonMatch = cleanText.match(/\{[^}]*\}/);
              if (jsonMatch) {
                try {
                  geminiResult = JSON.parse(jsonMatch[0]);
                } catch (e) {
                  console.log('Failed to parse extracted JSON:', jsonMatch[0]);
                }
              }
            }
            
            if (geminiResult) {
              result.marca = result.marca || geminiResult.marca;
              result.modelo = result.modelo || geminiResult.modelo;
              result.cor = result.cor || geminiResult.cor;
              console.log('Gemini enhanced result:', result);
            } else {
              console.log('Could not parse Gemini JSON response');
            }
          } else {
            console.log('No text in Gemini response');
          }
        } else {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', geminiResponse.status, errorText);
        }
      } catch (geminiError: any) {
        console.error('Gemini Vision error (non-critical):', geminiError.message);
        console.error('Gemini error stack:', geminiError.stack);
        // Não falhar se Gemini não funcionar
      }
    } else {
      console.log('Skipping Gemini:', {
        hasKey: !!geminiApiKey,
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
