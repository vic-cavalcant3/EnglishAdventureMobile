const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'englishadventure',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Configuração do Email (SUBSTITUA COM SUAS CREDENCIAIS)
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'seuemail@gmail.com', // SEU EMAIL
    pass: 'sua_senha_de_app'    // SENHA DE APP DO GOOGLE
  }
};

const app = express();
const PORT = 3000;

// SEU IP - use este no React Native
const LOCAL_IP = '192.168.0.189';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Pool de conexões
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Configurar transportador de email
const transporter = nodemailer.createTransport(emailConfig);

// Teste de conexão
pool.getConnection((err, connection) => {
  if (err) {
    console.error('ERRO: Não foi possível conectar ao banco de dados!');
    console.error('Detalhes:', err.message);
  } else {
    console.log('✅ Conexão com banco de dados estabelecida!');
    connection.release();
  }
});

// Middleware de conexão
app.use((req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao obter conexão:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro de conexão com o banco de dados'
      });
    }
    
    req.dbConnection = connection;
    res.on('finish', () => connection.release());
    next();
  });
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API English Adventure funcionando!',
    timestamp: new Date().toISOString()
  });
});

const bcrypt = require('bcrypt');

// ROTA DE LOGIN - COMPATÍVEL COM BCRYPT PHP
// ROTA DE LOGIN - COMPATÍVEL COM BCRYPT PHP ($2y$)
app.post('/login', (req, res) => {
  console.log('🔐 Tentativa de login recebida:', { email: req.body.email });
  
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }
  
  const query = 'SELECT id, nome, email, senha, telefone FROM usuarios WHERE email = ?';
  
  req.dbConnection.query(query, [email], (err, results) => {
    if (err) {
      console.error('❌ Erro no banco:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
    
    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email não encontrado'
      });
    }
    
    const user = results[0];
    
    // ✅ CONVERTER $2y$ (PHP) PARA $2a$ (Node.js) se necessário
    let hashToCompare = user.senha;
    if (hashToCompare.startsWith('$2y$')) {
      hashToCompare = '$2a$' + hashToCompare.substring(4);
    }
    
    console.log('🔍 Hash original:', user.senha.substring(0, 10) + '...');
    console.log('🔍 Hash convertido:', hashToCompare.substring(0, 10) + '...');
    
    // ✅ COMPARAR SENHA
    bcrypt.compare(senha, hashToCompare, (err, isMatch) => {
      if (err) {
        console.error('❌ Erro ao verificar senha:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar senha'
        });
      }
      
      if (isMatch) {
        console.log('✅ Login bem-sucedido para:', email);
        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            telefone: user.telefone
          }
        });
      } else {
        console.log('❌ Senha incorreta para:', email);
        res.status(401).json({
          success: false,
          message: 'Senha incorreta'
        });
      }
    });
  });
});

// ROTA DE CADASTRO
// ROTA DE CADASTRO - CRIPTOGRAFAR SENHA
app.post('/cadastro', async (req, res) => {
  console.log('📝 Tentativa de cadastro recebida:', req.body);
  
  const { nome, email, senha, telefone } = req.body;
  
  if (!nome || !email || !senha) {
    return res.status(400).json({
      success: false,
      message: 'Nome, email e senha são obrigatórios'
    });
  }
  
  // Verificar se email já existe
  const checkQuery = 'SELECT id FROM usuarios WHERE email = ?';
  
  req.dbConnection.query(checkQuery, [email], async (err, results) => {
    if (err) {
      console.error('❌ Erro ao verificar email:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar email'
      });
    }
    
    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }
    
    // ✅ CRIPTOGRAFAR SENHA ANTES DE SALVAR
    try {
      const senhaHash = await bcrypt.hash(senha, 10);
      
      // Inserir novo usuário com senha criptografada
      const insertQuery = 'INSERT INTO usuarios (nome, email, senha, telefone, data_cadastro) VALUES (?, ?, ?, ?, NOW())';
      
      req.dbConnection.query(insertQuery, [nome, email, senhaHash, telefone || null], (err, results) => {
        if (err) {
          console.error('❌ Erro ao cadastrar:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro ao criar conta'
          });
        }
        
        console.log('✅ Cadastro realizado com sucesso para:', email);
        res.json({
          success: true,
          message: 'Cadastro realizado com sucesso!',
          user: {
            id: results.insertId,
            nome: nome,
            email: email,
            telefone: telefone
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao criptografar senha:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar senha'
      });
    }
  });
});

