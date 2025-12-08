// src/components/MessageBubble.js

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FeedbackButton from './FeedbackButton';
import FeedbackModal from './FeedbackModal';

const MessageBubble = ({ message, isCurrentUser, userId }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // แสดงปุ่ม Feedback เฉพาะข้อความที่มี AI prediction
  const showFeedbackButton = !isCurrentUser && message.intent;

  const getIntentColor = (intent) => {
    const colors = {
      Request: '#4CAF50',
      Problem: '#F44336',
      Question: '#2196F3',
      Update: '#FF9800',
    };
    return colors[intent] || '#999';
  };

  const getIntentEmoji = (intent) => {
    const emojis = {
      Request: '🙏',
      Problem: '⚠️',
      Question: '❓',
      Update: '📢',
    };
    return emojis[intent] || '💬';
  };

  return (
    <>
      <View style={[
        styles.container,
        isCurrentUser ? styles.currentUser : styles.otherUser
      ]}>
        {/* Message Content */}
        <Text style={[
          styles.messageText,
          isCurrentUser && styles.currentUserText
        ]}>
          {message.content}
        </Text>

        {/* AI Prediction Badge */}
        {message.intent && (
          <View style={[
            styles.intentBadge,
            { backgroundColor: getIntentColor(message.intent) + '20' }
          ]}>
            <Text style={styles.intentEmoji}>
              {getIntentEmoji(message.intent)}
            </Text>
            <Text style={[
              styles.intentText,
              { color: getIntentColor(message.intent) }
            ]}>
              {message.intent}
            </Text>
            {message.confidence && (
              <Text style={styles.confidenceText}>
                {Math.round(message.confidence * 100)}%
              </Text>
            )}
          </View>
        )}

        {/* Feedback Button */}
        {showFeedbackButton && (
          <FeedbackButton onPress={() => setModalVisible(true)} />
        )}
      </View>

      {/* Feedback Modal */}
      {showFeedbackButton && (
        <FeedbackModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          message={message}
          aiPrediction={message.intent}
          userId={userId}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  currentUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  otherUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  intentEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  intentText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 10,
    color: '#666',
  },
});

export default MessageBubble;