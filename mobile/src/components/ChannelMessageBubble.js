// mobile/src/components/ChannelMessageBubble.js
// Animated channel message bubble — extracted from ChannelChatScreen

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Autolink from 'react-native-autolink';
import AttachmentBubble from './AttachmentBubble';
import { COLORS } from '../theme/colors';

const ChannelMessageBubble = memo(({ item, isMyMessage, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isMyMessage ? 50 : -50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const delay = Math.min(index * 50, 300);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, delay,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0, friction: 8, tension: 40, delay, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 6, tension: 50, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const timeString = new Date(item.createdAt).toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Animated.View style={[
      styles.wrapper,
      {
        alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      },
    ]}>
      {isMyMessage ? (
        <View>
          <View style={styles.myBubble}>
            {item.text ? (
              <Autolink
                text={item.text}
                style={styles.myText}
                linkStyle={styles.myLink}
              />
            ) : null}
            <AttachmentBubble
              attachmentUrl={item.attachmentUrl}
              attachmentType={item.attachmentType}
              isMyMessage
            />
            <Text style={styles.myTime}>{timeString}</Text>
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.senderName}>
            {item.senderUsername || 'Unknown'}
          </Text>
          <View style={styles.theirBubble}>
            {item.text ? (
              <Autolink
                text={item.text}
                style={styles.theirText}
                linkStyle={styles.theirLink}
              />
            ) : null}
            <AttachmentBubble
              attachmentUrl={item.attachmentUrl}
              attachmentType={item.attachmentType}
              isMyMessage={false}
            />
            <Text style={styles.theirTime}>{timeString}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '85%',
    marginVertical: 4,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  myText: {
    fontSize: 16,
    color: '#fff',
  },
  myLink: {
    color: '#E8F6F3',
    textDecorationLine: 'underline',
  },
  myTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    marginTop: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
    marginLeft: 4,
  },
  theirBubble: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  theirText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  theirLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  theirTime: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default ChannelMessageBubble;
