import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { 
  speakText, 
  startVoiceRecognition, 
  validateTextAnswer,
  formatPronunciationFeedback,
  stopAllAudio 
} from '../utils/audioUtils';

const API_URL = 'http://10.136.23.59:3000';

export default function PraticaExerciciosScreen({ route, navigation }) {
  const { userId, userName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [resposta, setResposta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [gravando, setGravando] = useState(false);
  const [tipoAtual, setTipoAtual] = useState({ gramatica: '', habilidade: '' });

  useEffect(() => {
    iniciarPratica();
    
    return () => {
      stopAllAudio();
    };
  }, []);

  const iniciarPratica = async () => {
    try {
      // Buscar maior dificuldade
      const diffResponse = await fetch(`${API_URL}/pratica/dificuldade/${userId}`);
      const diffData = await diffResponse.json();
      
      if (!diffData.success) {
        Alert.alert('Erro', 'Não foi possível identificar dificuldades');
        navigation.goBack();
        return;
      }
      
      const { gramatica, habilidade, temDados } = diffData.data;
      
      if (!temDados) {
        Alert.alert(
          'Continue jogando!',
          'Precisamos de mais dados para identificar suas dificuldades. Continue jogando os níveis principais!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // Gerar questões
      const questoesResponse = await fetch(`${API_URL}/pratica/gerar-questoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gramatica, habilidade })
      });
      
      const questoesData = await questoesResponse.json();
      
      if (questoesData.success && questoesData.data.questoes.length > 0) {
        setQuestoes(questoesData.data.questoes);
        setTipoAtual({ gramatica, habilidade });
        setLoading(false);
        
        Alert.alert(
          'Vamos praticar!',
          `Você vai treinar: ${gramatica.toUpperCase()} + ${habilidade.toUpperCase()}\n\n${questoesData.data.totalQuestoes} questões preparadas!`,
          [{ text: 'Começar!' }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível gerar questões');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao iniciar prática:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a prática');
      navigation.goBack();
    }
  };

  // 🔊 FALAR O TEXTO DA QUESTÃO
  const falarTexto = async (texto) => {
    try {
      await speakText(texto, 'en-US');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
    }
  };

  // 🎤 INICIAR GRAVAÇÃO DE VOZ (para Speaking)
  const iniciarGravacao = async () => {
    const questao = questoes[questaoAtual];
    
    setGravando(true);
    
    try {
      const resultado = await startVoiceRecognition(questao.resposta, 'en-US');
      
      setGravando(false);
      
      const feedback = formatPronunciationFeedback(resultado.similarity);
      
      Alert.alert(
        `${feedback.emoji} ${feedback.title}`,
        `${feedback.message}\n\nVocê disse: "${resultado.transcript}"\nEsperado: "${resultado.expectedText}"\n\nSimilaridade: ${resultado.similarity}%`,
        [
          {
            text: resultado.isCorrect ? 'Próxima' : 'Tentar novamente',
            onPress: () => {
              if (resultado.isCorrect) {
                verificarResposta(resultado.transcript, true);
              }
            }
          }
        ]
      );
    } catch (error) {
      setGravando(false);
      console.error('Erro na gravação:', error);
      
      Alert.alert(
        'Reconhecimento de voz indisponível',
        'Você pode digitar a resposta ou tentar novamente',
        [
          { text: 'Digitar', onPress: () => {} },
          { text: 'Tentar novamente', onPress: iniciarGravacao }
        ]
      );
    }
  };

  const verificarResposta = async (respostaUsuario, jaValidado = false) => {
    const questao = questoes[questaoAtual];
    let acertou = false;
    
    if (jaValidado) {
      acertou = true;
    } else {
      const validacao = validateTextAnswer(respostaUsuario, questao.resposta);
      acertou = validacao.isCorrect;
    }
    
    // Salvar resultado no banco
    try {
      await fetch(`${API_URL}/pratica/salvar-resultado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: userId,
          nomeAluno: userName,
          gramatica: tipoAtual.gramatica,
          habilidade: tipoAtual.habilidade,
          acertou,
          tentativas: 1
        })
      });
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
    
    const novosResultados = [...resultados, { questaoId: questao.id, acertou }];
    setResultados(novosResultados);
    
    Alert.alert(
      acertou ? '✅ Correto!' : '❌ Ops!',
      acertou ? 'Continue assim!' : `A resposta correta era: ${questao.resposta}`,
      [
        {
          text: 'Próxima',
          onPress: () => {
            if (questaoAtual + 1 < questoes.length) {
              setQuestaoAtual(questaoAtual + 1);
              setResposta('');
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
    
    Alert.alert(
      '🎉 Prática Concluída!',
      `Você acertou ${acertos} de ${total} questões (${percentual}%)\n\nContinue praticando para melhorar!`,
      [
        {
          text: 'Voltar',
          onPress: () => navigation.goBack()
        }
      ]
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
        <Text style={styles.errorText}>Nenhuma questão disponível</Text>
      </View>
    );
  }

  const questao = questoes[questaoAtual];
  const isSpeaking = tipoAtual.habilidade === 'speaking';
  const isListening = tipoAtual.habilidade === 'listening';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Sair da prática?',
              'Seu progresso será salvo',
              [
                { text: 'Cancelar' },
                { 
                  text: 'Sair', 
                  onPress: () => {
                    stopAllAudio();
                    navigation.goBack();
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>
          {questaoAtual + 1}/{questoes.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questaoTitulo}>{questao.pergunta}</Text>
        
        {/* BOTÃO DE ÁUDIO (para Speaking e Listening) */}
        {(isSpeaking || isListening) && (
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={() => falarTexto(questao.audio || questao.resposta)}
          >
            <Text style={styles.audioIcon}>🔊</Text>
            <Text style={styles.audioText}>Ouvir</Text>
          </TouchableOpacity>
        )}
        
        {questao.dica && (
          <Text style={styles.dica}>💡 {questao.dica}</Text>
        )}
        
        {questao.texto && (
          <View style={styles.textoCard}>
            <Text style={styles.textoConteudo}>{questao.texto}</Text>
          </View>
        )}
        
        {/* QUESTÕES DE MÚLTIPLA ESCOLHA */}
        {questao.opcoes ? (
          <View style={styles.opcoesContainer}>
            {questao.opcoes.map((opcao, index) => (
              <TouchableOpacity
                key={index}
                style={styles.opcaoButton}
                onPress={() => verificarResposta(opcao)}
              >
                <Text style={styles.opcaoText}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : isSpeaking ? (
          // QUESTÕES DE SPEAKING (com microfone)
          <View style={styles.speakingContainer}>
            <TouchableOpacity 
              style={[styles.micButton, gravando && styles.micButtonActive]}
              onPress={iniciarGravacao}
              disabled={gravando}
            >
              <Text style={styles.micIcon}>🎤</Text>
              <Text style={styles.micText}>
                {gravando ? 'Gravando...' : 'Gravar'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.ouText}>OU</Text>
            
            <TextInput
              style={styles.respostaInput}
              value={resposta}
              onChangeText={setResposta}
              placeholder="Digite sua resposta..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.enviarButton}
              onPress={() => verificarResposta(resposta)}
            >
              <Text style={styles.enviarText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // QUESTÕES DE WRITING/READING (input de texto)
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.respostaInput}
              value={resposta}
              onChangeText={setResposta}
              placeholder="Digite sua resposta..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.enviarButton}
              onPress={() => verificarResposta(resposta)}
            >
              <Text style={styles.enviarText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeIcon: {
    fontSize: 28,
    color: '#000000',
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questaoTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  audioButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  audioText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dica: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textoCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  textoConteudo: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  opcoesContainer: {
    marginTop: 20,
  },
  opcaoButton: {
    backgroundColor: '#8B4513',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
  },
  opcaoText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  speakingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#FF5722',
    borderRadius: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  micButtonActive: {
    backgroundColor: '#F44336',
  },
  micIcon: {
    fontSize: 48,
  },
  micText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 5,
  },
  ouText: {
    fontSize: 14,
    color: '#999',
    marginVertical: 15,
  },
  inputContainer: {
    marginTop: 20,
  },
  respostaInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    marginBottom: 15,
  },
  enviarButton: {
    backgroundColor: '#8B4513',
    borderRadius: 15,
    padding: 18,
  },
  enviarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});