// NOVA ROTA: SOLICITAR RECUPERAÇÃO DE SENHA
app.post('/esqueci-senha', (req, res) => {
  console.log('🔑 Solicitação de recuperação de senha:', req.body.email);
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email é obrigatório'
    });
  }
  
  // Verificar se email existe
  const checkQuery = 'SELECT id, nome, email FROM usuarios WHERE email = ?';
  
  req.dbConnection.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('❌ Erro ao verificar email:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar solicitação'
      });
    }
    
    if (results.length === 0) {
      // Por segurança, retornar sucesso mesmo se email não existe
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    }
    
    const user = results[0];
    
    // Gerar token de 6 dígitos
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    
    // Salvar token no banco
    const insertTokenQuery = 'INSERT INTO tokens_recuperacao (usuario_id, token, expiracao, usado) VALUES (?, ?, ?, 0)';
    
    req.dbConnection.query(insertTokenQuery, [user.id, token, expiracao], (err) => {
      if (err) {
        console.error('❌ Erro ao salvar token:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar solicitação'
        });
      }
      
      // Enviar email
      const mailOptions = {
        from: emailConfig.auth.user,
        to: email,
        subject: 'English Adventure - Recuperação de Senha',
        html: `
          <h2>Olá, ${user.nome}!</h2>
          <p>Você solicitou a recuperação de senha para sua conta no English Adventure.</p>
          <p>Seu código de verificação é:</p>
          <h1 style="background-color: #A67649; color: white; padding: 20px; text-align: center; letter-spacing: 5px;">${token}</h1>
          <p>Este código expira em 15 minutos.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
          <br>
          <p>Equipe English Adventure 🚢</p>
        `
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('❌ Erro ao enviar email:', error);
          return res.status(500).json({
            success: false,
            message: 'Erro ao enviar email'
          });
        }
        
        console.log('✅ Email de recuperação enviado para:', email);
        res.json({
          success: true,
          message: 'Código de verificação enviado para seu email'
        });
      });
    });
  });
});

// NOVA ROTA: VALIDAR TOKEN E RESETAR SENHA
app.post('/validar-token', (req, res) => {
  console.log('🔓 Validação de token:', req.body);
  
  const { email, token, novaSenha } = req.body;
  
  if (!email || !token || !novaSenha) {
    return res.status(400).json({
      success: false,
      message: 'Todos os campos são obrigatórios'
    });
  }
  
  // Buscar usuário e token
  const query = `
    SELECT u.id, u.nome, t.id as token_id, t.expiracao, t.usado
    FROM usuarios u
    INNER JOIN tokens_recuperacao t ON u.id = t.usuario_id
    WHERE u.email = ? AND t.token = ?
    ORDER BY t.id DESC
    LIMIT 1
  `;
  
  req.dbConnection.query(query, [email, token], (err, results) => {
    if (err) {
      console.error('❌ Erro ao validar token:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar solicitação'
      });
    }
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido'
      });
    }
    
    const tokenData = results[0];
    
    // Verificar se token já foi usado
    if (tokenData.usado) {
      return res.status(400).json({
        success: false,
        message: 'Código já foi utilizado'
      });
    }
    
    // Verificar se token expirou
    if (new Date() > new Date(tokenData.expiracao)) {
      return res.status(400).json({
        success: false,
        message: 'Código expirado'
      });
    }
    
    // Atualizar senha
    const updateSenhaQuery = 'UPDATE usuarios SET senha = ? WHERE id = ?';
    
    req.dbConnection.query(updateSenhaQuery, [novaSenha, tokenData.id], (err) => {
      if (err) {
        console.error('❌ Erro ao atualizar senha:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar senha'
        });
      }
      
      // Marcar token como usado
      const markTokenQuery = 'UPDATE tokens_recuperacao SET usado = 1 WHERE id = ?';
      
      req.dbConnection.query(markTokenQuery, [tokenData.token_id], (err) => {
        if (err) {
          console.error('❌ Erro ao marcar token:', err);
        }
        
        console.log('✅ Senha alterada com sucesso para:', email);
        res.json({
          success: true,
          message: 'Senha alterada com sucesso!'
        });
      });
    });
  });
});


