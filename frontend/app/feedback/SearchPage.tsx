import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Button } from 'react-native';
import Layout from '../layout';
import { useRouter } from 'expo-router';
import { debounce } from 'lodash';

type Store = {
  id: number;
  name: string;
  location: string;
  contact: string;
  rating: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  available: boolean;
  image: string;
  store: Store;
};

const storeData: Store[] = [
  { id: 1, name: 'Auto Parts Store 1', location: '123 Main St, City, Country', contact: '+1234567890', rating: 4.5 },
  { id: 2, name: 'Speedy Auto Repairs', location: '456 Elm St, City, Country', contact: '+0987654321', rating: 3.9 },
  { id: 3, name: 'Parts and Service Hub', location: '789 Oak St, City, Country', contact: '+1122334455', rating: 4.7 },
  { id: 4, name: 'Engine Parts World', location: '123 Industrial Rd, City, Country', contact: '+1555555555', rating: 4.2 },
  { id: 5, name: 'Quick Fix Auto Service', location: '987 Maple St, City, Country', contact: '+1456789876', rating: 4.3 }
];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>(storeData);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const router = useRouter();

  const handleSearch = debounce(async () => {
    const fetchedData: Product[] = [
      { id: 1, name: 'Filter Oil', price: 45.99, available: true, image: 'https://example.com/images/brake_pads.jpg', store: storeData[0] },
      { id: 2, name: 'Filter Oil', price: 12.50, available: false, image: 'https://example.com/images/oil_filter.jpg', store: storeData[1] },
      { id: 3, name: 'Filter Oil', price: 25.99, available: true, image: 'https://example.com/images/headlight_bulb.jpg', store: storeData[2] }
    ];
    const filteredProducts = fetchedData.filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setProducts(filteredProducts);
  }, 300);

  const navigateToStoreProfile = (store: Store) => {
    router.push({
      pathname: '/feedback/StoreDetailsPage',
      params: { store: JSON.stringify(store) }, // Pass the entire store object
    });
  };

  const navigateToProductDetails = (product: Product) => {
    router.push({
      pathname: '/feedback/ProductDetailsPage',
      params: { product: JSON.stringify(product) }, // Pass the entire product object
    });
  };

  const filteredStores = stores
    .filter(store => store.rating >= 3)
    .sort((a, b) => sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating);

  return (
    <Layout>
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for spare parts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          accessibilityLabel="Search input for spare parts"
          accessibilityHint="Type the name of the spare part you are looking for"
        />

        {searchQuery === '' && (
          <View style={styles.buttonContainer}>
            <Button title="Sort Ascending" onPress={() => setSortOrder('asc')} />
            <Button title="Sort Descending" onPress={() => setSortOrder('desc')} />
          </View>
        )}

        {searchQuery === '' ? (
          <>
            <Text style={styles.storeTitle}>Nearby Stores</Text>
            {filteredStores.length === 0 ? (
              <Text style={styles.noResults}>No stores found.</Text>
            ) : (
              <FlatList
                data={filteredStores}
                renderItem={({ item }) => (
                  <StoreCard store={item} onPress={() => navigateToStoreProfile(item)} />
                )}
                keyExtractor={item => item.id.toString()}
              />
            )}
          </>
        ) : (
          <>
            <FlatList
              data={products}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => navigateToProductDetails(item)} />
              )}
              keyExtractor={item => item.id.toString()}
            />
            {products.length === 0 && (
              <Text style={styles.noResults}>No products found.</Text>
            )}
          </>
        )}
      </View>
    </Layout>
  );
};

const StoreCard = ({ store, onPress }: { store: Store; onPress: () => void }) => (
  <TouchableOpacity style={styles.storeCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Store: ${store.name}, Rating: ${store.rating}`}>
    <Text style={styles.storeName}>{store.name}</Text>
    <Text style={styles.storeLocation}>{store.location}</Text>
    <Text style={styles.storeContact}>{store.contact}</Text>
    <Text style={styles.storeRating}>Rating: {store.rating}</Text>
  </TouchableOpacity>
);

const ProductCard = ({ product, onPress }: { product: Product; onPress: () => void }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Product: ${product.name}, Price: $${product.price}`}>
    <Image source={{ uri: product.image }} style={styles.productImage} />
    <View style={styles.productDetails}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>${product.price}</Text>
      <Text style={styles.productAvailability}>{product.available ? 'In Stock' : 'Out of Stock'}</Text>
      <Text style={styles.productStore}>{product.store.name}</Text>
      <Text style={styles.productStoreLocation}>{product.store.location}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  searchBar: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingLeft: 15, marginBottom: 20, fontSize: 16 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  storeCard: { padding: 10, backgroundColor: 'white', borderRadius: 8, marginBottom: 10 },
  storeName: { fontSize: 16, fontWeight: 'bold' },
  storeLocation: { fontSize: 14, color: '#555' },
  storeContact: { fontSize: 14, color: '#555' },
  storeRating: { fontSize: 14, color: '#0000FF' },
  productCard: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderRadius: 8, marginBottom: 10 },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  productDetails: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productPrice: { fontSize: 14, color: '#28a745' },
  productAvailability: { fontSize: 12, color: '#dc3545' },
  productStore: { fontSize: 14, marginTop: 5 },
  productStoreLocation: { fontSize: 12, color: '#555' },
  noResults: { fontSize: 18, color: '#dc3545' },
});

export default SearchPage;