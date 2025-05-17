import { Text, View, StyleSheet, Image, Button, Platform } from 'react-native';
import { styles } from "../../styles/auth.styles";
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Layout from '../layout';

export default function Page1() {
  const [image, setImage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      uploadImage(result.assets[0].uri);
    }
  };

  // Function to capture an image using the camera
  const captureImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      uploadImage(result.assets[0].uri);
    }
  };

  // Function to upload the image
  const uploadImage = async (uri: string) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // Web: Convert URI to base64 before sending
      const base64String = uri.split(',')[1]; 
      formData.append('image', base64String);
    } else {
      // Mobile: Append file normally
      const file: any = {
        uri,
        name: 'image.jpg',
        type: 'image/jpeg',
      };
      formData.append('image', file);
    }

    try {
      const response = await axios.post('http://192.168.106.113:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadMessage('Image uploaded successfully!');
      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadMessage('Error uploading image');
    }
  };

  return (
    <Layout>
      <View style={[styles.container, { padding: 20, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { fontSize: 24, marginBottom: 30, textAlign: 'center', color: '#333' }]}>
          Damage Detection
        </Text>

        {/* Button to pick image from gallery */}
        <View style={{ marginBottom: 20, width: '80%' }}>
          <Button title="Upload Image" onPress={pickImage} color="#2196F3" />
        </View>

        {/* Button to capture image using the camera */}
        <View style={{ width: '80%' }}>
          <Button title="Capture Image" onPress={captureImage} color="#4CAF50" />
        </View>

        {/* Display selected or captured image */}
        {image && (
          <Image source={{ uri: image }} style={{ width: 250, height: 250, marginTop: 30, borderRadius: 20, borderWidth: 2, borderColor: '#ccc' }} />
        )}

        {/* Display upload status */}
        {uploadMessage && <Text>{uploadMessage}</Text>}
      </View>
    </Layout>
  );
}