// ROTA PARA BUSCAR DESEMPENHO COMPLETO DO USUÁRIO
// ROTA PARA BUSCAR DESEMPENHO COMPLETO DO USUÁRIO
app.get('/desempenho/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  
  console.log('📊 Buscando desempenho do usuário:', usuarioId);
  
  // Função para calcular estrelas por XP
  const calcularEstrelas = (xp, maxXP, limites) => {
    if (xp >= limites[2]) return 3;
    if (xp >= limites[1]) return 2;
    if (xp >= limites[0]) return 1;
    return 0;
  };
  
  // Query para buscar XP de todos os jogos
  const queryXP = `
    SELECT 
      COALESCE(xp1.total_xp, 0) as xp_learning,
      COALESCE(xp2.total_xp, 0) as xp_runas,
      COALESCE(xp3.total_xp, 0) as xp_floresta
    FROM usuarios u
    LEFT JOIN xp_jogo1 xp1 ON u.id = xp1.usuario_id
    LEFT JOIN xp_jogo2 xp2 ON u.id = xp2.usuario_id
    LEFT JOIN xp_jogo3 xp3 ON u.id = xp3.usuario_id
    WHERE u.id = ?
  `;
  
  // Query para buscar estrelas do Learning (tradicional)
  const queryEstrelas = `
    SELECT COALESCE(SUM(total_estrelas), 0) as total_estrelas
    FROM estrelas
    WHERE nomeAluno = (SELECT nome FROM usuarios WHERE id = ?)
  `;
  
  // Query para buscar últimas 10 atividades
  const queryUltimasAtividades = `
    SELECT acertou
    FROM progresso_detalhado
    WHERE usuario_id = ?
    ORDER BY dataRegistro DESC
    LIMIT 10
  `;
  
  // Query para buscar estatísticas por jogo
  const queryEstatisticasJogos = `
    SELECT 
      atividade,
      acertou,
      tipo_gramatica,
      tipo_habilidade
    FROM progresso_detalhado
    WHERE usuario_id = ?
    ORDER BY dataRegistro DESC
  `;
  
  // Executar todas as queries
  req.dbConnection.query(queryXP, [usuarioId], (err, xpData) => {
    if (err) {
      console.error('❌ Erro ao buscar XP:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar XP' });
    }
    
    req.dbConnection.query(queryEstrelas, [usuarioId], (err, estrelasData) => {
      if (err) {
        console.error('❌ Erro ao buscar estrelas:', err);
        return res.status(500).json({ success: false, message: 'Erro ao buscar estrelas' });
      }
      
      req.dbConnection.query(queryUltimasAtividades, [usuarioId], (err, ultimasAtividades) => {
        if (err) {
          console.error('❌ Erro ao buscar últimas atividades:', err);
          return res.status(500).json({ success: false, message: 'Erro ao buscar atividades' });
        }
        
        req.dbConnection.query(queryEstatisticasJogos, [usuarioId], (err, estatisticas) => {
          if (err) {
            console.error('❌ Erro ao buscar estatísticas:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
          }
          
          // Processar dados
          const xp = xpData.length > 0 ? xpData[0] : { xp_learning: 0, xp_runas: 0, xp_floresta: 0 };
          const xpTotal = xp.xp_learning + xp.xp_runas + xp.xp_floresta;
          const estrelasLearning = estrelasData.length > 0 ? estrelasData[0].total_estrelas : 0;
          
          // Calcular estrelas baseadas em XP (como no PHP)
          const estrelasRunas = calcularEstrelas(xp.xp_learning, 10, [2, 5, 8]);
          const estrelasFlorestа = calcularEstrelas(xp.xp_runas, 40, [8, 20, 32]);
          const estrelasEspelhos = calcularEstrelas(xp.xp_floresta, 50, [10, 25, 40]);
          
          // Calcular acertos nas últimas 10
          const acertosRecentes = ultimasAtividades.filter(a => a.acertou === 1).length;
          const totalRecentes = ultimasAtividades.length;
          
          // Separar estatísticas por jogo
          const jogo2Stats = estatisticas.filter(e => e.atividade.includes('jogo2'));
          const jogo3Stats = estatisticas.filter(e => e.atividade.includes('jogo3'));
          const jogo4Stats = estatisticas.filter(e => e.atividade.includes('jogo4'));
          
          const calcularStats = (dados) => {
            const total = dados.length;
            const acertos = dados.filter(d => d.acertou === 1).length;
            const erros = total - acertos;
            
            // Encontrar dificuldades (tipo de gramática com mais erros)
            const errosPorGramatica = {};
            dados.forEach(d => {
              if (d.acertou === 0 && d.tipo_gramatica) {
                errosPorGramatica[d.tipo_gramatica] = (errosPorGramatica[d.tipo_gramatica] || 0) + 1;
              }
            });
            
            const gramaticasComErro = Object.keys(errosPorGramatica);
            const maiorDificuldade = gramaticasComErro.length > 0
              ? gramaticasComErro.reduce((a, b) => 
                  errosPorGramatica[a] > errosPorGramatica[b] ? a : b
                )
              : null;
            
            return { total, acertos, erros, dificuldade: maiorDificuldade };
          };
          
          const stats2 = calcularStats(jogo2Stats);
          const stats3 = calcularStats(jogo3Stats);
          const stats4 = calcularStats(jogo4Stats);
          
          console.log('✅ Desempenho carregado com sucesso');
          
          res.json({
            success: true,
            data: {
              xp: {
                learning: xp.xp_learning,
                runas: xp.xp_runas,
                floresta: xp.xp_floresta,
                total: xpTotal,
                maximo: 100 // XP máximo esperado
              },
              ultimasQuestoes: {
                acertos: acertosRecentes,
                total: totalRecentes,
                percentual: totalRecentes > 0 ? Math.round((acertosRecentes / totalRecentes) * 100) : 0
              },
              jogos: [
                {
                  id: 1,
                  numero: '01',
                  titulo: 'Learning',
                  tipo: 'estrelas',
                  estrelas: Math.min(estrelasLearning, 3), // Máximo 3 estrelas
                  xp: 0,
                  totalAcertos: 0,
                  totalErros: 0,
                  dificuldades: null,
                  cor: '#194D6F'
                },
                {
                  id: 2,
                  numero: '02',
                  titulo: 'As runas da identidade',
                  tipo: 'xp',
                  estrelas: estrelasRunas,
                  xp: xp.xp_learning,
                  totalAcertos: stats2.acertos,
                  totalErros: stats2.erros,
                  dificuldades: stats2.dificuldade,
                  cor: '#682B10'
                },
                {
                  id: 3,
                  numero: '03',
                  titulo: 'A floresta escura',
                  tipo: 'xp',
                  estrelas: estrelasFlorestа,
                  xp: xp.xp_runas,
                  totalAcertos: stats3.acertos,
                  totalErros: stats3.erros,
                  dificuldades: stats3.dificuldade,
                  cor: '#8B2B28'
                },
                {
                  id: 4,
                  numero: '04',
                  titulo: 'Espelhos de Midgard',
                  tipo: 'xp',
                  estrelas: estrelasEspelhos,
                  xp: xp.xp_floresta,
                  totalAcertos: stats4.acertos,
                  totalErros: stats4.erros,
                  dificuldades: stats4.dificuldade,
                  cor: '#1D5529'
                }
              ]
            }
          });
        });
      });
    });
  });
});

