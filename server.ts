import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { 
  createUserSchema, 
  updateUserSchema, 
  analyzeVehicleSchema 
} from './src/validation/schemas.js';
import logger, { logError, logUserAction, logApiAccess, logSecurityEvent } from './src/utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 64');
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validação de variáveis de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables. Backend APIs cannot start.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helmet - Headers de segurança
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://yfhiqhupuhrhsrzyqjli.supabase.co", "wss://yfhiqhupuhrhsrzyqjli.supabase.co", "ws://localhost:24678"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Forçar HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 horas
  }));
  app.use(express.json());

  // Rate Limiting - Proteção contra DDoS e brute force
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Reduzido de 100 para 50
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Muitas requisições. Aguarde 15 minutos.',
        retryAfter: 900
      });
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3, // Reduzido de 5 para 3
    skipSuccessfulRequests: true, // Não contar logins bem-sucedidos
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limit específico para Gemini AI (custo financeiro)
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 100, // Máximo 100 análises por hora (para testes)
    message: { error: 'Limite de análises de IA atingido. Tente em 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

  // Aplicar rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', authLimiter);

  // Auth Middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      logSecurityEvent('Missing auth token', 'low', { 
        path: req.path,
        ip: req.ip 
      });
      return res.sendStatus(401);
    }

    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
      // Usar anon key para validar token do cliente
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseAnonKey) {
        return res.status(500).json({ error: 'Supabase anon key not configured' });
      }
      
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      
      if (error || !user) {
        console.error('Auth error:', error?.message);
        logSecurityEvent('Invalid auth token', 'medium', { 
          path: req.path,
          ip: req.ip,
          error: error?.message 
        });
        return res.sendStatus(403);
      }

      // Get user role and unit_id from DB
      const { data: dbUser } = await supabase
        .from('users')
        .select('role, unit_id')
        .eq('auth_id', user.id)
        .single();

      req.user = { 
        ...user, 
        role: dbUser?.role || 'LAVADOR', 
        unit_id: dbUser?.unit_id 
      };
      next();
    } catch (err) {
      console.error('Authentication error:', err);
      logError('Authentication error', err as Error, { path: req.path });
      res.sendStatus(403);
    }
  };

  // API Routes
  app.post('/api/auth/login', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { email, password } = req.body;
    
    // This is a fallback for legacy login if needed, but the app uses Supabase Auth directly
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !user) return res.status(400).json({ error: 'Usuário não encontrado no sistema' });

    res.json({ token: authData.session.access_token, user });
  });

  app.post('/api/users', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    if (req.user.role !== 'DONO') return res.status(403).json({ error: 'Acesso negado' });

    try {
      // Validar input com Zod
      const validatedData = createUserSchema.parse(req.body);
      
      const { 
        name, email, password, role, unit_id, phone, 
        tipoPagamento, valorDiaria, comissaoPercentualServico, 
        valorAlmoco, valorPassagem, comissoesServico 
      } = validatedData;
      // 1. Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      if (!authUser?.user) {
        return res.status(500).json({ error: 'Erro ao criar usuário na autenticação' });
      }

      // 2. Create user in users table
      const { data: newUser, error: userError } = await supabase.from('users').insert({
        auth_id: authUser.user.id,
        name,
        email,
        phone,
        role,
        unit_id: unit_id || null,
        payment_type: tipoPagamento,
        daily_wage: valorDiaria || 0,
        base_commission_percent: comissaoPercentualServico || 0,
        lunch_value: valorAlmoco || 0,
        transport_value: valorPassagem || 0,
        fixed_service_commissions: comissoesServico || {},
      }).select().single();

      if (userError) {
        // Rollback auth user if DB insert fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return res.status(400).json({ error: userError.message });
      }

      res.json(newUser);
    } catch (err: any) {
      // Erro de validação Zod
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: err.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      logError('Error creating user', err, { email });
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/users/:id', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    if (req.user.role !== 'DONO') return res.status(403).json({ error: 'Acesso negado' });

    const { id } = req.params;

    try {
      // Validar input com Zod
      const validatedData = updateUserSchema.parse(req.body);
      const fields = validatedData;
      // Get the user to find their auth_id
      const { data: user } = await supabase.from('users').select('auth_id').eq('id', id).single();
      
      if (user?.auth_id && fields.password) {
        // Update password in Supabase Auth
        await supabase.auth.admin.updateUserById(user.auth_id, {
          password: fields.password
        });
      }

      const updateData: any = {};
      if (fields.name !== undefined)                    updateData.name                       = fields.name;
      if (fields.email !== undefined)                   updateData.email                      = fields.email;
      if (fields.phone !== undefined)                   updateData.phone                      = fields.phone;
      if (fields.unit_id !== undefined)                 updateData.unit_id                    = fields.unit_id;
      if (fields.role !== undefined)                    updateData.role                       = fields.role;
      if (fields.tipoPagamento !== undefined)           updateData.payment_type               = fields.tipoPagamento;
      if (fields.valorDiaria !== undefined)             updateData.daily_wage                 = fields.valorDiaria;
      if (fields.comissaoPercentualServico !== undefined) updateData.base_commission_percent  = fields.comissaoPercentualServico;
      if (fields.valorAlmoco !== undefined)             updateData.lunch_value                = fields.valorAlmoco;
      if (fields.valorPassagem !== undefined)           updateData.transport_value            = fields.valorPassagem;
      if (fields.comissoesServico !== undefined)        updateData.fixed_service_commissions  = fields.comissoesServico;

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      res.json(updatedUser);
    } catch (err: any) {
      // Erro de validação Zod
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: err.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    if (req.user.role !== 'DONO') return res.status(403).json({ error: 'Acesso negado' });

    const { id } = req.params;

    try {
      const { data: user } = await supabase.from('users').select('auth_id').eq('id', id).single();
      
      if (user?.auth_id) {
        await supabase.auth.admin.deleteUser(user.auth_id);
      }

      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/units', authenticateToken, async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data: units, error } = await supabase.from('units').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(units);
  });

  // ... (other routes would follow the same pattern)

  app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { unitId } = req.query;
    let query = supabase.from('appointments').select('*', { count: 'exact', head: true });
    let incomeQuery = supabase.from('transactions').select('amount', { count: 'exact' }).eq('type', 'INCOME');
    let totalIncomeQuery = supabase.from('transactions').select('amount', { count: 'exact' }).eq('type', 'INCOME');

    if (req.user.role === 'LAVADOR') {
      query = query.eq('unit_id', req.user.unit_id);
      incomeQuery = incomeQuery.eq('unit_id', req.user.unit_id);
      totalIncomeQuery = totalIncomeQuery.eq('unit_id', req.user.unit_id);
    } else if (unitId && unitId !== 'all') {
      query = query.eq('unit_id', unitId);
      incomeQuery = incomeQuery.eq('unit_id', unitId);
      totalIncomeQuery = totalIncomeQuery.eq('unit_id', unitId);
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { count: vehiclesToday } = await query.eq('date(start_time)', today);
    const { data: incomeTodayData } = await incomeQuery.eq('date(date)', today);
    const { data: totalIncomeData } = await totalIncomeQuery;
    
    res.json({
      vehiclesToday: vehiclesToday || 0,
      incomeToday: (incomeTodayData as any)?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0,
      totalIncome: (totalIncomeData as any)?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0,
    });
  });

  app.get('/api/appointments', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { unitId } = req.query;
    let query = supabase.from('appointments').select(`
      *,
      clients(name),
      vehicles(model, plate),
      services(name),
      units(name)
    `);

    if (req.user.role === 'LAVADOR') {
      query = query.eq('unit_id', req.user.unit_id);
    } else if (unitId && unitId !== 'all') {
      query = query.eq('unit_id', unitId);
    }

    const { data: appointments, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    
    res.json(appointments.map(a => ({
      ...a,
      client_name: a.clients?.name,
      vehicle_model: a.vehicles?.model,
      vehicle_plate: a.vehicles?.plate,
      service_name: a.services?.name,
      unit_name: a.units?.name
    })));
  });

  app.post('/api/check-in', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { clientName, phone, model, plate, color, serviceId, unitId } = req.body;
    
    // Find or create client
    let { data: client } = await supabase.from('clients').select('*').eq('phone', phone).single();
    if (!client) {
      const { data: newClient, error } = await supabase.from('clients').insert({ name: clientName, phone, unit_id: unitId }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      client = newClient;
    }

    // Find or create vehicle
    let { data: vehicle } = await supabase.from('vehicles').select('*').eq('plate', plate).single();
    if (!vehicle) {
      const { data: newVehicle, error } = await supabase.from('vehicles').insert({ client_id: client.id, model, plate, color }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      vehicle = newVehicle;
    }

    // Create appointment
    const { error } = await supabase.from('appointments').insert({
      client_id: client.id,
      vehicle_id: vehicle.id,
      service_id: serviceId,
      unit_id: unitId,
      vehicle_model: model,
      vehicle_plate: plate,
      vehicle_color: color,
      start_time: new Date().toISOString(),
      status: 'AGUARDANDO'
    });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  });

  app.get('/api/services', authenticateToken, async (req: any, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { unitId } = req.query;
    let query = supabase.from('services').select('*');
    if (unitId && unitId !== 'all') {
      query = query.eq('unit_id', unitId);
    }
    const { data: services, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(services);
  });

  // AI Vehicle Analysis Endpoint - APENAS PlateRecognizer
  app.post('/api/analyze-vehicle', authenticateToken, aiLimiter, async (req: any, res) => {
    const plateRecognizerKey = process.env.PLATE_RECOGNIZER_API_KEY;
    
    if (!plateRecognizerKey) {
      return res.status(500).json({ error: 'PlateRecognizer API não configurada' });
    }

    try {
      const { image } = req.body;

      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Imagem não fornecida' });
      }

      console.log('Starting vehicle analysis with PlateRecognizer for user:', req.user?.id);
      
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

      // Usar PlateRecognizer com https nativo e multipart/form-data
      try {
        console.log('Calling PlateRecognizer API...');
        
        // Criar boundary para multipart/form-data
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const base64Data = image.split(',')[1];
        
        // Construir corpo multipart/form-data
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="upload"\r\n\r\n`;
        body += `${base64Data}\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="regions"\r\n\r\n`;
        body += `br\r\n`;
        body += `--${boundary}--\r\n`;
        
        const prData: any = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.platerecognizer.com',
            port: 443,
            path: '/v1/plate-reader/',
            method: 'POST',
            headers: {
              'Authorization': `Token ${plateRecognizerKey}`,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': Buffer.byteLength(body)
            },
            timeout: 30000
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error('Invalid JSON response: ' + data));
              }
            });
          });

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          req.write(body);
          req.end();
        });

        console.log('PlateRecognizer response:', JSON.stringify(prData, null, 2));

        if (prData.error) {
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
      } catch (prError: any) {
        console.error('PlateRecognizer error:', prError);
        logError('PlateRecognizer API error', prError, { userId: req.user?.id });
        return res.status(500).json({ 
          error: 'Erro ao conectar com PlateRecognizer',
          details: prError.message 
        });
      }
      
      console.log('Final result:', result);
      res.json(result);
    } catch (err: any) {
      console.error('Vehicle analysis error:', err);
      logError('Vehicle analysis error', err, { userId: req.user?.id });
      res.status(500).json({ error: 'Erro ao processar imagem. Tente novamente.' });
    }
  });

  // Duplicate route removed - using PlateRecognizer implementation above

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
    } else {
      logger.info('Server started', { port: PORT });
    }
  });
}

startServer().catch(err => {
  logError('Failed to start server', err);
  process.exit(1);
});
