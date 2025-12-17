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

const API_URL = 'http://192.168.0.125:3000';

export default function PraticarScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('userData');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserData(user);
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/estatisticas-pratica/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        console.log('📊 Estatísticas:', data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const getBarWidth = (acertos, total) => {
    if (total === 0) return 0;
    return (acertos / total) * 100;
  };

  const getBarColor = (type) => {
    const colors = {
      afirmativa: '#8B4513',
      interrogativa: '#8B4513',
      negativa: '#8B4513'
    };
    return colors[type] || '#999';
  };

  const handlePractice = () => {
  console.log('🔵 === CLICOU EM PRATICAR ===');
  console.log('👤 userData:', userData);
  console.log('📍 userId:', userData?.id);
  console.log('📛 userName:', userData?.nome);

  if (!userData || !userData.id || !userData.nome) {
    Alert.alert('Erro', 'Dados do usuário incompletos');
    return;
  }

  try {
    console.log('🚀 Navegando para PraticaExercicios...');
    
    navigation.navigate('PraticaExercicios', {
      userId: userData.id,
      userName: userData.nome
    });

    console.log('✅ Navegação chamada com sucesso');
  } catch (error) {
    console.error('❌ Erro na navegação:', error);
    Alert.alert('Erro', 'Não foi possível abrir os exercícios');
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Praticar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Erros</Text>
          <Text style={styles.infoText}>
            Vamos analisar suas dificuldades com{'\n'}
            base nos seus erros:
          </Text>
        </View>

        {/* Estatísticas de Gramática */}
        {stats && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Afirmativa</Text>
                <Text style={styles.statValue}>
                  {stats.gramatica.afirmativa.acertos}/{stats.gramatica.afirmativa.total}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getBarWidth(stats.gramatica.afirmativa.acertos, stats.gramatica.afirmativa.total)}%`,
                      backgroundColor: getBarColor('afirmativa')
                    }
                  ]} 
                />
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Interrogativa</Text>
                <Text style={styles.statValue}>
                  {stats.gramatica.interrogativa.acertos}/{stats.gramatica.interrogativa.total}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getBarWidth(stats.gramatica.interrogativa.acertos, stats.gramatica.interrogativa.total)}%`,
                      backgroundColor: getBarColor('interrogativa')
                    }
                  ]} 
                />
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Negativa</Text>
                <Text style={styles.statValue}>
                  {stats.gramatica.negativa.acertos}/{stats.gramatica.negativa.total}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getBarWidth(stats.gramatica.negativa.acertos, stats.gramatica.negativa.total)}%`,
                      backgroundColor: getBarColor('negativa')
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Cards de Habilidades */}
            <View style={styles.skillsContainer}>
              <View style={styles.skillCard}>
                <View style={styles.skillIcon}>
                 <Image 
                             source={require('../../assets/speaking.png')}
                             style={styles.iconhability}
                             resizeMode="contain"
                           />
                </View>
                <Text style={styles.skillLabel}>Speaking</Text>
                <Text style={styles.skillScore}>
                  {stats.habilidades.speaking.acertos}/{stats.habilidades.speaking.total}
                </Text>
              </View>

              <View style={styles.skillCard}>
                <View style={styles.skillIcon}>
                       <Image 
                             source={require('../../assets/reading.png')}
                             style={styles.iconhability}
                             resizeMode="contain"
                        />
                </View>
                <Text style={styles.skillLabel}>Reading</Text>
                <Text style={styles.skillScore}>
                  {stats.habilidades.reading.acertos}/{stats.habilidades.reading.total}
                </Text>
              </View>

              <View style={styles.skillCard}>
                <View style={styles.skillIcon}>
                          <Image 
                             source={require('../../assets/listening.png')}
                             style={styles.iconhability}
                             resizeMode="contain"
                           />                
                           
                </View>
                <Text style={styles.skillLabel}>Listening</Text>
                <Text style={styles.skillScore}>
                  {stats.habilidades.listening.acertos}/{stats.habilidades.listening.total}
                </Text>
              </View>
            </View>

            {/* Texto motivacional */}
            <Text style={styles.motivationText}>
              Pratique para se tornar mais forte!
            </Text>

            {/* Botão Praticar */}
            <TouchableOpacity 
              style={styles.practiceButton}
              onPress={handlePractice}
              activeOpacity={0.8}
            >
              <Text style={styles.practiceButtonText}>Praticar</Text>
            </TouchableOpacity>
          </>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#FFE6E5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  skillCard: {
    flex: 1,
    backgroundColor: '#906a47ff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  skillIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE6E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  iconhability: {
    width: 30,
    height: 30,
  },
  skillEmoji: {
    fontSize: 24,
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EAD6B5',
    marginBottom: 5,
  },
  skillScore: {
    fontSize: 14,
    fontWeight: '400',
    color: '#EAD6B5',
  },
  motivationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  practiceButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    paddingLeft: 145,
  },

  practiceButtonText: {
   fontSize: 15,
    fontWeight: '700',
    color: '#000',
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