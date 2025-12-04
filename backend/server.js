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
const LOCAL_IP = '10.136.23.46';



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


// ADICIONE ESTA ROTA NO SEU server.js (após a rota de login)

// ROTA PARA BUSCAR DADOS COMPLETOS DO USUÁRIO (COM SENHA PARA EDIÇÃO)
app.get('/usuario/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  
  console.log('👤 Buscando dados do usuário:', usuarioId);
  
  const query = 'SELECT id, nome, email, senha, telefone FROM usuarios WHERE id = ?';
  
  req.dbConnection.query(query, [usuarioId], async (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do usuário'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = results[0];
    
    console.log('✅ Dados do usuário carregados com sucesso');
    
    // NOTA: Senha criptografada será enviada para permitir edição
    // O app mostrará como ••••••• até entrar em modo de edição
    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        senhaHash: user.senha, // Hash criptografado (não será exibido)
        telefone: user.telefone
      }
    });
  });
});

// ROTA PARA DESCRIPTOGRAFAR SENHA (apenas para edição)
app.post('/usuario/:usuarioId/descriptografar-senha', (req, res) => {
  const { usuarioId } = req.params;
  const { senhaHash } = req.body;
  
  console.log('🔓 Solicitação para ver senha para edição:', usuarioId);
  
  // Por questões de segurança, não podemos descriptografar bcrypt
  // Mas podemos retornar uma flag indicando que o usuário pode definir nova senha
  
  const query = 'SELECT senha FROM usuarios WHERE id = ?';
  
  req.dbConnection.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar senha:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar senha'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // IMPORTANTE: Bcrypt é one-way, não pode ser revertido
    // Retornamos uma mensagem para o usuário redefinir
    res.json({
      success: true,
      message: 'Por segurança, defina uma nova senha',
      canDecrypt: false
    });
  });
});

