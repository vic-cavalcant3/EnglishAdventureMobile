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
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.136.23.59:3000';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para edição
  const [editData, setEditData] = useState({
    nome: '',
    email: '',
    senha: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('userData');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserData(user);
        setEditData({
          nome: user.nome || '',
          email: user.email || '',
          senha: user.senha || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = {
        ...userData,
        nome: editData.nome,
        email: editData.email,
        senha: editData.senha
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      setUserData(updatedUser);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a conta');
            }
          }
        }
      ]
    );
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
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicture}>
            <Image 
              source={require('../../assets/viking.png')}
              style={styles.crownImage}
              resizeMode="contain"
            />
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.editPictureButton}>
              <Image 
                source={require('../../assets/edit.png')}
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Email Display */}
        <View style={styles.emailBadge}>
          <Text style={styles.emailBadgeText}>{userData?.email || '@email.com'}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Nome */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={editData.nome}
                onChangeText={(text) => setEditData({ ...editData, nome: text })}
                editable={isEditing}
                placeholder="@nome"
                placeholderTextColor="#999"
              />
              {isEditing && (
                <View style={styles.inputEditIcon}>
                  <Image 
                    source={require('../../assets/edit.png')}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={editData.email}
                onChangeText={(text) => setEditData({ ...editData, email: text })}
                editable={isEditing}
                placeholder="@email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {isEditing && (
                <View style={styles.inputEditIcon}>
                  <Image 
                    source={require('../../assets/edit.png')}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Senha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={editData.senha}
                onChangeText={(text) => setEditData({ ...editData, senha: text })}
                editable={isEditing}
                placeholder="senha"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />
              {!isEditing ? (
                <TouchableOpacity 
                  style={styles.eyeIconButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Image 
                    source={showPassword ? require('../../assets/eye.png') : require('../../assets/eyeclose.png')}
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.inputEditIcon}>
                  <Image 
                    source={require('../../assets/edit.png')}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Editar perfil</Text>
              <Image 
                source={require('../../assets/edit.png')}
                style={styles.buttonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Salvar dados</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteButtonText}>Excluir conta</Text>
            <Image 
              source={require('../../assets/trash.png')}
              style={styles.buttonIcon}
              resizeMode="contain"
            />
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
          onPress={() => {}}
        >
          <Image 
            source={require('../../assets/account.png')}
            style={styles.navImage}
            resizeMode="contain"
          />
          <Text style={styles.navTextActive}>Perfil</Text>
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
  profilePictureContainer: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3D2817',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownImage: {
    width: 60,
    height: 60,
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 40,
  },
  emailBadgeText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 30,
  },
  fieldContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 25,
  },
  fieldLabel: {
    marginRight: '80%',
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
  },
  inputWrapper: {
    width: '90%',
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  inputEditIcon: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -14 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 16,
    height: 16,
  },
  eyeIconButton: {
    position: 'absolute',
    right: 12,
    top: '40%',
    transform: [{ translateY: -12 }],
    padding: 5,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  actionButtons: {
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center',
    marginTop: 5,
  },
  editButton: {
    height: 30,
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 25,
    marginBottom: 15,
  },
  editButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    marginRight: 10,
  },
  saveButton: {
    height: 30,
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 25,
    marginBottom: 15,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  deleteButton: {
    width: '90%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    borderWidth: 1.5,
    borderColor: '#FF4444',
    borderRadius: 25,
    paddingVertical: 14,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#CC0000',
    fontWeight: '600',
    marginRight: 158,
  },
  buttonIcon: {
    width: 20,
    height: 20,
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
  navTextActive: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
});