import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/config'; // ✨ Import config

export default function AddFriendModal({ visible, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(null); // Track which user we're sending request to

  // ====================================
  // Search Users
  // ====================================
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    try {
      setSearching(true);
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(
        `${API_ENDPOINTS.USERS.SEARCH}?q=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSearchResults(response.data.users || []);

      if (response.data.users.length === 0) {
        Alert.alert('No Results', 'No users found');
      }

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  // ====================================
  // Send Friend Request
  // ====================================
  const handleAddFriend = async (user) => {
    // Check if already friends
    if (user.isFriend) {
      Alert.alert('Already Friends', `You are already friends with ${user.username}`);
      return;
    }

    // Check if request already sent
    if (user.friendshipStatus === 'PENDING') {
      Alert.alert('Request Sent', 'Friend request already sent');
      return;
    }

    try {
      setSending(user.id);
      const token = await AsyncStorage.getItem('token');

      await axios.post(
        API_ENDPOINTS.FRIENDS.ADD,
        { friendId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success! 🎉',
        `Friend request sent to ${user.username}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Update search results
              setSearchResults(prev =>
                prev.map(u =>
                  u.id === user.id
                    ? { ...u, friendshipStatus: 'PENDING' }
                    : u
                )
              );
              
              // Notify parent to refresh
              if (onSuccess) onSuccess();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Add friend error:', error);
      const message = error.response?.data?.message || 'Failed to send friend request';
      Alert.alert('Error', message);
    } finally {
      setSending(null);
    }
  };

  // ====================================
  // Get Button Text & Style
  // ====================================
  const getButtonConfig = (user) => {
    if (user.isFriend) {
      return {
        text: '✓ Friends',
        style: styles.friendButton,
        disabled: true
      };
    }
    
    if (user.friendshipStatus === 'PENDING') {
      return {
        text: '⏳ Pending',
        style: styles.pendingButton,
        disabled: true
      };
    }

    return {
      text: '+ Add Friend',
      style: styles.addButton,
      disabled: false
    };
  };

  // ====================================
  // Render User Item
  // ====================================
  const renderUserItem = ({ item }) => {
    const buttonConfig = getButtonConfig(item);
    const isSending = sending === item.id;

    return (
      <View style={styles.userItem}>
        {/* Avatar */}
        <View style={styles.avatar}>
          {item.avatarUrl ? (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Ionicons name="person-circle" size={50} color="#ccc" />
          )}
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userId}>{item.userId}</Text>
          <Text style={styles.language}>
            {item.nativeLanguage} → {item.learningLanguage}
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.actionButton, buttonConfig.style]}
          onPress={() => handleAddFriend(item)}
          disabled={buttonConfig.disabled || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{buttonConfig.text}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ====================================
  // Clear Search
  // ====================================
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  // ====================================
  // Main Render
  // ====================================
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Friend</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ID, username, or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {searching ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.resultsHeader}>
                  Found {searchResults.length} user{searchResults.length > 1 ? 's' : ''}
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'Search for friends'}
                </Text>
                <Text style={styles.emptySubtext}>
                  Enter a user ID, username, or email
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ====================================
// Styles
// ====================================
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  language: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  friendButton: {
    backgroundColor: '#4CAF50',
  },
  pendingButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});