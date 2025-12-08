// mobile/src/screens/ChatScreen.js
// ✅ MODERNIZED VERSION - Using AIAnalysisView Component

import React, { useState, useEffect, useCallback, useContext, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SocketContext } from '../contexts/SocketContext';
import { AuthContext } from '../contexts/AuthContext';
import { getMessages } from '../services/api_helper';
import { getFriendUserId } from '../utils/friendHelpers';
import AIAnalysisView from '../components/AIAnalysisView';  // ✅ ใช้ Component ที่มีอยู่
import { COLORS, SPACING, RADIUS, TEXT_STYLES } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ Animated Message Bubble with AIAnalysisView
const AnimatedMessageBubble = memo(({ item, isMyMessage, index, userId }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isMyMessage ? 50 : -50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const delay = Math.min(index * 50, 300);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const timeString = new Date(item.createdAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if message has AI analysis
  const hasAIAnalysis = item.id && (item.intent || item.translation || (item.technicalTerms && item.technicalTerms.length > 0));

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.friendMessageContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {isMyMessage ? (
        <View>
          <LinearGradient
            colors={COLORS.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.myBubble]}
          >
            <Text style={styles.myMessageText}>{item.text}</Text>
            <Text style={styles.myTimeInline}>{timeString}</Text>
          </LinearGradient>

          {/* ✅ AIAnalysisView - แยกออกมาด้านนอก bubble */}
          {hasAIAnalysis && (
            <AIAnalysisView
              intent={item.intent}
              confidence={item.confidence}
              translation={item.translation}
              technicalTerms={item.technicalTerms || []}
              messageId={item.id}
              userId={userId}
              isMyMessage={isMyMessage}
              sourceLanguage={item.sourceLanguage}
              targetLanguage={item.targetLanguage}
              originalMessage={item.text}
            />
          )}
        </View>
      ) : (
        <View>
          <View style={[styles.bubble, styles.friendBubble]}>
            <Text style={styles.friendMessageText}>{item.text}</Text>
            <Text style={styles.friendTimeInline}>{timeString}</Text>
          </View>

          {/* ✅ AIAnalysisView - แยกออกมาด้านนอก bubble */}
          {hasAIAnalysis && (
            <AIAnalysisView
              intent={item.intent}
              confidence={item.confidence}
              translation={item.translation}
              technicalTerms={item.technicalTerms || []}
              messageId={item.id}
              userId={userId}
              isMyMessage={isMyMessage}
              sourceLanguage={item.sourceLanguage}
              targetLanguage={item.targetLanguage}
              originalMessage={item.text}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
});

// ✅ Animated Typing Indicator
const AnimatedTypingIndicator = memo(({ friendUsername }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bubbleScale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const animateDot = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]).start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, []);

  const dotStyle = (anim) => ({
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
      })
    }],
  });

  return (
    <Animated.View style={[styles.typingContainer, { transform: [{ scale: bubbleScale }] }]}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
        <Text style={styles.typingText}>{friendUsername} is typing</Text>
      </View>
    </Animated.View>
  );
});

// ✅ Loading Spinner
const LoadingSpinner = memo(() => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="sync" size={40} color={COLORS.primary} />
    </Animated.View>
  );
});