// ADICIONE ESTA ROTA NO SEU server.js (depois da rota /desempenho)

// ROTA PARA BUSCAR ESTATÍSTICAS DE PRÁTICA
app.get('/estatisticas-pratica/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  
  console.log('📚 Buscando estatísticas de prática do usuário:', usuarioId);
  
  // Query para buscar dados do resumo_progresso
  const query = `
    SELECT 
      afirmativa_total, afirmativa_acertos,
      interrogativa_total, interrogativa_acertos,
      negativa_total, negativa_acertos,
      speaking_total, speaking_acertos,
      reading_total, reading_acertos,
      listening_total, listening_acertos,
      writing_total, writing_acertos,
      choice_total, choice_acertos
    FROM resumo_progresso
    WHERE usuario_id = ?
  `;
  
  req.dbConnection.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar estatísticas' 
      });
    }
    
    if (results.length === 0) {
      // Retornar dados zerados se usuário não tem registros
      return res.json({
        success: true,
        data: {
          gramatica: {
            afirmativa: { total: 0, acertos: 0, erros: 0 },
            interrogativa: { total: 0, acertos: 0, erros: 0 },
            negativa: { total: 0, acertos: 0, erros: 0 }
          },
          habilidades: {
            speaking: { total: 0, acertos: 0, erros: 0 },
            reading: { total: 0, acertos: 0, erros: 0 },
            listening: { total: 0, acertos: 0, erros: 0 },
            writing: { total: 0, acertos: 0, erros: 0 },
            choice: { total: 0, acertos: 0, erros: 0 }
          }
        }
      });
    }
    
    const data = results[0];
    
    // Organizar dados
    const stats = {
      gramatica: {
        afirmativa: {
          total: data.afirmativa_total,
          acertos: data.afirmativa_acertos,
          erros: data.afirmativa_total - data.afirmativa_acertos
        },
        interrogativa: {
          total: data.interrogativa_total,
          acertos: data.interrogativa_acertos,
          erros: data.interrogativa_total - data.interrogativa_acertos
        },
        negativa: {
          total: data.negativa_total,
          acertos: data.negativa_acertos,
          erros: data.negativa_total - data.negativa_acertos
        }
      },
      habilidades: {
        speaking: {
          total: data.speaking_total,
          acertos: data.speaking_acertos,
          erros: data.speaking_total - data.speaking_acertos
        },
        reading: {
          total: data.reading_total,
          acertos: data.reading_acertos,
          erros: data.reading_total - data.reading_acertos
        },
        listening: {
          total: data.listening_total,
          acertos: data.listening_acertos,
          erros: data.listening_total - data.listening_acertos
        },
        writing: {
          total: data.writing_total,
          acertos: data.writing_acertos,
          erros: data.writing_total - data.writing_acertos
        },
        choice: {
          total: data.choice_total,
          acertos: data.choice_acertos,
          erros: data.choice_total - data.choice_acertos
        }
      }
    };
    
    console.log('✅ Estatísticas carregadas com sucesso');
    
    res.json({
      success: true,
      data: stats
    });
  });
});

