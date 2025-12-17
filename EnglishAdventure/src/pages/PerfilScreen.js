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

const API_URL = 'http://192.168.0.125:3000';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para edição
  const [editData, setEditData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Buscar ID do usuário do AsyncStorage
      const userJson = await AsyncStorage.getItem('userData');
      if (!userJson) {
        Alert.alert('Erro', 'Usuário não autenticado');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const localUser = JSON.parse(userJson);
      console.log('👤 Usuário local:', localUser);

      // Buscar dados atualizados do banco
      const response = await fetch(`${API_URL}/usuario/${localUser.id}`);
      const data = await response.json();

      if (data.success) {
        console.log('✅ Dados do banco carregados:', data.user);
        
        setUserData(data.user);
        setEditData({
          nome: data.user.nome || '',
          email: data.user.email || '',
          senha: '', // Não mostrar senha por segurança
          telefone: data.user.telefone || ''
        });

        // Atualizar AsyncStorage com dados mais recentes
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      } else {
        throw new Error(data.message || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Validações
      if (!editData.nome.trim()) {
        Alert.alert('Atenção', 'Nome não pode estar vazio');
        return;
      }

      if (!editData.email.trim()) {
        Alert.alert('Atenção', 'Email não pode estar vazio');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        Alert.alert('Atenção', 'Email inválido');
        return;
      }

      // Se senha foi preenchida, validar
      if (editData.senha && editData.senha.length < 6) {
        Alert.alert('Atenção', 'Senha deve ter no mínimo 6 caracteres');
        return;
      }

      console.log('💾 Salvando perfil...', editData);

      // Enviar para o backend
      const response = await fetch(`${API_URL}/usuario/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: editData.nome,
          email: editData.email,
          senha: editData.senha || undefined, // Só envia se foi preenchida
          telefone: editData.telefone
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Perfil atualizado com sucesso');

        // Atualizar estado local
        setUserData(data.user);
        
        // Atualizar AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        // Limpar campo de senha
        setEditData({ ...editData, senha: '' });
        
        setIsEditing(false);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      } else {
        throw new Error(data.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar os dados');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurar dados originais
    setEditData({
      nome: userData.nome || '',
      email: userData.email || '',
      senha: '',
      telefone: userData.telefone || ''
    });
    setIsEditing(false);
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
        <Text style={styles.loadingText}>Carregando perfil...</Text>
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
                placeholder="Seu nome"
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
                placeholder="seu@email.com"
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
          {/* Senha */}
{/* Senha */}
<View style={styles.fieldContainer}>
  <Text style={styles.fieldLabelsenha}>
    {isEditing ? 'Nova Senha (opcional)' : 'Senha'}
  </Text>
  <View style={styles.inputWrapper}>
    <TextInput
      style={[styles.input, !isEditing && styles.inputDisabled]}
      value={isEditing ? editData.senha : '••••••••'}
      onChangeText={(text) => setEditData({ ...editData, senha: text })}
      editable={isEditing}
      placeholder={isEditing ? "Deixe vazio para manter" : ""}
      placeholderTextColor="#999"
      secureTextEntry={isEditing ? !showPassword : false}
    />
    {isEditing && (
      <>
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
        <View style={styles.inputEditIcon}>
          <Image 
            source={require('../../assets/edit.png')}
            style={styles.editIcon}
            resizeMode="contain"
          />
        </View>
      </>
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
            <View style={styles.editingButtons}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar dados</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
    marginBottom: 8,
  },

  fieldLabelsenha : {
    marginRight: '-28',
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 8,
    width: '100%',
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
    right: 15,
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
    right: 10,
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
    height: 50,
    width: '90%',
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
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    marginRight: 10,
  },
  editingButtons: {
    width: '90%',
    marginBottom: 15,
  },
  saveButton: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 25,
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  cancelButton: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 25,
  },
  cancelButtonText: {
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
    marginRight: 10,
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