// ROTA PARA ATUALIZAR PERFIL DO USUÁRIO
app.put('/usuario/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { nome, email, senha, telefone } = req.body;
  
  console.log('✏️ Atualizando perfil do usuário:', usuarioId);
  
  try {
    // Verificar se email já existe em outro usuário
    const checkEmailQuery = 'SELECT id FROM usuarios WHERE email = ? AND id != ?';
    
    req.dbConnection.query(checkEmailQuery, [email, usuarioId], async (err, results) => {
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
          message: 'Este email já está em uso'
        });
      }
      
      // Preparar query de atualização
      let updateQuery;
      let params;
      
      if (senha && senha.trim() !== '') {
        // Se senha foi fornecida, criptografar e atualizar
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash(senha, 10);
        
        updateQuery = 'UPDATE usuarios SET nome = ?, email = ?, senha = ?, telefone = ? WHERE id = ?';
        params = [nome, email, senhaHash, telefone || null, usuarioId];
      } else {
        // Se senha não foi fornecida, não atualizar
        updateQuery = 'UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?';
        params = [nome, email, telefone || null, usuarioId];
      }
      
      req.dbConnection.query(updateQuery, params, (err, results) => {
        if (err) {
          console.error('❌ Erro ao atualizar perfil:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil'
          });
        }
        
        console.log('✅ Perfil atualizado com sucesso');
        
        res.json({
          success: true,
          message: 'Perfil atualizado com sucesso',
          user: {
            id: usuarioId,
            nome,
            email,
            telefone
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao processar atualização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
});
// ROTA PARA ATUALIZAR PERFIL DO USUÁRIO
app.put('/usuario/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { nome, email, senha, telefone } = req.body;
  
  console.log('✏️ Atualizando perfil do usuário:', usuarioId);
  
  try {
    // Verificar se email já existe em outro usuário
    const checkEmailQuery = 'SELECT id FROM usuarios WHERE email = ? AND id != ?';
    
    req.dbConnection.query(checkEmailQuery, [email, usuarioId], async (err, results) => {
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
          message: 'Este email já está em uso'
        });
      }
      
      // Preparar query de atualização
      let updateQuery;
      let params;
      
      if (senha && senha.trim() !== '') {
        // Se senha foi fornecida, criptografar e atualizar
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash(senha, 10);
        
        updateQuery = 'UPDATE usuarios SET nome = ?, email = ?, senha = ?, telefone = ? WHERE id = ?';
        params = [nome, email, senhaHash, telefone || null, usuarioId];
      } else {
        // Se senha não foi fornecida, não atualizar
        updateQuery = 'UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?';
        params = [nome, email, telefone || null, usuarioId];
      }
      
      req.dbConnection.query(updateQuery, params, (err, results) => {
        if (err) {
          console.error('❌ Erro ao atualizar perfil:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil'
          });
        }
        
        console.log('✅ Perfil atualizado com sucesso');
        
        res.json({
          success: true,
          message: 'Perfil atualizado com sucesso',
          user: {
            id: usuarioId,
            nome,
            email,
            telefone
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao processar atualização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
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

// ADICIONE ESTA ROTA ATUALIZADA NO SEU server.js
// Substitua a rota existente /pratica/dificuldade/:usuarioId

// 1️⃣ ROTA: BUSCAR MAIOR DIFICULDADE DO USUÁRIO - COM VERIFICAÇÃO DE DOMÍNIO
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
    
    // ⭐ VERIFICAR SE USUÁRIO TEM DADOS
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
    
    // ⭐ CALCULAR TAXA DE ERRO (COM THRESHOLD DE DOMÍNIO)
    const calcularErros = (total, acertos) => {
      if (total === 0) return 0;
      const percentualAcerto = (acertos / total) * 100;
      return 100 - percentualAcerto;
    };
    
    // Calcular erros de gramática
    const erros = {
      afirmativa: calcularErros(data.afirmativa_total, data.afirmativa_acertos),
      interrogativa: calcularErros(data.interrogativa_total, data.interrogativa_acertos),
      negativa: calcularErros(data.negativa_total, data.negativa_acertos)
    };
    
    // Calcular erros de habilidade (EXCLUINDO SPEAKING)
    const errosHabilidade = {
      reading: calcularErros(data.reading_total, data.reading_acertos),
      listening: calcularErros(data.listening_total, data.listening_acertos),
      writing: calcularErros(data.writing_total, data.writing_acertos)
    };
    
    // ⭐ VERIFICAR SE USUÁRIO DOMINA TUDO (>= 80% de acerto em tudo)
    const THRESHOLD_DOMINIO = 20; // Menos de 20% de erro = domínio
    
    const dominaGramatica = Object.values(erros).every(erro => erro < THRESHOLD_DOMINIO);
    const dominaHabilidades = Object.values(errosHabilidade).every(erro => erro < THRESHOLD_DOMINIO);
    
    if (dominaGramatica && dominaHabilidades) {
      console.log('🌟 Usuário domina todas as áreas!');
      return res.json({
        success: true,
        data: {
          nome: data.nome,
          temDados: true,
          dominaTudo: true,
          gramatica: null,
          habilidade: null,
          mensagem: 'Parabéns! Você já domina todas as áreas!'
        }
      });
    }
    
    // ⭐ ENCONTRAR MAIOR DIFICULDADE
    const maiorDificuldadeGramatica = Object.keys(erros).reduce((a, b) => 
      erros[a] > erros[b] ? a : b
    );
    
    const maiorDificuldadeHabilidade = Object.keys(errosHabilidade).reduce((a, b) => 
      errosHabilidade[a] > errosHabilidade[b] ? a : b
    );
    
    console.log('✅ Maior dificuldade identificada:', {
      gramatica: maiorDificuldadeGramatica,
      habilidade: maiorDificuldadeHabilidade,
      erroGramatica: Math.round(erros[maiorDificuldadeGramatica]),
      erroHabilidade: Math.round(errosHabilidade[maiorDificuldadeHabilidade])
    });
    
    res.json({
      success: true,
      data: {
        nome: data.nome,
        temDados: true,
        dominaTudo: false,
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
    
    
    // ==========================================
    // READING
    // ==========================================
    'reading-afirmativa': [
      { id: 1, texto: 'Loki _____ ready', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'is' },
      { id: 2, texto: 'You _____ sad', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'are' },
      { id: 3, texto: 'They _____ worry', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'are' },
      { id: 4, texto: 'We _____ vikings', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'are' },
      { id: 5, texto: 'Fyr _____ sad', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'is' }
    ],
    'reading-interrogativa': [
      { id: 1, texto: '_____ Loki ready?', pergunta: 'Complete a pergunta', opcoes: ['Is', 'Are', 'Am'], resposta: 'Is' },
      { id: 2, texto: '_____ you sad?', pergunta: 'Complete a pergunta', opcoes: ['Is', 'Are', 'Am'], resposta: 'Are' },
      { id: 3, texto: '_____ they worry?', pergunta: 'Complete a pergunta', opcoes: ['Is', 'Are', 'Am'], resposta: 'Are' },
      { id: 4, texto: '_____ we vikings?', pergunta: 'Complete a pergunta', opcoes: ['Is', 'Are', 'Am'], resposta: 'Are' },
      { id: 5, texto: '_____ Fyr sad?', pergunta: 'Complete a pergunta', opcoes: ['Is', 'Are', 'Am'], resposta: 'Is' }
    ],
    'reading-negativa': [
      { id: 1, texto: 'Loki _____ ready', pergunta: 'Complete com negativa', opcoes: ['is not', 'are not', 'am not'], resposta: 'is not' },
      { id: 2, texto: 'You _____ sad', pergunta: 'Complete com negativa', opcoes: ['is not', 'are not', 'am not'], resposta: 'are not' },
      { id: 3, texto: 'They _____ worry', pergunta: 'Complete com negativa', opcoes: ['is not', 'are not', 'am not'], resposta: 'are not' },
      { id: 4, texto: 'We _____ vikings', pergunta: 'Complete com negativa', opcoes: ['is not', 'are not', 'am not'], resposta: 'are not' },
      { id: 5, texto: 'Fyr _____ sad', pergunta: 'Complete com negativa', opcoes: ['is not', 'are not', 'am not'], resposta: 'is not' }
    ],


    // ==========================================
    // SPEAKING
    // ==========================================
    'speaking-afirmativa': [
      { id: 1, pergunta: 'Repita a frase', audio: 'Loki is ready', resposta: 'Loki is ready', tipo: 'speaking' },
      { id: 2, pergunta: 'Repita a frase', audio: 'You are sad', resposta: 'You are sad', tipo: 'speaking' },
      { id: 3, pergunta: 'Repita a frase', audio: 'They are worry', resposta: 'They are worry', tipo: 'speaking' },
      { id: 4, pergunta: 'Repita a frase', audio: 'We are vikings', resposta: 'We are vikings', tipo: 'speaking' },
      { id: 5, pergunta: 'Repita a frase', audio: 'Fyr is sad', resposta: 'Fyr is sad', tipo: 'speaking' }
    ],
    'speaking-interrogativa': [
      { id: 1, pergunta: 'Repita a frase', audio: 'Is Loki ready?', resposta: 'Is Loki ready?', tipo: 'speaking' },
      { id: 2, pergunta: 'Repita a frase', audio: 'Are you sad?', resposta: 'Are you sad?', tipo: 'speaking' },
      { id: 3, pergunta: 'Repita a frase', audio: 'Are they worry?', resposta: 'Are they worry?', tipo: 'speaking' },
      { id: 4, pergunta: 'Repita a frase', audio: 'Are we vikings?', resposta: 'Are we vikings?', tipo: 'speaking' },
      { id: 5, pergunta: 'Repita a frase', audio: 'Is Fyr sad?', resposta: 'Is Fyr sad?', tipo: 'speaking' }
    ],
    'speaking-negativa': [
      { id: 1, pergunta: 'Repita a frase', audio: 'Loki is not ready', resposta: 'Loki is not ready', tipo: 'speaking' },
      { id: 2, pergunta: 'Repita a frase', audio: 'You are not sad', resposta: 'You are not sad', tipo: 'speaking' },
      { id: 3, pergunta: 'Repita a frase', audio: 'They are not worry', resposta: 'They are not worry', tipo: 'speaking' },
      { id: 4, pergunta: 'Repita a frase', audio: 'We are not vikings', resposta: 'We are not vikings', tipo: 'speaking' },
      { id: 5, pergunta: 'Repita a frase', audio: 'Fyr is not sad', resposta: 'Fyr is not sad', tipo: 'speaking' }
    ],
    
    // ==========================================
    // LISTENING - CORRIGIDO COM BASE NAS IMAGENS
    // ==========================================
    'listening-afirmativa': [
      { id: 1, audio: 'Loki is ready', pergunta: 'Escute', opcoes: ['A) Loki is ready', 'B) Loki are ready', 'C) Loki am ready'], resposta: 'A) Loki is ready', tipo: 'listening' },
      { id: 2, audio: 'You are sad', pergunta: 'Escute', opcoes: ['A) You is sad', 'B) You are sad', 'C) You am sad'], resposta: 'B) You are sad', tipo: 'listening' },
      { id: 3, audio: 'They are worry', pergunta: 'Escute', opcoes: ['A) They are worry', 'B) Are you worry', 'C) We are worry'], resposta: 'A) They are worry', tipo: 'listening' },
      { id: 4, audio: 'They are vikings', pergunta: 'Escute', opcoes: ['A) They are vikings', 'B) He is viking', 'C) We are vikings'], resposta: 'A) They are vikings', tipo: 'listening' },
      { id: 5, audio: 'She is sad', pergunta: 'Escute', opcoes: ['A) She is sad', 'B) Fyr is happy', 'C) Fyr is sad'], resposta: 'A) She is sad', tipo: 'listening' }
    ],
    'listening-interrogativa': [
      { id: 1, audio: 'Is Loki ready?', pergunta: 'Escute', opcoes: ['A) Is Loki ready?', 'B) Are Loki ready?', 'C) Am I Loki ready?'], resposta: 'A) Is Loki ready?', tipo: 'listening' },
      { id: 2, audio: 'Are they sad?', pergunta: 'Escute', opcoes: ['A) Are they sad?', 'B) Are you sad?', 'C) Are I sad?'], resposta: 'A) Are they sad?', tipo: 'listening' },
      { id: 3, audio: 'Are they worry?', pergunta: 'Escute', opcoes: ['A) Are they worry?', 'B) Are you worry?', 'C) Are we worry?'], resposta: 'A) Are they worry?', tipo: 'listening' },
      { id: 4, audio: 'Are they vikings?', pergunta: 'Escute', opcoes: ['A) Are they vikings?', 'B) Is he viking?', 'C) Are we vikings?'], resposta: 'A) Are they vikings?', tipo: 'listening' },
      { id: 5, audio: 'Is she sad?', pergunta: 'Escute', opcoes: ['A) Is she sad?', 'B) Are they sad?', 'C) Am I sad?'], resposta: 'A) Is she sad?', tipo: 'listening' }
    ],
    'listening-negativa': [
      { id: 1, audio: 'Loki is not ready', pergunta: 'Escute', opcoes: ['A) Loki is not ready', 'B) Loki are not ready', 'C) Loki not am ready'], resposta: 'A) Loki is not ready', tipo: 'listening' },
      { id: 2, audio: 'You are not sad', pergunta: 'Escute', opcoes: ['A) You is not sad', 'B) You are not sad', 'C) You not sad'], resposta: 'B) You are not sad', tipo: 'listening' },
      { id: 3, audio: 'They are not worry', pergunta: 'Escute', opcoes: ['A) They are not worry', 'B) Are you not worry', 'C) We are not worry'], resposta: 'A) They are not worry', tipo: 'listening' },
      { id: 4, audio: 'They are not vikings', pergunta: 'Escute', opcoes: ['A) They are not vikings', 'B) He is not viking', 'C) We are not vikings'], resposta: 'A) They are not vikings', tipo: 'listening' },
      { id: 5, audio: 'She is not sad', pergunta: 'Escute', opcoes: ['A) She is not sad', 'B) Fyr is not happy', 'C) Fyr is not sad'], resposta: 'A) She is not sad', tipo: 'listening' }
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