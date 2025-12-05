import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.189:3000';

export default function PerformanceScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('userData');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserData(user);
        
        await fetchPerformanceData(user.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async (userId) => {
    try {
      console.log('🔍 Buscando dados de:', `${API_URL}/desempenho/${userId}`);
      const response = await fetch(`${API_URL}/desempenho/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data.data);
        console.log('📊 Dados carregados:', data.data);
      } else {
        Alert.alert('Erro', data.message || 'Não foi possível carregar o desempenho');
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    }
  };

  const [isReady, setIsReady] = useState(false);

useEffect(() => {
  loadData();
  // Forçar re-renderização após um pequeno delay
  setTimeout(() => setIsReady(true), 100);
}, []);

// No renderStars, adicione a key para forçar re-render
const renderStars = (quantidade) => {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3].map((star, index) => (
        <Text 
          key={`${star}-${isReady}`} // Força re-render quando isReady muda
          style={[
            styles.starIcon,
            index === 0 && styles.starFirst,
            index === 1 && styles.starMiddle,
            index === 2 && styles.starLast,
            star <= quantidade ? styles.starFilled : styles.starEmpty
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

  if (loading || !performanceData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A67649" />
      </View>
    );
  }

  // Calcular percentual da barra de XP
  const xpPercentual = Math.min((performanceData.xp.total / performanceData.xp.maximo) * 100, 100);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.header}>Seu desempenho</Text>

        {/* Barra de XP Melhorada */}
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>Experiência Total</Text>
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarFill, { width: `${xpPercentual}%` }]} />
            <Text style={styles.xpBarText}>
              {performanceData.xp.total} XP
            </Text>
          </View>
          <View style={styles.xpDetails}>
            <Text style={styles.xpDetailText}>
              {performanceData.xp.total} / {performanceData.xp.maximo} XP
            </Text>
            <Text style={styles.xpPercentText}>{Math.round(xpPercentual)}%</Text>
          </View>
        </View>

        {/* Fases Concluídas */}
        <Text style={styles.sectionTitle}>Fases concluídas</Text>

        {performanceData.jogos.map((fase) => (
          <View 
            key={fase.id} 
            style={[styles.faseCard, { backgroundColor: fase.cor }]}
          >
            <View style={styles.faseIconContainer}>
              <View style={styles.faseIcon}>
                {renderStars(fase.estrelas)}
              </View>
              <Text style={styles.faseNumero}>{fase.numero}</Text>
            </View>

            <View style={styles.faseContent}>
              <Text style={styles.faseTitulo}>{fase.titulo}</Text>
              
              {fase.tipo === 'estrelas' ? (
                <Text style={styles.faseStats}>
                  Estrelas: {fase.estrelas}/3
                </Text>
              ) : (
                <>
                  <Text style={styles.faseStats}>
                    XP: {fase.xp} | Estrelas: {fase.estrelas}/3
                  </Text>
                  <Text style={styles.faseStats}>
                    Acertos: {fase.totalAcertos} | Erros: {fase.totalErros}
                  </Text>
                  {fase.dificuldades && (
                    <Text style={styles.faseDificuldades}>
                      Dificuldades: Frases na {fase.dificuldades}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        ))}

        {/* Botão Revisar */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewText}>
            Revisar para melhorar seu desempenho
          </Text>
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => navigation.navigate('Pratice')}
          >
            <Text style={styles.reviewButtonText}>Revisar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Image 
            source={require('../../assets/home.png')}
            style={styles.navImage}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
  },
  // ✅ BARRA DE XP MELHORADA
  xpContainer: {
    marginBottom: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  xpBarContainer: {
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#382416',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpBarText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  xpPercentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#382416',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  faseCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  faseIconContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  faseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  
  // ✅ ESTRELAS CURVADAS
  starsContainer: {
    flexDirection: 'row',
    position: 'relative',
    bottom: 10, // Ajuste para posicionamento
  },
  starIcon: {
    width: 20,
    height: 25,
    fontSize: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginBottom: 5,
    marginHorizontal: -4, // Para as estrelas se sobreporem um pouco
    position: 'relative',
  },
  starTransform: {
    // Estilo base para transformações
  },
  starFirst: {
    transform: [{ translateY: 6 }], // Primeira estrela levemente para baixo
  },
  starMiddle: {
    transform: [{ translateY: 0 }], // Estrela do meio na posição normal
  },
  starLast: {
    transform: [{ translateY: 6 }], // Última estrela levemente para baixo
  },
  // Para quando tiver apenas uma estrela (caso específico)
  starSingle: {
    transform: [{ translateY: 2 }],
  },
  starFilled: {
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  starEmpty: {
    color: '#D3D3D3',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  faseNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  faseContent: {
    flex: 1,
  },
  faseTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  faseStats: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 3,
    opacity: 0.95,
  },
  faseDificuldades: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 5,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  reviewSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  reviewText: {
    fontSize: 13,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  reviewButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 50,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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