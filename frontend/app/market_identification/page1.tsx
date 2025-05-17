import { Text, View, StyleSheet, Button } from 'react-native'
import {styles} from "../../styles/auth.styles";
import React from 'react'
import Layout from '../layout';

export default function Page1() {
  return (
    <Layout>
    <View style={styles.container}>
      <Text style={styles.title}>Market Identification</Text>
    </View>
    </Layout>
  )
}
