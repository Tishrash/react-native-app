import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  Button,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Layout from '../layout';
import * as Animatable from 'react-native-animatable';

const StoreDetailsPage = () => {
  const { storeId } = useLocalSearchParams();
  const [parsedStore, setParsedStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [result, setResult] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'positive' | 'negative'>('positive');
  const [isAddProductModalVisible, setIsAddProductModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: true,
  });
  const [isEditStoreModalVisible, setIsEditStoreModalVisible] = useState(false);
  const [editedStore, setEditedStore] = useState({
    name: '',
    location: '',
    contact: '',
  });

  // Fetch store details from backend
  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const response = await fetch(`http://172.20.10.3:5001/store/${storeId}`);
        const data = await response.json();
        setParsedStore(data);
      } catch (error) {
        console.error('Error fetching store details:', error);
        Alert.alert('Error', 'Failed to fetch store details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreDetails();
  }, [storeId]);

  // Add product
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(`http://172.20.10.3:5001/store/${storeId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) throw new Error('Failed to add product');

      const data = await response.json();
      setParsedStore((prevStore) => ({
        ...prevStore,
        products: [...prevStore.products, data],
      }));

      setIsAddProductModalVisible(false);
      setNewProduct({ name: '', price: '', stock: true });
      Alert.alert('Success', 'Product added successfully!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  // Edit product
  const handleEditProduct = async (productId) => {
    // Implement edit product logic
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://172.20.10.3:5001/store/${storeId}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setParsedStore((prevStore) => ({
        ...prevStore,
        products: prevStore.products.filter((product) => product.id !== productId),
      }));

      Alert.alert('Success', 'Product deleted successfully!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to delete product.');
    }
  };

  // Edit store details
  const handleEditStore = async () => {
    try {
      const response = await fetch(`http://172.20.10.3:5001/store/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedStore),
      });

      if (!response.ok) throw new Error('Failed to update store details');

      const data = await response.json();
      setParsedStore(data);
      setIsEditStoreModalVisible(false);
      Alert.alert('Success', 'Store details updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update store details.');
    }
  };

  // Logout
  const handleLogout = () => {
    // Implement logout logic
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <Layout>
        <Text>Loading...</Text>
      </Layout>
    );
  }

  if (!parsedStore) {
    return (
      <Layout>
        <Text>Store not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>🔙 Go Back</Text>
        </TouchableOpacity>
      </Layout>
    );
  }

  const totalFeedback = parsedStore.feedback?.length || 0;
  const positiveFeedback =
    parsedStore.feedback?.filter((item) => item.sentiment === 'positive').length || 0;
  const negativeFeedback = totalFeedback - positiveFeedback;

  const feedbackPercentage = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
  const starRating = Math.round(feedbackPercentage / 20);
  const starSymbols = Array.from({ length: 5 }, (_, index) => (index < starRating ? '⭐' : '☆')).join('');

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>{parsedStore.name}</Text>
      <Text style={styles.detail}>📍 Location: {parsedStore.location}</Text>
      <Text style={styles.detail}>📞 Contact: {parsedStore.contact}</Text>
      <Text style={styles.detail}>⭐ Rating: {parsedStore.rating}</Text>

      <Text style={styles.subTitle}>Feedback Summary</Text>
      <Text style={styles.feedbackSummary}>
        Total Feedback: {totalFeedback} | Positive: {positiveFeedback} | Negative: {negativeFeedback}
      </Text>
      <Text style={styles.feedbackSummary}>Rating: {starSymbols} ({feedbackPercentage.toFixed(1)}%)</Text>

      <Text style={styles.subTitle}>Products</Text>
    </View>
  );

  const renderFooter = () => (
    <View>
      <Text style={styles.subTitle}>Add Your Feedback</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your feedback here..."
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <TouchableOpacity style={styles.feedbackButton} onPress={getPrediction}>
        <Text style={styles.feedbackText}>📝 Submit Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>🔙 Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Layout>
      <FlatList
        data={parsedStore.products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
              <Text style={[styles.stockStatus, { color: item.stock ? '#10B981' : '#EF4444' }]}>
                {item.stock ? 'In Stock' : 'Out of Stock'}
              </Text>
              <TouchableOpacity onPress={() => handleEditProduct(item.id)}>
                <Text style={styles.editText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
                <Text style={styles.deleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />

      {/* Add Product Modal */}
      <Modal visible={isAddProductModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Product</Text>
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Product Price"
            value={newProduct.price}
            onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
          />
          <View style={styles.switchContainer}>
            <Text>In Stock:</Text>
            <Switch
              value={newProduct.stock}
              onValueChange={(value) => setNewProduct({ ...newProduct, stock: value })}
            />
          </View>
          <TouchableOpacity style={styles.modalButton} onPress={handleAddProduct}>
            <Text style={styles.modalButtonText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => setIsAddProductModalVisible(false)}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Store Modal */}
      <Modal visible={isEditStoreModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Store Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Store Name"
            value={editedStore.name}
            onChangeText={(text) => setEditedStore({ ...editedStore, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={editedStore.location}
            onChangeText={(text) => setEditedStore({ ...editedStore, location: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Contact"
            value={editedStore.contact}
            onChangeText={(text) => setEditedStore({ ...editedStore, contact: text })}
          />
          <TouchableOpacity style={styles.modalButton} onPress={handleEditStore}>
            <Text style={styles.modalButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => setIsEditStoreModalVisible(false)}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Animated Popup */}
      {showPopup && (
        <Animatable.View
          animation="bounceIn"
          duration={1000}
          style={[
            styles.popupContainer,
            { backgroundColor: popupType === 'positive' ? '#10B981' : '#EF4444' },
          ]}
        >
          <Text style={styles.popupText}>{popupMessage}</Text>
        </Animatable.View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity style={styles.floatingButton} onPress={() => setIsAddProductModalVisible(true)}>
          <Text style={styles.floatingButtonText}>➕ Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={() => setIsEditStoreModalVisible(true)}>
          <Text style={styles.floatingButtonText}>✏️ Edit Store</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={handleLogout}>
          <Text style={styles.floatingButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#1E293B' },
  detail: { fontSize: 18, marginBottom: 5, color: '#475569' },
  subTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#1E293B' },

  productCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  productPrice: { fontSize: 16, color: '#64748B', marginVertical: 4 },
  stockStatus: { fontSize: 16, fontWeight: 'bold' },
  editText: { color: '#2563EB', marginTop: 5 },
  deleteText: { color: '#EF4444', marginTop: 5 },

  feedbackButton: {
    marginTop: 20,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  backButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  feedbackSummary: {
    fontSize: 16,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    height: 100,
    textAlignVertical: 'top',
  },

  popupContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E293B',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  floatingButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  floatingButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default StoreDetailsPage;