// ==========================================
// UTILITÁRIOS DE ÁUDIO - SEM INSTALAÇÃO!
// Crie: src/utils/audioUtils.js
// ==========================================

import { Alert, Platform } from 'react-native';

// 🔊 TEXT-TO-SPEECH (Falar o texto)
export const speakText = (text, language = 'en-US') => {
  return new Promise((resolve, reject) => {
    try {
      // Usar API nativa do navegador (funciona no Expo/React Native Web)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.9; // Velocidade (0.1 a 10)
        utterance.pitch = 1; // Tom (0 a 2)
        utterance.volume = 1; // Volume (0 a 1)
        
        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);
        
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback para React Native puro
        Alert.alert('Áudio', `Texto: ${text}`);
        resolve();
      }
    } catch (error) {
      console.error('Erro ao falar texto:', error);
      reject(error);
    }
  });
};

// 🎤 SPEECH-TO-TEXT (Reconhecer voz)
export const startVoiceRecognition = (expectedText, language = 'en-US') => {
  return new Promise((resolve, reject) => {
    try {
      // Verificar se navegador suporta reconhecimento de voz
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        Alert.alert(
          'Recurso indisponível',
          'Seu dispositivo não suporta reconhecimento de voz. Use a verificação por texto.',
          [{ text: 'OK' }]
        );
        reject(new Error('Speech recognition not supported'));
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('🎤 Gravação iniciada');
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🗣️ Você disse:', transcript);
        
        // Comparar com texto esperado
        const similarity = calculateSimilarity(transcript, expectedText);
        
        resolve({
          transcript,
          expectedText,
          similarity,
          isCorrect: similarity >= 70 // 70% de similaridade = correto
        });
      };
      
      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento:', event.error);
        reject(event.error);
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
      reject(error);
    }
  });
};

// 📊 CALCULAR SIMILARIDADE ENTRE TEXTOS
export const calculateSimilarity = (text1, text2) => {
  // Normalizar textos
  const normalize = (text) => 
    text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .trim();
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  // Se forem exatamente iguais
  if (normalized1 === normalized2) return 100;
  
  // Calcular distância de Levenshtein (similaridade)
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity);
};

// Algoritmo de Levenshtein (distância entre strings)
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // deleção
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// 🛑 PARAR ÁUDIO/RECONHECIMENTO
export const stopAllAudio = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// 🔇 VERIFICAR SE ÁUDIO ESTÁ DISPONÍVEL
export const isAudioAvailable = () => {
  return typeof window !== 'undefined' && 
         (window.speechSynthesis || window.SpeechRecognition || window.webkitSpeechRecognition);
};

// 🎯 VALIDAR RESPOSTA POR TEXTO (para Writing/Reading)
export const validateTextAnswer = (userAnswer, correctAnswer) => {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  return {
    isCorrect: similarity >= 90, // 90% de similaridade para respostas escritas
    similarity,
    userAnswer,
    correctAnswer
  };
};

// 📝 FORMATAR FEEDBACK DE PRONÚNCIA
export const formatPronunciationFeedback = (similarity) => {
  if (similarity >= 90) {
    return {
      emoji: '🌟',
      title: 'Perfeito!',
      message: 'Sua pronúncia está excelente!',
      color: '#4CAF50'
    };
  } else if (similarity >= 70) {
    return {
      emoji: '👍',
      title: 'Muito bom!',
      message: 'Continue praticando!',
      color: '#8BC34A'
    };
  } else if (similarity >= 50) {
    return {
      emoji: '😊',
      title: 'Quase lá!',
      message: 'Tente novamente prestando atenção na pronúncia',
      color: '#FFC107'
    };
  } else {
    return {
      emoji: '💪',
      title: 'Continue tentando!',
      message: 'Ouça novamente e tente repetir',
      color: '#FF9800'
    };
  }
};

export default {
  speakText,
  startVoiceRecognition,
  calculateSimilarity,
  stopAllAudio,
  isAudioAvailable,
  validateTextAnswer,
  formatPronunciationFeedback
};