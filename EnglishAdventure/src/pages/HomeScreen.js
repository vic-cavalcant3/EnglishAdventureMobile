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

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
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
        
        // Buscar dados de desempenho
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
      const response = await fetch(`${API_URL}/desempenho/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data.data);
        console.log('📊 Dados de desempenho:', data.data);
      } else {
        console.error('Erro ao buscar desempenho:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A67649" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {userData?.nome || 'aluno'}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Parabéns - DINÂMICO */}
        <View style={styles.congratsCard}>
          {performanceData && performanceData.ultimasQuestoes.total === 10 && 
           performanceData.ultimasQuestoes.acertos === 10 ? (
            <>
              <Text style={styles.congratsTitle}>Parabéns!</Text>
              <Text style={styles.congratsText}>
                Você acertou todas as 10{'\n'}
                últimas questões que fez
              </Text>
            </>
          ) : performanceData ? (
            <>
              <Text style={styles.congratsTitle}>Continue assim!</Text>
              <Text style={styles.congratsText}>
                Você acertou {performanceData.ultimasQuestoes.acertos} de {performanceData.ultimasQuestoes.total}{'\n'}
                últimas questões ({performanceData.ultimasQuestoes.percentual}%)
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.congratsTitle}>Comece agora!</Text>
              <Text style={styles.congratsText}>
                Ainda não há questões respondidas
              </Text>
            </>
          )}
        </View>

        {/* Card Confira seu desempenho */}
        <TouchableOpacity 
          style={styles.performanceCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Performance')}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Confira seu{'\n'}desempenho</Text>
            <Image 
              source={require('../../assets/desempenho.png')}
              style={styles.performanceImage}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/Hole.png')}
              style={styles.holeImage}
              resizeMode="contain"
            />
            <Text style={styles.cardSubtitle}>
              Cheque os seus avanços,{'\n'}
              dificuldades e dúvidas
            </Text>
          </View>
          <View style={styles.iconContainer}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Card Praticar */}
        <TouchableOpacity 
          style={styles.practiceCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Pratice')}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitleLight}>Praticar</Text>
            <Text style={styles.cardSubtitleLight}>
              Com base nos resultados,{'\n'}
              pratique para se tornar{'\n'}
              mais forte!
            </Text>
          </View>
          <View style={styles.iconContainerLight}>
            <Image 
              source={require('../../assets/book.png')}
              style={styles.bookImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {}}
        >
          <Image 
            source={require('../../assets/home.png')}
            style={styles.homeImage}
            resizeMode="contain"
          />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Image 
            source={require('../../assets/account.png')}
            style={styles.homeImage}
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
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  congratsCard: {
    backgroundColor: '#FFCCC7',
    borderRadius: 30,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 14,
    color: '#5A4A42',
    textAlign: 'center',
    lineHeight: 20,
  },
  performanceCard: {
    backgroundColor: '#3D2817',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
    minHeight: 280,
  },
  practiceCard: {
    backgroundColor: '#C49A6C',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 180,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    position: 'absolute',
    top: 5,
    right: -3,
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FDF0DB',
    marginBottom: 40,
    lineHeight: 32,
  },
  cardSubtitle: {
    position: 'absolute',
    bottom: -0,
    right: -25,
    fontSize: 15,
    color: '#EAD6B5',
    fontWeight: '600',
    lineHeight: 20,
  },
  cardTitleLight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  cardSubtitleLight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffff',
    position: 'absolute',
    bottom: 15,
    right: 30,
  },
  arrowIcon: {
    fontSize: 35,
    color: '#000',
    fontWeight: 'bold',
     position: 'absolute',
    bottom: 9,
    left: 13,
  },
  iconContainerLight: {
    width: 90,
    height: 90,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookIcon: {
    fontSize: 28,
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
  iconSquareActive: {
    width: 22,
    height: 22,
    backgroundColor: '#000000',
    borderRadius: 4,
    marginBottom: 4,
  },
  profileIcon: {
    alignItems: 'center',
    marginBottom: 4,
  },
  profileIconHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9E9E9E',
    marginBottom: 2,
  },
  profileIconBody: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#9E9E9E',
  },
  navText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  navTextActive: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  performanceImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
    position: 'absolute',
    left: 60,
    bottom: 130,
    color: '#EAD6B5',
  },

  holeImage: {
    bottom: -25,
    left: 89,
    position: 'absolute',
  },
  homeImage: {
    width: 24,
    height: 24,}
});