// ==========================================
// ROTAS DE PRÁTICA - ADICIONE NO server.js
// ==========================================

// 1️⃣ ROTA: BUSCAR MAIOR DIFICULDADE DO USUÁRIO
app.get('/pratica/dificuldade/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  
  console.log('🔍 Buscando maior dificuldade do usuário:', usuarioId);
  
  const query = `
    SELECT 
      u.nome,
      rp.afirmativa_total, rp.afirmativa_acertos,
      rp.interrogativa_total, rp.interrogativa_acertos,
      rp.negativa_total, rp.negativa_acertos,
      rp.speaking_total, rp.speaking_acertos,
      rp.reading_total, rp.reading_acertos,
      rp.listening_total, rp.listening_acertos,
      rp.writing_total, rp.writing_acertos
    FROM usuarios u
    LEFT JOIN resumo_progresso rp ON u.id = rp.usuario_id
    WHERE u.id = ?
  `;
  
  req.dbConnection.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar dificuldades:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar dificuldades' 
      });
    }
    
    if (results.length === 0 || !results[0].afirmativa_total) {
      return res.json({
        success: true,
        data: {
          nome: results[0]?.nome || 'Aluno',
          temDados: false,
          gramatica: 'afirmativa',
          habilidade: 'reading',
          mensagem: 'Continue jogando para identificarmos suas dificuldades!'
        }
      });
    }
    
    const data = results[0];
    
    // Calcular taxa de erro por gramática
    const calcularErros = (total, acertos) => {
      if (total === 0) return 0;
      return ((total - acertos) / total) * 100;
    };
    
    const erros = {
      afirmativa: calcularErros(data.afirmativa_total, data.afirmativa_acertos),
      interrogativa: calcularErros(data.interrogativa_total, data.interrogativa_acertos),
      negativa: calcularErros(data.negativa_total, data.negativa_acertos)
    };
    
    const errosHabilidade = {
      speaking: calcularErros(data.speaking_total, data.speaking_acertos),
      reading: calcularErros(data.reading_total, data.reading_acertos),
      listening: calcularErros(data.listening_total, data.listening_acertos),
      writing: calcularErros(data.writing_total, data.writing_acertos)
    };
    
    // Encontrar maior dificuldade
    const maiorDificuldadeGramatica = Object.keys(erros).reduce((a, b) => 
      erros[a] > erros[b] ? a : b
    );
    
    const maiorDificuldadeHabilidade = Object.keys(errosHabilidade).reduce((a, b) => 
      errosHabilidade[a] > errosHabilidade[b] ? a : b
    );
    
    console.log('✅ Maior dificuldade identificada:', {
      gramatica: maiorDificuldadeGramatica,
      habilidade: maiorDificuldadeHabilidade
    });
    
    res.json({
      success: true,
      data: {
        nome: data.nome,
        temDados: true,
        gramatica: maiorDificuldadeGramatica,
        habilidade: maiorDificuldadeHabilidade,
        percentualErroGramatica: Math.round(erros[maiorDificuldadeGramatica]),
        percentualErroHabilidade: Math.round(errosHabilidade[maiorDificuldadeHabilidade]),
        todasDificuldades: {
          gramatica: erros,
          habilidade: errosHabilidade
        }
      }
    });
  });
});


