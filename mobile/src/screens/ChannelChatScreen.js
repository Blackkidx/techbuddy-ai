// mobile/src/screens/ChannelChatScreen.js
// ✅ Minimal Teal — Channel (Group) Chat with Attachments, Video, and Autolink

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, RefreshControl, Dimensions,
  Animated, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import supabase from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
import {
  fetchChannelMessages,
  sendChannelMessage,
  subscribeToChannel,
  uploadAttachment,
} from '../services/channelService';
import ChannelMessageBubble from '../components/ChannelMessageBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import ServerMembersSheet from '../components/ServerMembersSheet';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

// ==========================================
// Constants
// ==========================================
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MESSAGES_PER_PAGE = 50;
const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 48 : 32;
const INPUT_PADDING_BOTTOM = Platform.OS === 'ios' ? 24 : 8;

// ==========================================
// MAIN: Channel Chat Screen
// ==========================================
export default function ChannelChatScreen({ route }) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-60)).current;
  const inputFade = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(inputFade, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  // Fallback for route params if not provided
  const channelId = route?.params?.channelId;
  const channelName = route?.params?.channelName || 'Channel';
  const channelDescription = route?.params?.channelDescription || '';
  const serverId = route?.params?.serverId; // Retrieve serverId
  const myUserId = user?.id;

  // ==========================================
  // Load Messages
  // ==========================================
  const loadMessages = useCallback(async (isRefreshing = false) => {
    if (!channelId) return;
    if (!isRefreshing) setIsLoading(true);
    else setRefreshing(true);
    try {
      // In the future: pass MESSAGES_PER_PAGE to fetchChannelMessages
      const data = await fetchChannelMessages(channelId);
      setMessages(data);
    } catch (error) {
      console.error('❌ Failed to load channel messages:', error.message);
    } finally {
      if (!isRefreshing) setIsLoading(false);
      else setRefreshing(false);
    }
  }, [channelId]);

  // ==========================================
  // Realtime Subscription
  // ==========================================
  useEffect(() => {
    if (!channelId || !myUserId) return;
    loadMessages();

    const channel = subscribeToChannel(channelId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === newMsg._id)) return prev;
        const filtered = prev.filter(m =>
          !(m._id?.startsWith('temp_') && m.senderId === newMsg.senderId && m.text === newMsg.text)
        );
        return [newMsg, ...filtered];
      });
    });

    return () => { supabase.removeChannel(channel); };
  }, [channelId, myUserId, loadMessages]);

  // ==========================================
  // Send Message
  // ==========================================
  const animateSendButton = useCallback(() => {
    Animated.sequence([
      Animated.spring(sendButtonScale, { toValue: 0.8, friction: 3, useNativeDriver: true }),
      Animated.spring(sendButtonScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  }, [sendButtonScale]);

  const handleSend = useCallback(async (attachmentUrl = null, attachmentType = null) => {
    if (!inputMessage.trim() && !attachmentUrl) return;
    if (!channelId || !myUserId) return;

    animateSendButton();
    const messageContent = inputMessage.trim();
    const tempId = `temp_${Date.now()}`;

    const optimisticMessage = {
      _id: tempId, text: messageContent, createdAt: new Date(),
      senderId: myUserId, senderUsername: user?.user_metadata?.username || 'You',
      attachmentUrl, attachmentType,
      user: { _id: myUserId },
    };
    setMessages(prev => [optimisticMessage, ...prev]);
    setInputMessage('');
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    try {
      await sendChannelMessage(channelId, myUserId, messageContent || ' ', attachmentUrl, attachmentType);
    } catch (err) {
      console.error('❌ Send channel message error:', err.message);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      Alert.alert('Error', 'Failed to send message');
    }
  }, [inputMessage, channelId, myUserId, user, animateSendButton]);

  // ==========================================
  // Pick & Upload Attachment
  // ==========================================
  const handlePickAttachment = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileType = asset.type === 'video' ? 'video' : 'image';
      setUploading(true);
      const uploaded = await uploadAttachment(asset.uri, fileType);
      setUploading(false);
      await handleSend(uploaded.url, uploaded.type);
    } catch (error) {
      setUploading(false);
      console.error('❌ Attachment error:', error.message);
      Alert.alert('Error', 'Failed to upload attachment');
    }
  }, [handleSend]);

  // ==========================================
  // Render
  // ==========================================
  const renderMessageItem = ({ item, index }) => {
    const isMyMessage = item.user?._id === myUserId;
    return <ChannelMessageBubble item={item} isMyMessage={isMyMessage} index={index} />;
  };

  if (!channelId) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={80} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No Channel Selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.headerAnim, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.channelNameRow}>
              <Text style={styles.hashSymbol}>#</Text>
              <Text style={styles.channelName}>{channelName}</Text>
            </View>
            {channelDescription ? (
              <Text style={styles.channelDescription} numberOfLines={1}>{channelDescription}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.membersIcon} onPress={() => setIsMembersVisible(true)}>
            <Ionicons name="people" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
        extraData={COLORS}
            keyExtractor={(item) => item._id}
            renderItem={renderMessageItem}
            inverted
            style={styles.flex}
            contentContainerStyle={styles.messageList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMessages(true)} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyMessagesText}>
                  No messages yet.{'\n'}Be the first to say something!
                </Text>
              </View>
            )}
          />
        )}

        {/* Input Bar */}
        <Animated.View style={[styles.inputBar, { opacity: inputFade }]}>
          {uploading && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Uploading attachment...</Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton} onPress={handlePickAttachment} disabled={uploading}>
              <Ionicons name="attach" size={26} color={uploading ? COLORS.textDisabled : COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textDisabled}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
            />
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={{ opacity: (!inputMessage.trim() || uploading) ? 0.5 : 1 }}
                onPress={() => handleSend()}
                disabled={!inputMessage.trim() || uploading}
              >
                <View style={[styles.sendButton, { backgroundColor: inputMessage.trim() ? COLORS.primary : COLORS.surfaceLight }]}>
                  <Ionicons name="send" size={20} color={inputMessage.trim() ? '#fff' : COLORS.textDisabled} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Members Slide-out Sheet */}
      <ServerMembersSheet 
        visible={isMembersVisible} 
        onClose={() => setIsMembersVisible(false)} 
        serverId={serverId} 
      />
    </View>
  );
}

// ==========================================
// Styles
// ==========================================
const getStyles = (COLORS) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  headerAnim: { zIndex: 10 },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: HEADER_PADDING_TOP,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 8 },
  channelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hashSymbol: { fontSize: 18, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  channelName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  channelDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  membersIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 16 },
  messageList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  emptyState: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 24 },
  emptyMessages: { alignItems: 'center', padding: 32 },
  emptyMessagesText: {
    fontSize: 16, color: COLORS.textSecondary,
    marginTop: 12, textAlign: 'center',
  },
  inputBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingVertical: 8, paddingHorizontal: 16,
    paddingBottom: INPUT_PADDING_BOTTOM,
  },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8, paddingLeft: 8 },
  uploadingText: { fontSize: 12, color: COLORS.textSecondary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: COLORS.surfaceLight, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    fontSize: 16, color: COLORS.textPrimary,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
});
