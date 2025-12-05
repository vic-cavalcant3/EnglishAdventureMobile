import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

const API_URL = 'http://192.168.0.189:3000';

export default function PraticaExerciciosScreen({ route, navigation }) {
  const { userId, userName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [tipoAtual, setTipoAtual] = useState({ gramatica: '', habilidade: '' });
  const [tocandoAudio, setTocandoAudio] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [textoFalado, setTextoFalado] = useState('');
  const [permissaoMic, setPermissaoMic] = useState(false);
  const [mostrarSelecao, setMostrarSelecao] = useState(true);
  const [dificuldadesUsuario, setDificuldadesUsuario] = useState(null);

  const verificandoRef = useRef(false);
  const mountedRef = useRef(true);
  const listenersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;

    const inicializar = async () => {
      try {
        console.log('Iniciando PraticaExerciciosScreen');
        console.log('Parametros:', { userId, userName });
        
        if (!userId || !userName) {
          console.error('Parametros faltando!');
          Alert.alert(
            'Erro',
            'Dados do usuario nao encontrados. Faca login novamente.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }

        try {
          const { granted } = await SpeechRecognition.requestPermissionsAsync();
          if (mountedRef.current) {
            setPermissaoMic(granted);
          }
        } catch (micError) {
          console.warn('Erro ao solicitar permissao do microfone:', micError);
        }

        // Carregar dificuldades do usuario
        await carregarDificuldades();
      } catch (error) {
        console.error('Erro na inicializacao:', error);
        if (mountedRef.current) {
          Alert.alert(
            'Erro',
            'Nao foi possivel inicializar os exercicios.',
            [{ text: 'Voltar', onPress: () => navigation.goBack() }]
          );
        }
      }
    };

    inicializar();

    return () => {
      console.log('Limpando recursos...');
      mountedRef.current = false;
      
      listenersRef.current.forEach(sub => {
        try {
          sub.remove();
        } catch (e) {}
      });
      
      try {
        Speech.stop();
      } catch (e) {}
      
      try {
        SpeechRecognition.stopAsync();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!permissaoMic) {
      console.log('Sem permissao de microfone, pulando listeners');
      return;
    }

    const handleSpeechResults = (event) => {
      if (!mountedRef.current || verificandoRef.current) return;

      const text = event.value?.[0] || '';
      console.log('Reconhecido:', text);
      
      if (mountedRef.current) {
        setTextoFalado(text);
        setGravando(false);
      }
    };

    const handleSpeechError = (event) => {
      console.error('Erro no reconhecimento:', event);
      if (mountedRef.current) {
        setGravando(false);
        Alert.alert('Erro', 'Nao consegui entender. Tente novamente.');
      }
    };

    try {
      const subscription = SpeechRecognition.addListener('onSpeechResults', handleSpeechResults);
      const subscriptionError = SpeechRecognition.addListener('onSpeechError', handleSpeechError);

      listenersRef.current = [subscription, subscriptionError];
      console.log('Listeners de voz configurados');
    } catch (error) {
      console.error('Erro ao configurar listeners:', error);
    }

    return () => {
      listenersRef.current.forEach(sub => {
        try {
          sub.remove();
        } catch (e) {}
      });
      listenersRef.current = [];
    };
  }, [permissaoMic]);

  const carregarDificuldades = async () => {
    try {
      const response = await fetch(`${API_URL}/pratica/dificuldade/${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDificuldadesUsuario(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dificuldades:', error);
    }
  };

  const iniciarPraticaComSelecao = async (habilidade, gramatica) => {
    setLoading(true);
    setMostrarSelecao(false);

    try {
      console.log('Gerando questoes:', { gramatica, habilidade });
      
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
      console.log('Questoes recebidas:', questoesData.data.totalQuestoes);
      
      if (questoesData.success && questoesData.data.questoes.length > 0) {
        if (mountedRef.current) {
          setQuestoes(questoesData.data.questoes);
          setTipoAtual({ gramatica, habilidade });
          setLoading(false);
          
          const nomeHabilidade = {
            reading: 'Leitura',
            listening: 'Escuta',
            speaking: 'Fala',
            writing: 'Escrita'
          }[habilidade] || habilidade;

          const nomeGramatica = {
            afirmativa: 'Afirmativa',
            interrogativa: 'Interrogativa',
            negativa: 'Negativa'
          }[gramatica] || gramatica;
          
          Alert.alert(
            'Vamos praticar!',
            `Foco: ${nomeGramatica} + ${nomeHabilidade}\n\n${questoesData.data.totalQuestoes} questoes preparadas!`,
            [{ text: 'Comecar!' }]
          );
        }
      } else {
        throw new Error('Nenhuma questao disponivel');
      }
      
    } catch (error) {
      console.error('Erro ao iniciar pratica:', error);
      if (mountedRef.current) {
        setLoading(false);
        setMostrarSelecao(true);
        Alert.alert(
          'Erro',
          `Nao foi possivel carregar questoes.\n\n${error.message}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const reproduzirAudio = async (texto) => {
    if (tocandoAudio) {
      Speech.stop();
      setTocandoAudio(false);
      return;
    }

    setTocandoAudio(true);
    console.log('Reproduzindo:', texto);
    
    try {
      await Speech.speak(texto, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onDone: () => mountedRef.current && setTocandoAudio(false),
        onStopped: () => mountedRef.current && setTocandoAudio(false),
        onError: () => {
          if (mountedRef.current) {
            setTocandoAudio(false);
            Alert.alert('Erro', 'Nao foi possivel reproduzir o audio');
          }
        }
      });
    } catch (error) {
      console.error('Erro ao reproduzir audio:', error);
      if (mountedRef.current) {
        setTocandoAudio(false);
        Alert.alert('Erro', 'Erro ao reproduzir audio');
      }
    }
  };

  const iniciarGravacao = async () => {
    if (!permissaoMic) {
      Alert.alert(
        'Permissao Necessaria',
        'Precisamos de permissao do microfone para esta atividade.',
        [
          {
            text: 'Dar Permissao',
            onPress: async () => {
              const { granted } = await SpeechRecognition.requestPermissionsAsync();
              setPermissaoMic(granted);
              if (granted) iniciarGravacao();
            }
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      console.log('Iniciando gravacao...');
      setTextoFalado('');
      verificandoRef.current = false;

      await SpeechRecognition.startAsync({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1
      });

      setGravando(true);
    } catch (error) {
      console.error('Erro ao iniciar gravacao:', error);
      Alert.alert('Erro', 'Nao foi possivel iniciar o reconhecimento de voz.');
    }
  };

  const verificarRespostaFalada = async (textoReconhecido) => {
    if (verificandoRef.current) {
      console.log('Ja esta verificando, aguarde...');
      return;
    }
    
    verificandoRef.current = true;
    
    try {
      const questao = questoes[questaoAtual];
      
      const respostaNormalizada = textoReconhecido.trim().toLowerCase().replace(/[.,!?]/g, '');
      const respostaCorretaNormalizada = questao.resposta.trim().toLowerCase().replace(/[.,!?]/g, '');
      
      const palavrasUsuario = respostaNormalizada.split(' ').filter(p => p.length > 0);
      const palavrasCorretas = respostaCorretaNormalizada.split(' ').filter(p => p.length > 0);
      
      let acertos = 0;
      palavrasCorretas.forEach(palavra => {
        if (palavrasUsuario.includes(palavra)) {
          acertos++;
        }
      });
      
      const percentualAcerto = (acertos / palavrasCorretas.length) * 100;
      const acertou = percentualAcerto >= 70;
      
      console.log('Analise de fala:', {
        falou: respostaNormalizada,
        esperado: respostaCorretaNormalizada,
        acertoPorcentagem: Math.round(percentualAcerto)
      });
      
      await salvarResultado(acertou);
      
      const novosResultados = [...resultados, { questaoId: questao.id, acertou }];
      setResultados(novosResultados);
      
      setTimeout(() => {
        if (mountedRef.current) {
          Alert.alert(
            acertou ? 'Excelente!' : 'Quase la!',
            acertou 
              ? `Voce disse: "${textoReconhecido}"\n\nPerfeito! Continue assim!` 
              : `Voce disse: "${textoReconhecido}"\n\nTente novamente: "${questao.resposta}"`,
            [
              {
                text: acertou ? 'Proxima' : 'Tentar Novamente',
                onPress: () => {
                  if (acertou) {
                    proximaQuestao(novosResultados);
                  } else {
                    setTextoFalado('');
                    verificandoRef.current = false;
                  }
                }
              }
            ]
          );
        }
      }, 300);
    } catch (error) {
      console.error('Erro ao verificar resposta falada:', error);
      verificandoRef.current = false;
      Alert.alert('Erro', 'Ocorreu um erro ao verificar sua resposta.');
    }
  };

  const verificarResposta = async (respostaUsuario) => {
    const questao = questoes[questaoAtual];
    
    const respostaNormalizada = respostaUsuario.trim().toLowerCase();
    const respostaCorretaNormalizada = questao.resposta.trim().toLowerCase();
    
    const acertou = respostaNormalizada === respostaCorretaNormalizada;
    
    console.log('Verificando resposta:', { usuario: respostaNormalizada, correto: respostaCorretaNormalizada, acertou });
    
    await salvarResultado(acertou);
    
    const novosResultados = [...resultados, { questaoId: questao.id, acertou }];
    setResultados(novosResultados);
    
    if (mountedRef.current) {
      Alert.alert(
        acertou ? 'Correto!' : 'Ops!',
        acertou ? 'Muito bem! Continue assim!' : `A resposta correta era:\n\n${questao.resposta}`,
        [
          {
            text: 'Proxima',
            onPress: () => proximaQuestao(novosResultados)
          }
        ]
      );
    }
  };

  const proximaQuestao = (resultadosAtuais) => {
    if (questaoAtual + 1 < questoes.length) {
      setQuestaoAtual(questaoAtual + 1);
      setTextoFalado('');
      verificandoRef.current = false;
    } else {
      finalizarPratica(resultadosAtuais);
    }
  };

  const salvarResultado = async (acertou) => {
    try {
      const response = await fetch(`${API_URL}/pratica/salvar-resultado`, {
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
          acertou: acertou ? 1 : 0,
          tentativas: 1
        })
      });

      if (response.ok) {
        console.log('Resultado salvo no servidor');
      } else {
        console.warn('Falha ao salvar resultado');
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  };

  const finalizarPratica = (resultadosFinais) => {
    const acertos = resultadosFinais.filter(r => r.acertou).length;
    const total = resultadosFinais.length;
    const percentual = Math.round((acertos / total) * 100);
    
    let mensagem = '';
    
    if (percentual >= 80) {
      mensagem = 'Excelente trabalho!';
    } else if (percentual >= 60) {
      mensagem = 'Bom trabalho! Continue praticando!';
    } else {
      mensagem = 'Continue se esforcando!';
    }
    
    if (mountedRef.current) {
      Alert.alert(
        'Pratica Concluida!',
        `${mensagem}\n\nVoce acertou ${acertos} de ${total} questoes\n\n${percentual}% de aproveitamento`,
        [{ 
          text: 'Voltar', 
          onPress: () => {
            setMostrarSelecao(true);
            setQuestoes([]);
            setQuestaoAtual(0);
            setResultados([]);
          }
        }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A67649" />
        <Text style={styles.loadingText}>Preparando exercicios...</Text>
      </View>
    );
  }

  // TELA DE SELECAO
  if (mostrarSelecao) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.titulo}>Escolha o que praticar</Text>
          
          {dificuldadesUsuario && !dificuldadesUsuario.dominaTudo && (
            <View style={styles.recomendacaoBox}>
              <Text style={styles.recomendacaoTitulo}>Recomendado para voce:</Text>
              <Text style={styles.recomendacaoTexto}>
                {dificuldadesUsuario.gramatica === 'afirmativa' ? 'Afirmativa' : 
                 dificuldadesUsuario.gramatica === 'interrogativa' ? 'Interrogativa' : 'Negativa'} + {' '}
                {dificuldadesUsuario.habilidade === 'reading' ? 'Leitura' :
                 dificuldadesUsuario.habilidade === 'listening' ? 'Escuta' :
                 dificuldadesUsuario.habilidade === 'speaking' ? 'Fala' : 'Escrita'}
              </Text>
            </View>
          )}

          <Text style={styles.secaoTitulo}>Habilidades</Text>
          
          <TouchableOpacity 
            style={styles.cardOpcao}
            onPress={() => {
              Alert.alert(
                'Speaking - Fala',
                'Escolha o tipo de frase:',
                [
                  { text: 'Afirmativa', onPress: () => iniciarPraticaComSelecao('speaking', 'afirmativa') },
                  { text: 'Interrogativa', onPress: () => iniciarPraticaComSelecao('speaking', 'interrogativa') },
                  { text: 'Negativa', onPress: () => iniciarPraticaComSelecao('speaking', 'negativa') },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>S</Text>
            </View>
            <View style={styles.opcaoTextos}>
              <Text style={styles.opcaoTitulo}>Speaking</Text>
              <Text style={styles.opcaoDescricao}>Pratique sua pronuncia</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cardOpcao}
            onPress={() => {
              Alert.alert(
                'Listening - Escuta',
                'Escolha o tipo de frase:',
                [
                  { text: 'Afirmativa', onPress: () => iniciarPraticaComSelecao('listening', 'afirmativa') },
                  { text: 'Interrogativa', onPress: () => iniciarPraticaComSelecao('listening', 'interrogativa') },
                  { text: 'Negativa', onPress: () => iniciarPraticaComSelecao('listening', 'negativa') },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>L</Text>
            </View>
            <View style={styles.opcaoTextos}>
              <Text style={styles.opcaoTitulo}>Listening</Text>
              <Text style={styles.opcaoDescricao}>Treine sua compreensao auditiva</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cardOpcao}
            onPress={() => {
              Alert.alert(
                'Reading - Leitura',
                'Escolha o tipo de frase:',
                [
                  { text: 'Afirmativa', onPress: () => iniciarPraticaComSelecao('reading', 'afirmativa') },
                  { text: 'Interrogativa', onPress: () => iniciarPraticaComSelecao('reading', 'interrogativa') },
                  { text: 'Negativa', onPress: () => iniciarPraticaComSelecao('reading', 'negativa') },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>R</Text>
            </View>
            <View style={styles.opcaoTextos}>
              <Text style={styles.opcaoTitulo}>Reading</Text>
              <Text style={styles.opcaoDescricao}>Melhore sua leitura</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cardOpcao}
            onPress={() => {
              Alert.alert(
                'Writing - Escrita',
                'Escolha o tipo de frase:',
                [
                  { text: 'Afirmativa', onPress: () => iniciarPraticaComSelecao('writing', 'afirmativa') },
                  { text: 'Interrogativa', onPress: () => iniciarPraticaComSelecao('writing', 'interrogativa') },
                  { text: 'Negativa', onPress: () => iniciarPraticaComSelecao('writing', 'negativa') },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>W</Text>
            </View>
            <View style={styles.opcaoTextos}>
              <Text style={styles.opcaoTitulo}>Writing</Text>
              <Text style={styles.opcaoDescricao}>Aprimore sua escrita</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

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

  // TELA DE QUESTOES
  if (questoes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Nenhuma questao disponivel</Text>
          <Text style={styles.errorText}>
            Nao foi possivel carregar os exercicios.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setMostrarSelecao(true)}
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

  if (!questao) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A67649" />
        <Text style={styles.loadingText}>Carregando questao...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Sair da pratica',
              'Deseja realmente sair? Seu progresso sera perdido.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Sair', 
                  style: 'destructive',
                  onPress: () => {
                    try {
                      Speech.stop();
                      SpeechRecognition.stopAsync().catch(() => {});
                      setMostrarSelecao(true);
                      setQuestoes([]);
                      setQuestaoAtual(0);
                      setResultados([]);
                    } catch (error) {
                      console.error('Erro ao voltar:', error);
                    }
                  }
                }
              ]
            );
          }}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.titulo}>Praticar</Text>
        <Text style={styles.subtitulo}>
          Questao {questaoAtual + 1} de {questoes.length}
        </Text>

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
                  {tocandoAudio ? 'Pausar' : 'Escutar pronuncia'}
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
                  <Text style={styles.gravandoText}>Ouvindo...</Text>
                  <Text style={styles.gravandoSubtext}>Fale agora</Text>
                </View>
              )}

              {textoFalado && !gravando && (
                <View style={styles.resultadoFala}>
                  <Text style={styles.resultadoFalaLabel}>Voce disse:</Text>
                  <Text style={styles.resultadoFalaTexto}>"{textoFalado}"</Text>
                  
                  <TouchableOpacity
                    style={styles.verificarButton}
                    onPress={() => {
                      if (textoFalado.trim()) {
                        verificarRespostaFalada(textoFalado);
                      } else {
                        Alert.alert('Aviso', 'Grave sua resposta primeiro!');
                      }
                    }}
                  >
                    <Text style={styles.verificarButtonText}>Verificar Resposta</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.gravarNovamenteButton}
                    onPress={() => {
                      setTextoFalado('');
                      verificandoRef.current = false;
                    }}
                  >
                    <Text style={styles.gravarNovamenteText}>Gravar Novamente</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

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

        {isListening && (
          <View style={styles.questaoContainer}>
            <View style={styles.cardPergunta}>
              <Text style={styles.labelPergunta}>Escute a frase</Text>
              <View style={styles.underline} />
              
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
                  {tocandoAudio ? 'Tocando...' : 'Tocar audio'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.instrucao}>
                Selecione a opcao que corresponde ao audio
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A67649',
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
    backgroundColor: '#A67649',
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
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  backIcon: {
    fontSize: 40,
    color: '#000000',
    fontWeight: '300',
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
  recomendacaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A67649',
    marginBottom: 5,
  },
  recomendacaoTexto: {
    fontSize: 14,
    color: '#666',
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
    marginTop: 10,
  },
  cardOpcao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A67649',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  opcaoTextos: {
    flex: 1,
  },
  opcaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  opcaoDescricao: {
    fontSize: 14,
    color: '#666',
  },
  questaoContainer: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardPergunta: {
    backgroundColor: '#F9F9F9',
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
    fontSize: 18,
    color: '#A67649',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  underline: {
    height: 2,
    backgroundColor: '#A67649',
    width: '60%',
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 1,
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
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  playIconBig: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  audioTextoInteractive: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 5,
  },
  gravandoSubtext: {
    fontSize: 14,
    color: '#999',
  },
  resultadoFala: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
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
    marginBottom: 15,
  },
  verificarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  verificarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gravarNovamenteButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#A67649',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  gravarNovamenteText: {
    color: '#A67649',
    fontSize: 14,
    fontWeight: '600',
  },
  opcoesContainer: {
    marginTop: 20,
    width: '100%',
  },
  opcaoButton: {
    backgroundColor: '#A67649',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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