export default function ChatScreen({ route, navigation }) {
  const { socketService, isConnected } = useContext(SocketContext);
  const { user, loading: authLoading, checkAuth } = useContext(AuthContext);
  const flatListRef = useRef(null);
  const socketServiceRef = useRef(socketService);
  const typingTimer = useRef(null);
  const lastTypingEmit = useRef(0);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-60)).current;
  const inputFade = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    socketServiceRef.current = socketService;
  }, [socketService]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(inputFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [myUserIntId, setMyUserIntId] = useState(null);  // ✅ Integer ID for feedback
  const [userError, setUserError] = useState(false);

  const friendParam = route.params?.friend || null;
  const friendUserId = getFriendUserId(friendParam);
  const friendUsername = friendParam?.username || 'Unknown User';

  const loadMessages = useCallback(async (isRefreshing = false) => {
    if (!friendUserId) return;

    if (!isRefreshing) setIsLoading(true);
    else setRefreshing(true);

    try {
      const response = await getMessages(friendUserId);
      const newMessages = response.messages.map(msg => ({
        ...msg,
        _id: msg.id,
        text: msg.content,
        createdAt: new Date(msg.createdAt),
        user: { _id: msg.senderId },
        intent: msg.intent,
        confidence: msg.confidence,
        translation: msg.translation,
        technicalTerms: msg.technicalTerms || [],
        sourceLanguage: msg.sourceLanguage,
        targetLanguage: msg.targetLanguage,
      })).reverse();

      setMessages(newMessages);
    } catch (error) {
      console.error('❌ Failed to load messages:', error.message);
    } finally {
      if (!isRefreshing) setIsLoading(false);
      else setRefreshing(false);
    }
  }, [friendUserId]);

  const handleNewMessage = useCallback((newMessage) => {
    if (newMessage.senderId === friendUserId || newMessage.receiverId === friendUserId) {
      setMessages(prevMessages => {
        if (newMessage.id && prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }

        const tempIndex = prevMessages.findIndex(msg =>
          msg.tempId && newMessage.tempId && msg.tempId === newMessage.tempId
        );

        if (tempIndex !== -1) {
          const updated = [...prevMessages];
          updated[tempIndex] = {
            ...newMessage,
            _id: newMessage.id,
            id: newMessage.id,
            text: newMessage.content,
            createdAt: new Date(newMessage.createdAt || Date.now()),
            user: { _id: newMessage.senderId },
            intent: newMessage.intent,
            confidence: newMessage.confidence,
            translation: newMessage.translation,
            technicalTerms: newMessage.technicalTerms || [],
            sourceLanguage: newMessage.sourceLanguage,
            targetLanguage: newMessage.targetLanguage,
          };
          return updated;
        }

        const formattedMessage = {
          ...newMessage,
          _id: newMessage.id || newMessage.tempId,
          id: newMessage.id,
          text: newMessage.content,
          createdAt: new Date(newMessage.createdAt || Date.now()),
          user: { _id: newMessage.senderId },
          intent: newMessage.intent,
          confidence: newMessage.confidence,
          translation: newMessage.translation,
          technicalTerms: newMessage.technicalTerms || [],
          sourceLanguage: newMessage.sourceLanguage,
          targetLanguage: newMessage.targetLanguage,
        };
        return [formattedMessage, ...prevMessages];
      });

      if (newMessage.senderId === friendUserId && myUserId) {
        socketServiceRef.current.markAsRead(newMessage.id, friendUserId);
      }
    }
  }, [friendUserId, myUserId]);

  const handleTypingStatus = useCallback((status) => {
    if (status.userId === friendUserId) {
      setIsTyping(status.isTyping);
    }
  }, [friendUserId]);

  const handleMessageRead = useCallback(() => { }, []);

  const handleTextChange = (text) => {
    setInputMessage(text);
    if (!friendUserId || !myUserId) return;

    const now = Date.now();
    if (text.length > 0 && now - lastTypingEmit.current > 2500) {
      socketServiceRef.current.typingStart(friendUserId);
      lastTypingEmit.current = now;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);

    if (text.length > 0) {
      typingTimer.current = setTimeout(() => {
        socketServiceRef.current.typingStop(friendUserId);
        lastTypingEmit.current = 0;
      }, 3000);
    } else {
      socketServiceRef.current.typingStop(friendUserId);
      lastTypingEmit.current = 0;
    }
  };

  const animateSendButton = () => {
    Animated.sequence([
      Animated.spring(sendButtonScale, {
        toValue: 0.8,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSend = useCallback(() => {
    if (!inputMessage.trim() || !friendUserId) return;

    animateSendButton();

    const messageContent = inputMessage.trim();
    const tempId = `temp_${Date.now()}`;

    socketServiceRef.current.sendMessage({
      receiverId: friendUserId,
      content: messageContent,
      tempId: tempId,
      language: 'th'
    });

    const optimisticMessage = {
      _id: tempId,
      tempId: tempId,
      text: messageContent,
      createdAt: new Date(),
      senderId: myUserId,
      receiverId: friendUserId,
      status: 'sending',
      user: { _id: myUserId },
    };

    setMessages(prevMessages => [optimisticMessage, ...prevMessages]);
    setInputMessage('');

    if (typingTimer.current) clearTimeout(typingTimer.current);
    socketServiceRef.current.typingStop(friendUserId);
    lastTypingEmit.current = 0;

    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [inputMessage, friendUserId, myUserId]);

  const handleRetryUser = async () => {
    setIsLoading(true);
    setUserError(false);
    await checkAuth();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (authLoading) return;

      let userId = user?.userId;
      let userIntId = user?.id;  // ✅ Integer ID for feedback

      if (!userId) {
        try {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userId = parsedUser?.userId || parsedUser?.id;
            userIntId = parsedUser?.id;  // ✅ Get integer ID
          }
        } catch (err) {
          console.error('❌ Failed to recover user:', err);
        }
      }

      if (isMounted) {
        if (userId) {
          setMyUserId(userId);
          setMyUserIntId(userIntId);
          setUserError(false);
        } else {
          setMyUserId(null);
          setMyUserIntId(null);
          setUserError(true);
        }
      }
    };

    fetchUser();
    return () => { isMounted = false; };
  }, [user, authLoading]);

  useEffect(() => {
    if (friendUserId && myUserId) {
      loadMessages();
    }

    if (isConnected && socketServiceRef.current) {
      socketServiceRef.current.on('message:new', handleNewMessage);
      socketServiceRef.current.on('typing:status', handleTypingStatus);
      socketServiceRef.current.on('message:read', handleMessageRead);
    }

    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.off('message:new', handleNewMessage);
        socketServiceRef.current.off('typing:status', handleTypingStatus);
        socketServiceRef.current.off('message:read', handleMessageRead);
      }
    };
  }, [isConnected, friendUserId, myUserId, loadMessages, handleNewMessage, handleTypingStatus, handleMessageRead]);

  const renderMessageItem = ({ item, index }) => {
    const isMyMessage = item.user._id === myUserId;
    const isSystemMessage = item.senderId === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <AnimatedMessageBubble
        item={item}
        isMyMessage={isMyMessage}
        index={index}
        userId={myUserIntId}  // ✅ Pass integer ID for feedback
      />
    );
  };

  const renderFooter = () => {
    if (isTyping) {
      return <AnimatedTypingIndicator friendUsername={friendUsername} />;
    }
    return null;
  };

  if (userError && !authLoading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
        <Text style={styles.emptyTitle}>Authentication Error</Text>
        <Text style={styles.emptyText}>Could not identify your user profile.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetryUser}>
          <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButtonGradient}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (authLoading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Verifying...</Text>
      </LinearGradient>
    );
  }

  if (!friendUserId) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={80} color={COLORS.text.tertiary} />
        <Text style={styles.emptyTitle}>No Chat Selected</Text>
        <Text style={styles.emptyText}>Select a friend to start chatting.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('FriendList')}>
          <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButtonGradient}>
            <Ionicons name="people-outline" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Go to Friends</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerFade,
          transform: [{ translateY: headerSlide }]
        }
      ]}>
        <LinearGradient colors={COLORS.primaryGradient} style={styles.headerGradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{friendUsername.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{friendUsername}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.online : COLORS.offline }]} />
                <Text style={styles.statusText}>
                  {isTyping ? 'typing...' : (isConnected ? 'Online' : 'Offline')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessageItem}
            inverted
            style={styles.chatList}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadMessages(true)}
                tintColor={COLORS.primary}
              />
            }
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <Animated.View style={[styles.inputContainer, { opacity: inputFade }]}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.text.disabled}
              value={inputMessage}
              onChangeText={handleTextChange}
              multiline
            />
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputMessage.trim()}
              >
                <LinearGradient
                  colors={inputMessage.trim() ? COLORS.primaryGradient : [COLORS.surfaceLight, COLORS.surfaceLight]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color={inputMessage.trim() ? "#fff" : COLORS.text.disabled} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    zIndex: 10,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.base,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TEXT_STYLES.bodyMedium,
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    ...TEXT_STYLES.small,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
  },

  // Empty/Error
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyTitle: {
    ...TEXT_STYLES.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
  },
  emptyText: {
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  retryButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: '#fff',
  },

  // Messages
  messageContainer: {
    maxWidth: SCREEN_WIDTH * 0.85,
    marginVertical: SPACING.xs,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  friendMessageContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
  },
  myBubble: {
    borderBottomRightRadius: RADIUS.sm,
  },
  friendBubble: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  myMessageText: {
    ...TEXT_STYLES.body,
    color: '#fff',
  },
  friendMessageText: {
    ...TEXT_STYLES.body,
    color: COLORS.text.primary,
  },
  myTimeInline: {
    ...TEXT_STYLES.xs,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  friendTimeInline: {
    ...TEXT_STYLES.xs,
    color: COLORS.text.tertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // System Message
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
  },
  systemMessageText: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },

  // Typing
  typingContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: SPACING.sm,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  typingText: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
  },

  // Input
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    ...TEXT_STYLES.body,
    color: COLORS.text.primary,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
