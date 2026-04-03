// mobile/src/components/AttachmentBubble.js
// ✅ Image thumbnails (full-screen modal) + Video player via expo-video

import React, { useState } from 'react';
import {
  View, TouchableOpacity, Modal,
  Dimensions, ActivityIndicator,
  StyleSheet, Platform, Text,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// Video Component (separate to use hook correctly)
// ==========================================
function VideoPlayer({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

// ==========================================
// Main AttachmentBubble
// ==========================================
export default function AttachmentBubble({ attachmentUrl, attachmentType }) {
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!attachmentUrl) return null;

  // ---- Image ----
  if (attachmentType === 'image') {
    return (
      <>
        <TouchableOpacity
          onPress={() => setFullScreenVisible(true)}
          activeOpacity={0.85}
          style={styles.imageContainer}
        >
          {imageLoading && (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
          <Image
            source={{ uri: attachmentUrl }}
            style={styles.thumbnailImage}
            contentFit="cover"
            transition={300}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>

        {/* Full-screen viewer */}
        <Modal
          visible={fullScreenVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFullScreenVisible(false)}
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: attachmentUrl }}
              style={styles.fullScreenImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        </Modal>
      </>
    );
  }

  // ---- Video ----
  if (attachmentType === 'video') {
    return <VideoPlayer uri={attachmentUrl} />;
  }

  // ---- Fallback ----
  return (
    <View style={styles.fileBubble}>
      <Ionicons name="document-outline" size={20} color={COLORS.primary} />
      <Text style={styles.fileText} numberOfLines={1}>Attachment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: SCREEN_WIDTH * 0.6,
    position: 'relative',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 1,
  },
  thumbnailImage: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 4,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  videoContainer: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: SCREEN_WIDTH * 0.6,
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.4,
  },
  fileBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
  },
  fileText: {
    fontSize: 13,
    color: '#2C3E50',
    flex: 1,
  },
});
