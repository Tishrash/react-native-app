import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Layout from '../layout';

const StoreRegistrationScreen = () => {
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable location access.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    };
    getLocation();
  }, []);

  const handleSubmit = async () => {
    if (!storeName || !storeType || !contactNumber || !email || !password || !confirmPassword || !location) {
      Alert.alert('Error', 'Please fill all fields and pick a location.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const formData = {
      store_name: storeName,
      store_type: storeType,
      store_description: storeDescription,
      contact_number: contactNumber,
      email: email,
      password: password,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    try {
      const response = await fetch('http://172.20.10.3:5001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server.');
    }
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Store Registration</Text>

        <Text style={styles.label}>Store Name</Text>
        <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />

        <Text style={styles.label}>Store Type</Text>
        <TextInput style={styles.input} value={storeType} onChangeText={setStoreType} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={storeDescription} onChangeText={setStoreDescription} />

        <Text style={styles.label}>Contact Number</Text>
        <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location ? location.latitude : 7.8731,
            longitude: location ? location.longitude : 80.7718,
            latitudeDelta: 2.5,
            longitudeDelta: 2.5,
          }}
          onPress={(event) => setLocation(event.nativeEvent.coordinate)}
        >
          {location && <Marker coordinate={location} title="Store Location" />}
        </MapView>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Register Store</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { alignSelf: 'flex-start', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  input: { width: '100%', borderWidth: 1, padding: 12, marginBottom: 10, borderRadius: 8 },
  map: { width: '100%', height: 300, borderRadius: 10, marginTop: 10 },
  submitButton: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 15 },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default StoreRegistrationScreen;