// 2️⃣ ROTA: GERAR QUESTÕES DE PRÁTICA
app.post('/pratica/gerar-questoes', (req, res) => {
  const { gramatica, habilidade } = req.body;
  
  console.log('📝 Gerando questões:', { gramatica, habilidade });
  
  // Banco de questões por tipo
  const questoes = {
    // SPEAKING + AFIRMATIVA
    'speaking-afirmativa': [
      { id: 1, pergunta: 'Repita: "I am a student"', resposta: 'I am a student', tipo: 'audio' },
      { id: 2, pergunta: 'Repita: "You are my friend"', resposta: 'You are my friend', tipo: 'audio' },
      { id: 3, pergunta: 'Repita: "She is happy"', resposta: 'She is happy', tipo: 'audio' },
      { id: 4, pergunta: 'Repita: "We are here"', resposta: 'We are here', tipo: 'audio' },
      { id: 5, pergunta: 'Repita: "They are teachers"', resposta: 'They are teachers', tipo: 'audio' }
    ],
    // SPEAKING + INTERROGATIVA
    'speaking-interrogativa': [
      { id: 1, pergunta: 'Repita: "Are you ready?"', resposta: 'Are you ready?', tipo: 'audio' },
      { id: 2, pergunta: 'Repita: "Is she your sister?"', resposta: 'Is she your sister?', tipo: 'audio' },
      { id: 3, pergunta: 'Repita: "Are we late?"', resposta: 'Are we late?', tipo: 'audio' },
      { id: 4, pergunta: 'Repita: "Is he a doctor?"', resposta: 'Is he a doctor?', tipo: 'audio' },
      { id: 5, pergunta: 'Repita: "Are they students?"', resposta: 'Are they students?', tipo: 'audio' }
    ],
    // SPEAKING + NEGATIVA
    'speaking-negativa': [
      { id: 1, pergunta: 'Repita: "I am not tired"', resposta: 'I am not tired', tipo: 'audio' },
      { id: 2, pergunta: 'Repita: "She is not here"', resposta: 'She is not here', tipo: 'audio' },
      { id: 3, pergunta: 'Repita: "We are not ready"', resposta: 'We are not ready', tipo: 'audio' },
      { id: 4, pergunta: 'Repita: "They are not late"', resposta: 'They are not late', tipo: 'audio' },
      { id: 5, pergunta: 'Repita: "He is not angry"', resposta: 'He is not angry', tipo: 'audio' }
    ],
    
    // READING + AFIRMATIVA
    'reading-afirmativa': [
      { id: 1, texto: 'I am happy', pergunta: 'Como você está?', opcoes: ['Happy', 'Sad', 'Angry'], resposta: 'Happy' },
      { id: 2, texto: 'She is a teacher', pergunta: 'Qual é a profissão dela?', opcoes: ['Teacher', 'Student', 'Doctor'], resposta: 'Teacher' },
      { id: 3, texto: 'We are friends', pergunta: 'Qual é a relação?', opcoes: ['Friends', 'Family', 'Strangers'], resposta: 'Friends' },
      { id: 4, texto: 'He is tall', pergunta: 'Como ele é?', opcoes: ['Tall', 'Short', 'Medium'], resposta: 'Tall' },
      { id: 5, texto: 'They are students', pergunta: 'O que eles são?', opcoes: ['Students', 'Teachers', 'Workers'], resposta: 'Students' }
    ],
    // READING + INTERROGATIVA
    'reading-interrogativa': [
      { id: 1, texto: 'Are you okay?', pergunta: 'O que está sendo perguntado?', opcoes: ['Se está bem', 'Se está cansado', 'Se está feliz'], resposta: 'Se está bem' },
      { id: 2, texto: 'Is she your sister?', pergunta: 'O que está sendo perguntado?', opcoes: ['Se é irmã', 'Se é mãe', 'Se é amiga'], resposta: 'Se é irmã' },
      { id: 3, texto: 'Are they at home?', pergunta: 'Onde estão?', opcoes: ['Em casa', 'Na escola', 'No trabalho'], resposta: 'Em casa' },
      { id: 4, texto: 'Is he a doctor?', pergunta: 'Qual profissão?', opcoes: ['Doctor', 'Teacher', 'Engineer'], resposta: 'Doctor' },
      { id: 5, texto: 'Are we late?', pergunta: 'O que está sendo perguntado?', opcoes: ['Se estão atrasados', 'Se estão prontos', 'Se estão felizes'], resposta: 'Se estão atrasados' }
    ],
    // READING + NEGATIVA
    'reading-negativa': [
      { id: 1, texto: 'I am not sad', pergunta: 'Como você NÃO está?', opcoes: ['Sad', 'Happy', 'Angry'], resposta: 'Sad' },
      { id: 2, texto: 'She is not here', pergunta: 'Onde ela NÃO está?', opcoes: ['Here', 'There', 'Home'], resposta: 'Here' },
      { id: 3, texto: 'We are not ready', pergunta: 'Como NÃO estão?', opcoes: ['Ready', 'Tired', 'Happy'], resposta: 'Ready' },
      { id: 4, texto: 'They are not students', pergunta: 'O que NÃO são?', opcoes: ['Students', 'Teachers', 'Workers'], resposta: 'Students' },
      { id: 5, texto: 'He is not angry', pergunta: 'Como ele NÃO está?', opcoes: ['Angry', 'Happy', 'Sad'], resposta: 'Angry' }
    ],
    
    // LISTENING + AFIRMATIVA
    'listening-afirmativa': [
      { id: 1, audio: 'I am happy', pergunta: 'O que você ouviu?', opcoes: ['I am happy', 'I am sad', 'I am tired'], resposta: 'I am happy' },
      { id: 2, audio: 'She is beautiful', pergunta: 'O que você ouviu?', opcoes: ['She is beautiful', 'She is ugly', 'She is tall'], resposta: 'She is beautiful' },
      { id: 3, audio: 'We are ready', pergunta: 'O que você ouviu?', opcoes: ['We are ready', 'We are tired', 'We are late'], resposta: 'We are ready' },
      { id: 4, audio: 'He is strong', pergunta: 'O que você ouviu?', opcoes: ['He is strong', 'He is weak', 'He is tall'], resposta: 'He is strong' },
      { id: 5, audio: 'They are happy', pergunta: 'O que você ouviu?', opcoes: ['They are happy', 'They are sad', 'They are angry'], resposta: 'They are happy' }
    ],
    // LISTENING + INTERROGATIVA
    'listening-interrogativa': [
      { id: 1, audio: 'Are you okay?', pergunta: 'O que você ouviu?', opcoes: ['Are you okay?', 'Are you ready?', 'Are you happy?'], resposta: 'Are you okay?' },
      { id: 2, audio: 'Is she your friend?', pergunta: 'O que você ouviu?', opcoes: ['Is she your friend?', 'Is she your sister?', 'Is she your mother?'], resposta: 'Is she your friend?' },
      { id: 3, audio: 'Are we late?', pergunta: 'O que você ouviu?', opcoes: ['Are we late?', 'Are we ready?', 'Are we tired?'], resposta: 'Are we late?' },
      { id: 4, audio: 'Is he a teacher?', pergunta: 'O que você ouviu?', opcoes: ['Is he a teacher?', 'Is he a doctor?', 'Is he a student?'], resposta: 'Is he a teacher?' },
      { id: 5, audio: 'Are they students?', pergunta: 'O que você ouviu?', opcoes: ['Are they students?', 'Are they teachers?', 'Are they doctors?'], resposta: 'Are they students?' }
    ],
    // LISTENING + NEGATIVA
    'listening-negativa': [
      { id: 1, audio: 'I am not tired', pergunta: 'O que você ouviu?', opcoes: ['I am not tired', 'I am not happy', 'I am not sad'], resposta: 'I am not tired' },
      { id: 2, audio: 'She is not here', pergunta: 'O que você ouviu?', opcoes: ['She is not here', 'She is not there', 'She is not ready'], resposta: 'She is not here' },
      { id: 3, audio: 'We are not late', pergunta: 'O que você ouviu?', opcoes: ['We are not late', 'We are not ready', 'We are not tired'], resposta: 'We are not late' },
      { id: 4, audio: 'They are not students', pergunta: 'O que você ouviu?', opcoes: ['They are not students', 'They are not teachers', 'They are not doctors'], resposta: 'They are not students' },
      { id: 5, audio: 'He is not angry', pergunta: 'O que você ouviu?', opcoes: ['He is not angry', 'He is not happy', 'He is not sad'], resposta: 'He is not angry' }
    ],
    
    // WRITING + AFIRMATIVA
    'writing-afirmativa': [
      { id: 1, pergunta: 'Complete: I ___ happy', resposta: 'am', dica: 'Use o verbo TO BE' },
      { id: 2, pergunta: 'Complete: She ___ a teacher', resposta: 'is', dica: 'Use o verbo TO BE' },
      { id: 3, pergunta: 'Complete: We ___ friends', resposta: 'are', dica: 'Use o verbo TO BE' },
      { id: 4, pergunta: 'Complete: He ___ tall', resposta: 'is', dica: 'Use o verbo TO BE' },
      { id: 5, pergunta: 'Complete: They ___ students', resposta: 'are', dica: 'Use o verbo TO BE' }
    ],
    // WRITING + INTERROGATIVA
    'writing-interrogativa': [
      { id: 1, pergunta: 'Complete: ___ you okay?', resposta: 'Are', dica: 'Comece com o verbo TO BE' },
      { id: 2, pergunta: 'Complete: ___ she your sister?', resposta: 'Is', dica: 'Comece com o verbo TO BE' },
      { id: 3, pergunta: 'Complete: ___ we late?', resposta: 'Are', dica: 'Comece com o verbo TO BE' },
      { id: 4, pergunta: 'Complete: ___ he a doctor?', resposta: 'Is', dica: 'Comece com o verbo TO BE' },
      { id: 5, pergunta: 'Complete: ___ they students?', resposta: 'Are', dica: 'Comece com o verbo TO BE' }
    ],
    // WRITING + NEGATIVA
    'writing-negativa': [
      { id: 1, pergunta: 'Complete: I ___ not tired', resposta: 'am', dica: 'Use o verbo TO BE' },
      { id: 2, pergunta: 'Complete: She ___ not here', resposta: 'is', dica: 'Use o verbo TO BE' },
      { id: 3, pergunta: 'Complete: We ___ not ready', resposta: 'are', dica: 'Use o verbo TO BE' },
      { id: 4, pergunta: 'Complete: They ___ not students', resposta: 'are', dica: 'Use o verbo TO BE' },
      { id: 5, pergunta: 'Complete: He ___ not angry', resposta: 'is', dica: 'Use o verbo TO BE' }
    ]
  };
  
  const chave = `${habilidade}-${gramatica}`;
  const questoesDisponiveis = questoes[chave] || [];
  
  // Embaralhar e pegar 5 questões
  const questoesSelecionadas = questoesDisponiveis
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
  
  console.log(`✅ ${questoesSelecionadas.length} questões geradas`);
  
  res.json({
    success: true,
    data: {
      gramatica,
      habilidade,
      totalQuestoes: questoesSelecionadas.length,
      questoes: questoesSelecionadas
    }
  });
});


