import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
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

  // Rate limiting: 20 por hora
  const ip = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
  if (!checkRateLimit(ip, 20, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Limite de análises de IA atingido. Tente em 1 hora.' });
  }

  // Autenticação
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'Gemini API not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Usar o token do usuário para autenticar
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(403).json({ error: 'Token inválido', details: error?.message });
    }

    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    console.log('Starting Gemini analysis for user:', user.id);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    // Tentar com gemini-1.5-pro primeiro
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro"
      });
    } catch (err) {
      // Fallback para gemini-pro-vision
      model = genAI.getGenerativeModel({ 
        model: "gemini-pro-vision"
      });
    }
    
    const base64Data = image.split(',')[1];
    
    if (!base64Data) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }
    
    const prompt = `Analyze this vehicle image. Identify the brand (marca), model (modelo), color (cor), and type (tipo: Carro, SUV, Moto, Caminhonete).

CRITICAL: Identify the license plate (placa) with 100% accuracy. Look very closely at the characters on the plate. Support both standard Brazilian format (ABC-1234) and Mercosul format (ABC1D23).

IMPORTANT: You MUST return the EXACT letters and numbers seen on the plate. NEVER use placeholders or generic characters. If the plate is 'MJC-0110', you must return 'MJC-0110'. If the plate is 'LMB6H44', you must return 'LMB6H44'. Pay special attention to the first 3 letters. If you cannot read a character, return null for the 'placa' field.

Estimate the dirt level (nivel_sujeira: Leve, Médio, Pesado). Return a JSON object with these fields:
{
  "marca": "string",
  "modelo": "string",
  "cor": "string",
  "tipo": "string",
  "placa": "string or null",
  "nivel_sujeira": "string"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Log para debug
    console.log('Gemini response text:', text);
    
    // Tentar extrair JSON da resposta
    let jsonResult;
    try {
      // Tentar parse direto
      jsonResult = JSON.parse(text);
    } catch {
      // Se falhar, tentar extrair JSON de markdown
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }
    
    return res.status(200).json(jsonResult);
  } catch (err: any) {
    console.error('Gemini API error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ 
      error: 'Failed to analyze image. Please try again.',
      details: err.message 
    });
  }
}
