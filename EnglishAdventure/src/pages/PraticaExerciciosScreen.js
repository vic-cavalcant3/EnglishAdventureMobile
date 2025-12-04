import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Linking
} from 'react-native';
import * as Speech from 'expo-speech';

// ⚠️ Voice só funciona em APK compilado, não no Expo Go
let Voice = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  console.log('Voice não disponível no Expo Go');
}

const API_URL = 'http://10.136.23.46:3000';

// ⭐ MODO APK - Coloque true quando gerar o APK
const MODO_APK = false; 

export default function PraticaExerciciosScreen({ route, navigation }) {
  const { userId, userName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [tipoAtual, setTipoAtual] = useState({ gramatica: 'afirmativa', habilidade: 'reading' });
  const [tocandoAudio, setTocandoAudio] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [textoFalado, setTextoFalado] = useState('');

  // ⭐ QUESTÕES FAKE PARA TESTE (Expo Go)
  const questoesTeste = {
    speaking: [
      { id: 1, pergunta: 'Repita a frase', audio: 'Loki is ready', resposta: 'Loki is ready', tipo: 'speaking' }
    ],
    reading: [
      { id: 1, texto: 'Loki _____ ready', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'is' },
      { id: 2, texto: 'You _____ sad', pergunta: 'Complete a frase', opcoes: ['is', 'are', 'am'], resposta: 'are' }
    ],
    listening: [
      { id: 1, audio: 'Loki is ready', pergunta: 'Escute', opcoes: ['A) Loki is ready', 'B) Loki are ready', 'C) Loki am ready'], resposta: 'A) Loki is ready', tipo: 'listening' }
    ]
  };

  // INICIALIZAÇÃO
  useEffect(() => {
    let mounted = true;
    
    const inicializar = async () => {
      // Modo teste (Expo Go)
      if (!MODO_APK || !Voice) {
        console.log('🧪 MODO TESTE ATIVADO - Sem áudio');
        setQuestoes(questoesTeste.reading);
        setTipoAtual({ gramatica: 'afirmativa', habilidade: 'reading' });
        setLoading(false);
        return;
      }
      
      // Modo APK (Produção)
      try {
        await configurarVoice();
        if (mounted) {
          await testarConexaoEIniciar();
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLoading(false);
      }
    };
    
    inicializar();
    
    return () => {
      mounted = false;
      Speech.stop();
      
      if (MODO_APK && Voice) {
        Voice.destroy().then(() => {
          Voice.removeAllListeners();
        }).catch(() => {
          console.log('Voice já estava limpo');
        });
      }
    };
  }, []);

  // ⭐ CONFIGURAR VOICE (Reconhecimento de fala)
  const configurarVoice = async () => {
    if (!Voice) {
      console.log('Voice não disponível');
      return;
    }

    try {
      console.log('🎤 Configurando Voice...');
      
      try {
        await Voice.destroy();
      } catch (e) {
        console.log('Voice já estava limpo');
      }
      
      Voice.removeAllListeners();
      
      Voice.onSpeechStart = () => {
        console.log('🎤 Gravação iniciada');
        setGravando(true);
      };
      
      Voice.onSpeechEnd = () => {
        console.log('🎤 Gravação finalizada');
        setGravando(false);
      };
      
      Voice.onSpeechResults = (e) => {
        console.log('📝 Resultado:', e.value);
        if (e.value && e.value.length > 0) {
          const textoReconhecido = e.value[0];
          setTextoFalado(textoReconhecido);
          verificarRespostaFalada(textoReconhecido);
        }
      };
      
      Voice.onSpeechError = (e) => {
        console.error('❌ Erro no reconhecimento:', e.error);
        setGravando(false);
        
        if (e.error?.code === '1' || e.error?.code === 'recognition_fail') {
          Alert.alert('Atenção', 'Não detectei nenhuma fala. Tente falar mais alto e claro.');
        } else if (e.error?.code === '2' || e.error?.message?.includes('Network')) {
          Alert.alert('Erro', 'Sem conexão. Verifique sua internet.');
        } else {
          Alert.alert('Erro', 'Não foi possível reconhecer a fala. Tente novamente.');
        }
      };
      
      if (Platform.OS === 'ios') {
        try {
          const permission = await Voice.requestSpeechRecognitionPermission();
          console.log('🎤 Permissão iOS:', permission);
        } catch (permError) {
          console.error('Erro ao solicitar permissão:', permError);
        }
      }
      
      console.log('✅ Voice configurado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao configurar Voice:', error);
      Alert.alert('Aviso', 'O reconhecimento de voz pode não funcionar corretamente.');
    }
  };

  // ⭐ REPRODUZIR ÁUDIO (Text-to-Speech)
  const reproduzirAudio = async (texto) => {
    if (!MODO_APK) {
      Alert.alert('🔊 Áudio', `No APK, você escutaria:\n"${texto}"`);
      return;
    }

    if (tocandoAudio) {
      Speech.stop();
      setTocandoAudio(false);
      return;
    }

    setTocandoAudio(true);
    
    try {
      await Speech.speak(texto, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onDone: () => setTocandoAudio(false),
        onStopped: () => setTocandoAudio(false),
        onError: () => {
          setTocandoAudio(false);
          Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
        }
      });
    } catch (error) {
      setTocandoAudio(false);
      Alert.alert('Erro', 'Erro ao reproduzir áudio');
    }
  };

  // ⭐ INICIAR GRAVAÇÃO (Speech-to-Text)
  const iniciarGravacao = async () => {
    if (!MODO_APK || !Voice) {
      Alert.alert(
        '🎤 Modo Teste',
        'No APK real, aqui você gravaria sua voz!\n\nQuer simular?',
        [
          {
            text: 'Simular Acerto',
            onPress: () => {
              const questao = questoes[questaoAtual];
              setTextoFalado(questao.resposta);
              verificarRespostaFalada(questao.resposta);
            }
          },
          {
            text: 'Simular Erro',
            onPress: () => {
              setTextoFalado('Texto errado simulado');
              verificarRespostaFalada('Texto errado simulado');
            }
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }
    
    try {
      console.log('🎤 Iniciando gravação...');
      
      const isRecognizing = await Voice.isRecognizing();
      
      if (isRecognizing) {
        console.log('Parando gravação anterior...');
        await Voice.stop();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setTextoFalado('');
      
      await Voice.start('en-US', {
        RECOGNIZER_ENGINE: 'GOOGLE',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_LANGUAGE_PREFERENCE: 'en-US',
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
      });
      
      console.log('✅ Voice.start executado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      setGravando(false);
      
      let mensagem = 'Não foi possível iniciar a gravação.';
      
      if (error.message?.includes('permission')) {
        mensagem = 'Permissão de microfone necessária. Verifique as configurações do app.';
        
        Alert.alert('Permissão Necessária', mensagem, [
          {
            text: 'Abrir Configurações',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          },
          { text: 'Cancelar', style: 'cancel' }
        ]);
      } else {
        Alert.alert('Erro', `${mensagem}\n\n${error.message}`);
      }
    }
  };

  // ⭐ VERIFICAR RESPOSTA FALADA (Speaking)
  const verificarRespostaFalada = async (textoReconhecido) => {
    const questao = questoes[questaoAtual];
    
    const respostaNormalizada = textoReconhecido.trim().toLowerCase().replace(/[.,!?]/g, '');
    const respostaCorretaNormalizada = questao.resposta.trim().toLowerCase().replace(/[.,!?]/g, '');
    
    const palavrasUsuario = respostaNormalizada.split(' ');
    const palavrasCorretas = respostaCorretaNormalizada.split(' ');
    
    let acertos = 0;
    palavrasCorretas.forEach(palavra => {
      if (palavrasUsuario.includes(palavra)) {
        acertos++;
      }
    });
    
    const percentualAcerto = (acertos / palavrasCorretas.length) * 100;
    const acertou = percentualAcerto >= 70;
    
    console.log('📊 Análise:', {
      falou: respostaNormalizada,
      correto: respostaCorretaNormalizada,
      acerto: percentualAcerto
    });
    
    if (MODO_APK) {
      await salvarResultado(acertou);
    }
    
    const novosResultados = [...resultados, { questaoId: questao.id, acertou }];
    setResultados(novosResultados);
    
    Alert.alert(
      acertou ? '✅ Correto!' : '❌ Quase lá!',
      acertou 
        ? `Você disse: "${textoReconhecido}"\n\nPerfeito!` 
        : `Você disse: "${textoReconhecido}"\n\nTente: "${questao.resposta}"`,
      [
        {
          text: acertou ? 'Próxima' : 'Tentar Novamente',
          onPress: () => {
            if (acertou) {
              if (questaoAtual + 1 < questoes.length) {
                setQuestaoAtual(questaoAtual + 1);
                setTextoFalado('');
              } else {
                finalizarPratica(novosResultados);
              }
            } else {
              setTextoFalado('');
            }
          }
        }
      ]
    );
  };

  // ⭐ TROCAR TIPO DE QUESTÃO (Modo Teste)
  const trocarTipoQuestao = (novoTipo) => {
    if (!MODO_APK && novoTipo === 'speaking') {
      Alert.alert(
        '🧪 Speaking Desativado',
        'No Expo Go, o speaking não funciona.\n\nPara testar, crie um APK.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setQuestoes(questoesTeste[novoTipo] || []);
    setTipoAtual({ ...tipoAtual, habilidade: novoTipo });
    setQuestaoAtual(0);
    setResultados([]);
    setTextoFalado('');
    Alert.alert('✅', `Visualizando: ${novoTipo.toUpperCase()}`);
  };

  const testarConexaoEIniciar = async () => {
    try {
      console.log('🔍 Testando conexão:', API_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const testeResponse = await fetch(`${API_URL}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!testeResponse.ok) {
        throw new Error(`Servidor respondeu com status ${testeResponse.status}`);
      }
      
      await iniciarPratica();
      
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      
      Alert.alert(
        '❌ Erro de Conexão',
        'Não foi possível conectar ao servidor.',
        [
          { text: 'Tentar Novamente', onPress: () => testarConexaoEIniciar() },
          { text: 'Voltar', onPress: () => navigation.goBack(), style: 'cancel' }
        ]
      );
      
      setLoading(false);
    }
  };

  const iniciarPratica = async () => {
    try {
      console.log('📝 Buscando dificuldades:', userId);
      
      const diffResponse = await fetch(`${API_URL}/pratica/dificuldade/${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!diffResponse.ok) {
        throw new Error(`HTTP ${diffResponse.status}`);
      }
      
      const diffData = await diffResponse.json();
      console.log('✅ Dificuldade:', diffData);
      
      if (!diffData.success) {
        throw new Error(diffData.message || 'Erro ao buscar dificuldades');
      }
      
      const { gramatica, habilidade, temDados, dominaTudo } = diffData.data;
      
      if (!temDados) {
        setLoading(false);
        Alert.alert(
          '📚 Continue jogando!',
          'Precisamos de mais dados para identificar suas dificuldades.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (dominaTudo) {
        setLoading(false);
        setQuestoes([]);
        return;
      }
      
      console.log('📝 Gerando questões:', { gramatica, habilidade });
      
      const questoesResponse = await fetch(`${API_URL}/pratica/gerar-questoes`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gramatica, habilidade })
      });
      
      if (!questoesResponse.ok) {
        throw new Error(`HTTP ${questoesResponse.status}`);
      }
      
      const questoesData = await questoesResponse.json();
      console.log('✅ Questões:', questoesData);
      
      if (questoesData.success && questoesData.data.questoes.length > 0) {
        setQuestoes(questoesData.data.questoes);
        setTipoAtual({ gramatica, habilidade });
        setLoading(false);
        
        Alert.alert(
          '🎯 Vamos praticar!',
          `Tipo: ${gramatica.toUpperCase()} + ${habilidade.toUpperCase()}\n\n${questoesData.data.totalQuestoes} questões!`,
          [{ text: 'Começar!' }]
        );
      } else {
        setLoading(false);
        setQuestoes([]);
      }
      
    } catch (error) {
      console.error('❌ Erro:', error);
      setLoading(false);
      
      Alert.alert(
        'Erro',
        `Não foi possível carregar questões.\n\n${error.message}`,
        [
          { text: 'Tentar Novamente', onPress: () => testarConexaoEIniciar() },
          { text: 'Voltar', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const salvarResultado = async (acertou) => {
    try {
      await fetch(`${API_URL}/pratica/salvar-resultado`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: userId,
          nomeAluno: userName,
          gramatica: tipoAtual.gramatica,
          habilidade: tipoAtual.habilidade,
          acertou,
          tentativas: 1
        })
      });
      console.log('✅ Resultado salvo');
    } catch (error) {
      console.error('⚠️ Erro ao salvar:', error);
    }
  };

  const verificarResposta = async (respostaUsuario) => {
    const questao = questoes[questaoAtual];
    
    const respostaNormalizada = respostaUsuario.trim().toLowerCase();
    const respostaCorretaNormalizada = questao.resposta.trim().toLowerCase();
    
    const acertou = respostaNormalizada === respostaCorretaNormalizada;
    
    if (MODO_APK) {
      await salvarResultado(acertou);
    }
    
    const novosResultados = [...resultados, { questaoId: questao.id, acertou }];
    setResultados(novosResultados);
    
    Alert.alert(
      acertou ? '✅ Correto!' : '❌ Ops!',
      acertou ? 'Continue assim!' : `A resposta correta era:\n${questao.resposta}`,
      [
        {
          text: 'Próxima',
          onPress: () => {
            if (questaoAtual + 1 < questoes.length) {
              setQuestaoAtual(questaoAtual + 1);
            } else {
              finalizarPratica(novosResultados);
            }
          }
        }
      ]
    );
  };

  const finalizarPratica = (resultadosFinais) => {
    const acertos = resultadosFinais.filter(r => r.acertou).length;
    const total = resultadosFinais.length;
    const percentual = Math.round((acertos / total) * 100);
    
    let emoji = '🎉';
    let mensagem = '';
    
    if (percentual >= 80) {
      emoji = '🌟';
      mensagem = 'Excelente trabalho!';
    } else if (percentual >= 60) {
      emoji = '💪';
      mensagem = 'Bom trabalho! Continue praticando!';
    } else {
      emoji = '📚';
      mensagem = 'Continue se esforçando!';
    }
    
    Alert.alert(
      `${emoji} Prática Concluída!`,
      `${mensagem}\n\nVocê acertou ${acertos} de ${total} questões (${percentual}%)`,
      [{ text: 'Voltar', onPress: () => navigation.goBack() }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Preparando exercícios...</Text>
      </View>
    );
  }

  if (questoes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🌟</Text>
          <Text style={styles.errorTitle}>Parabéns!</Text>
          <Text style={styles.errorText}>
            Você já domina todas as áreas!
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const questao = questoes[questaoAtual];
  const isSpeaking = tipoAtual.habilidade === 'speaking';
  const isListening = tipoAtual.habilidade === 'listening';
  const isReading = tipoAtual.habilidade === 'reading';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Speech.stop();
          if (MODO_APK && Voice) {
            Voice.stop().catch(() => {});
          }
          navigation.goBack();
        }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ BOTÕES DE TESTE (Apenas se MODO_APK = false) */}
      {!MODO_APK && (
        <View style={styles.testButtonsContainer}>
          <Text style={styles.testModeLabel}>🧪 MODO TESTE</Text>
          <View style={styles.testButtons}>
            <TouchableOpacity 
              style={[styles.testButton, isReading && styles.testButtonActive]}
              onPress={() => trocarTipoQuestao('reading')}
            >
              <Text style={[styles.testButtonText, isReading && styles.testButtonTextActive]}>
                Reading
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.testButton, isListening && styles.testButtonActive]}
              onPress={() => trocarTipoQuestao('listening')}
            >
              <Text style={[styles.testButtonText, isListening && styles.testButtonTextActive]}>
                Listening
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, isSpeaking && styles.testButtonActive]}
              onPress={() => trocarTipoQuestao('speaking')}
            >
              <Text style={[styles.testButtonText, isSpeaking && styles.testButtonTextActive]}>
                Speaking
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        <Text style={styles.titulo}>Praticar</Text>
        <Text style={styles.subtitulo}>
          {questaoAtual + 1}/{questoes.length} questão
        </Text>

        {/* ⭐ SPEAKING */}
        {isSpeaking && (
          <View style={styles.questaoContainer}>
            <View style={styles.cardPergunta}>
              <Text style={styles.labelPergunta}>Pronuncie a frase</Text>
              
              <View style={styles.fraseBox}>
                <Text style={styles.fraseTexto}>{questao.audio}</Text>
              </View>

              <TouchableOpacity 
                onPress={() => reproduzirAudio(questao.audio)}
                style={styles.audioButtonInline}
              >
                <Text style={styles.audioButtonText}>
                  {tocandoAudio ? '⏸️ Pausar' : '🔊 Escutar pronúncia'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.micContainer}>
              <Text style={styles.micLabel}>Toque no microfone e fale</Text>
              
              <TouchableOpacity 
                style={[styles.micButton, gravando && styles.micButtonActive]}
                onPress={iniciarGravacao}
                disabled={gravando}
              >
                <Image 
                  source={require('../../assets/mic.png')}
                  style={styles.micIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {gravando && (
                <View style={styles.gravandoBox}>
                  <Text style={styles.gravandoText}>🎤 Ouvindo...</Text>
                  <View style={styles.waveform}>
                    <View style={[styles.wave, styles.wave1]} />
                    <View style={[styles.wave, styles.wave2]} />
                    <View style={[styles.wave, styles.wave3]} />
                  </View>
                </View>
              )}

              {textoFalado && !gravando && (
                <View style={styles.resultadoFala}>
                  <Text style={styles.resultadoFalaLabel}>Você disse:</Text>
                  <Text style={styles.resultadoFalaTexto}>"{textoFalado}"</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ⭐ READING */}
        {isReading && (
          <View style={styles.questaoContainer}>
            <View style={styles.cardPergunta}>
              <Text style={styles.labelPergunta}>Complete a frase</Text>
              <View style={styles.fraseBox}>
                <Text style={styles.fraseTexto}>{questao.texto}</Text>
              </View>
            </View>

            <View style={styles.opcoesContainer}>
              {questao.opcoes.map((opcao, index) => {
                const letra = String.fromCharCode(65 + index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.opcaoButton}
                    onPress={() => verificarResposta(opcao)}
                  >
                    <View style={styles.opcaoLetra}>
                      <Text style={styles.opcaoLetraTexto}>{letra}</Text>
                    </View>
                    <Text style={styles.opcaoTexto}>{opcao}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ⭐ LISTENING */}
        {isListening && (
          <View style={styles.questaoContainer}>
            <View style={styles.cardPergunta}>
              <Text style={styles.labelPergunta}>Escute a frase</Text>
              
              <TouchableOpacity 
                style={styles.audioBoxInteractive}
                onPress={() => reproduzirAudio(questao.audio)}
              >
                <Image 
                  source={require('../../assets/play.png')}
                  style={styles.playIconBig}
                  resizeMode="contain"
                />
                <Text style={styles.audioTextoInteractive}>
                  {tocandoAudio ? 'Reproduzindo...' : ''}
                </Text>
              </TouchableOpacity>

              <Text style={styles.instrucao}>
                Selecione a opção que corresponde ao áudio
              </Text>
            </View>

            <View style={styles.opcoesContainer}>
              {questao.opcoes.map((opcao, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.opcaoButton}
                  onPress={() => verificarResposta(opcao)}
                >
                  <Text style={styles.opcaoTexto}>{opcao}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Image 
            source={require('../../assets/account.png')}
            style={styles.navImage}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backIcon: {
    fontSize: 40,
    color: '#000000',
    fontWeight: '300',
  },
  testButtonsContainer: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  testModeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  testButtonActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  testButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  questaoContainer: {
    flex: 1,
    paddingTop: 20,
  },
  cardPergunta: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  labelPergunta: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  fraseBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  fraseTexto: {
    fontSize: 22,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  audioButtonInline: {
    backgroundColor: '#A67649',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
audioBoxInteractive: {
  marginLeft: '110',
    backgroundColor: '#e8ecf2cb',
    borderRadius: 50, // Reduzido de 80
    padding: 15, // Reduzido de 25
    borderColor: '#F4F4F4',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    width: 80, // Adicione largura fixa
    height: 80, // Adicione altura fixa
  },
  playIconBig: {
    marginTop: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    margin: 10,
  },
  audioTextoInteractive: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  instrucao: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  micContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  micLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A67649',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#E74C3C',
  },
  micIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  gravandoBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  gravandoText: {
    fontSize: 18,
    color: '#E74C3C',
    fontWeight: '600',
    marginBottom: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wave: {
    width: 4,
    backgroundColor: '#E74C3C',
    borderRadius: 2,
  },
  wave1: {
    height: 20,
    animation: 'pulse 0.8s ease-in-out infinite',
  },
  wave2: {
    height: 30,
    animation: 'pulse 0.8s ease-in-out 0.2s infinite',
  },
  wave3: {
    height: 20,
    animation: 'pulse 0.8s ease-in-out 0.4s infinite',
  },
  resultadoFala: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    alignItems: 'center',
  },
  resultadoFalaLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  resultadoFalaTexto: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  opcoesContainer: {
    marginTop: 30,
    width: '100%',
  },
  opcaoButton: {
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#A67649',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  opcaoLetra: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  opcaoLetraTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  opcaoTexto: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 10,
    paddingBottom: 25,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navImage: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
});