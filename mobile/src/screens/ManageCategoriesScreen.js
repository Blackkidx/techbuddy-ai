// mobile/src/screens/ManageCategoriesScreen.js
// ✅ Minimal Teal — Manage Categories (Owner/Admin Only)

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchServerCategories, createCategory, updateCategory, deleteCategory } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function ManageCategoriesScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serverId) loadCategories();
  }, [serverId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchServerCategories(serverId);
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    Alert.prompt(
      'New Category',
      'Enter category name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create', 
          onPress: async (name) => {
            if (!name?.trim()) return;
            try {
              setLoading(true);
              await createCategory(serverId, name);
              loadCategories();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to create category');
              setLoading(false);
            }
          } 
        }
      ],
      'plain-text'
    );
  };

  const handleEdit = (category) => {
    Alert.prompt(
      'Rename Category',
      'Enter new category name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async (name) => {
            if (!name?.trim() || name === category.name) return;
            try {
              setLoading(true);
              await updateCategory(category.id, name);
              loadCategories();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to update category');
              setLoading(false);
            }
          } 
        }
      ],
      'plain-text',
      category.name
    );
  };

  const handleDelete = (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? ALL channels inside it will also be deleted!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteCategory(category.id);
              loadCategories();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete category');
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const renderCategory = ({ item }) => (
    <View style={styles.categoryRow}>
      <Ionicons name="folder-outline" size={24} color={COLORS.textTertiary} />
      <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="pencil" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleCreateNew}>
           <Ionicons name="add" size={26} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
        extraData={COLORS}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 40}}>
              <Text style={{color: COLORS.textSecondary}}>No categories found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  addBtn: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 16, paddingHorizontal: 16 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border
  },
  categoryName: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
});
