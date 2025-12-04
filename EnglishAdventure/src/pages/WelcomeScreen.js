import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ImageBackground,
  Image,
  SafeAreaView
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
  
  // Estado para dimensões dinâmicas
  const [layout, setLayout] = useState({ width, height });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2000);

    // Configurar modo de áudio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  // Função para tocar som
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/botao.mp3')
      );
      setSound(sound);
      await sound.playAsync();
      
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
    await playSound();
    setTimeout(() => {
      navigation.navigate('Login');
    }, 150);
  };

  const handleRegister = async () => {
    await playSound();
    setTimeout(() => {
      navigation.navigate('Cadastro');
    }, 150);
  };

  // Calcular dimensões responsivas
  const titleWidth = Math.min(360, layout.width * 0.9);
  const titleHeight = titleWidth * (200/360); // Mantém proporção
  
  const buttonWidth = Math.min(layout.width * 0.6, 300);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      <View style={styles.fullScreen} onLayout={handleLayout}>
        <ImageBackground 
          source={require('../../assets/welcome-bg.png')}
          style={[styles.background, { width: layout.width, height: layout.height }]}
          resizeMode="cover"
        >
          <View style={styles.container}>
            {/* Header com a imagem do título */}
            <View style={styles.header}>
              <Image 
                source={require('../../assets/title.png')}
                style={[
                  styles.titleImage, 
                  { 
                    width: titleWidth,
                    height: titleHeight,
                    maxWidth: 400,
                    maxHeight: 220
                  }
                ]} 
                resizeMode="contain"
              />
            </View>

            {showButtons && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={[styles.button, { width: buttonWidth }]}
                  onPress={handleLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.registerButton,
                    { width: buttonWidth }
                  ]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Cor de fallback caso a imagem não carregue
  },
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    marginRight: 60,
    marginBottom: 280, // Removido o marginBottom fixo
  },
  titleImage: {
    marginBottom: 10,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40, // Padding bottom responsivo
    marginTop: 'auto', // Empurra para baixo
  },
  button: {
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
    minWidth: 200,
  },
  registerButton: {
    backgroundColor: '#A67649',
  },
  buttonText: {
    color: '#000000',
    fontSize: 23,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerButtonText: {
    color: '#F8E3A4',
  },
});