// 3️⃣ ROTA: SALVAR RESULTADO DA PRÁTICA
app.post('/pratica/salvar-resultado', (req, res) => {
  const { 
    usuarioId, 
    nomeAluno, 
    gramatica, 
    habilidade, 
    acertou, 
    tentativas = 1 
  } = req.body;
  
  console.log('💾 Salvando resultado da prática:', {
    usuarioId,
    gramatica,
    habilidade,
    acertou
  });
  
  // Inserir no histórico de prática
  const insertQuery = `
    INSERT INTO pratica_historico 
    (usuario_id, nomeAluno, tipo_gramatica, tipo_habilidade, acertou, tentativas, data_pratica)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  
  req.dbConnection.query(
    insertQuery, 
    [usuarioId, nomeAluno, gramatica, habilidade, acertou ? 1 : 0, tentativas],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao salvar prática:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao salvar resultado' 
        });
      }
      
      // Atualizar resumo_progresso
      const updateQuery = `
        INSERT INTO resumo_progresso 
        (usuario_id, nomeAluno, 
         ${gramatica}_total, ${gramatica}_acertos,
         ${habilidade}_total, ${habilidade}_acertos)
        VALUES (?, ?, 1, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          ${gramatica}_total = ${gramatica}_total + 1,
          ${gramatica}_acertos = ${gramatica}_acertos + ?,
          ${habilidade}_total = ${habilidade}_total + 1,
          ${habilidade}_acertos = ${habilidade}_acertos + ?
      `;
      
      const acertouValue = acertou ? 1 : 0;
      
      req.dbConnection.query(
        updateQuery,
        [usuarioId, nomeAluno, acertouValue, acertouValue, acertouValue, acertouValue],
        (err2) => {
          if (err2) {
            console.error('❌ Erro ao atualizar resumo:', err2);
          }
          
          console.log('✅ Resultado salvo com sucesso!');
          
          res.json({
            success: true,
            message: 'Resultado salvo com sucesso',
            praticaId: result.insertId
          });
        }
      );
    }
  );
});


// 4️⃣ ROTA: ESTATÍSTICAS DE EVOLUÇÃO NA PRÁTICA
app.get('/pratica/evolucao/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  const { dias = 7 } = req.query; // Últimos 7 dias por padrão
  
  console.log(`📈 Buscando evolução de prática (${dias} dias):`, usuarioId);
  
  const query = `
    SELECT 
      DATE(data_pratica) as data,
      tipo_gramatica,
      tipo_habilidade,
      COUNT(*) as total,
      SUM(acertou) as acertos
    FROM pratica_historico
    WHERE usuario_id = ?
      AND data_pratica >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(data_pratica), tipo_gramatica, tipo_habilidade
    ORDER BY data DESC
  `;
  
  req.dbConnection.query(query, [usuarioId, dias], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar evolução:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar evolução' 
      });
    }
    
    console.log(`✅ ${results.length} registros de evolução encontrados`);
    
    res.json({
      success: true,
      data: {
        periodo: `Últimos ${dias} dias`,
        registros: results
      }
    });
  });
});

// Rota para verificar status
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    message: 'Servidor funcionando',
    ip: LOCAL_IP,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Rota não encontrada' 
  });
});




// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 SERVIDOR ENGLISH ADVENTURE INICIADO!');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Rede: http://${LOCAL_IP}:${PORT}`);
  console.log('');
  console.log('📋 ENDPOINTS:');
  console.log(`• 🔐 Login: http://${LOCAL_IP}:${PORT}/login`);
  console.log(`• 📝 Cadastro: http://${LOCAL_IP}:${PORT}/cadastro`);
  console.log(`• 🔑 Esqueci Senha: http://${LOCAL_IP}:${PORT}/esqueci-senha`);
  console.log(`• 🔓 Validar Token: http://${LOCAL_IP}:${PORT}/validar-token`);
  console.log(`• 📊 Status: http://${LOCAL_IP}:${PORT}/status`);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Erro não tratado:', error);
});