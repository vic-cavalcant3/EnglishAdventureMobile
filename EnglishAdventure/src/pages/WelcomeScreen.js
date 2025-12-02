import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ImageBackground,
  Image 
} from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [showButtons, setShowButtons] = useState(false);
  const [sound, setSound] = useState();
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2000);

    // ✅ Configurar modo de áudio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      clearTimeout(timer);
      // Limpar som ao desmontar o componente
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // 🔊 FUNÇÃO PARA TOCAR SOM
  const playSound = async () => {
    try {
      console.log('🔊 Tocando som...');
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/botao.mp3')
      );
      setSound(sound);
      await sound.playAsync();
      
      // Descarregar o som após tocar (opcional)
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('❌ Erro ao tocar som:', error);
    }
  };

  const handleLogin = async () => {
    await playSound(); // 🔊 Tocar som
    console.log('Login pressed');
    
    // Pequeno delay para o som tocar antes de navegar
    setTimeout(() => {
      navigation.navigate('Login');
    }, 150);
  };

  const handleRegister = async () => {
    await playSound(); // 🔊 Tocar som
    console.log('Register pressed');
    
    // Pequeno delay para o som tocar antes de navegar
    setTimeout(() => {
      navigation.navigate('Cadastro');
    }, 150);
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require('../../assets/welcome-bg.png')}
        style={[styles.background, { width, height }]}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {/* Header com a imagem do título */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/title.png')}
              style={styles.titleImage} 
              resizeMode="contain"
            />
          </View>

          {showButtons && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.registerButton]}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.registerButtonText]}>
                  Cadastrar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 500,
    marginRight: 40,
  },
  titleImage: {
    marginRight: 10,
    marginBottom: 20,
    width: 360,
    height: 200,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
  },
  button: {
    width: '60%',
    height: 50,
    backgroundColor: '#F8E3A4',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registerButton: {
    backgroundColor: '#A67649',
  },
  buttonText: {
    color: '#000000',
    fontSize: 23,
    fontWeight: '600',
  },
  registerButtonText: {
    color: '#F8E3A4',
  },
});