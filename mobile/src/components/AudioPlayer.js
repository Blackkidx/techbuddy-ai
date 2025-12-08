// mobile/src/components/AudioPlayer.js (ฉบับแก้ไขสมบูรณ์)

import React, { useState, useEffect, useRef } from 'react'; 
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/config'; 

/**
 * 🔊 Audio Player Component
 */

const AudioPlayer = ({ audioUrl, size = 'medium', style }) => {
  // ********** ✅ FIXED 1: ลบตัวแปร sound ที่ไม่ได้ใช้งาน **********
  // const [sound, setSound] = useState(null); // ลบทิ้ง
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref ยังคงอยู่ (ใช้จัดการ Sound Object ใน Native Callback)
  const soundRef = useRef(null); 
  // ***************************************************************

  /**
   * Callback when playback status changes
   */
  const onPlaybackStatusUpdate = (status) => {
    
    if (status.didJustFinish) {
      console.log('✅ Sound finished playing');
      setIsPlaying(false);
      
      const currentSound = soundRef.current; 
      
      // ✅ FIXED 2: Guarded Call (ใช้ soundRef.current ที่ถูกต้อง)
      if (currentSound && status.isLoaded) { 
          currentSound.stopAsync();
          currentSound.setPositionAsync(0);
          console.log('🔇 Stop and Rewind successful');
      }
    }

    if (status.error) {
      console.error('❌ Playback error:', status.error);
      setIsPlaying(false);
      
      const currentSound = soundRef.current;
      if (currentSound) {
        currentSound.unloadAsync(); 
        // 🚩 ไม่ต้องเรียก setSound(null) แล้ว
        soundRef.current = null;
      }
      Alert.alert('Playback Error', 'An error occurred during audio playback.');
    }
  };


  // Cleanup sound on unmount (Runs when component is destroyed)
  useEffect(() => {
    return () => {
      // 🚩 ใช้ Ref ในการ Unload เพื่อป้องกันการเข้าถึง State ที่ถูกทำลาย
      if (soundRef.current) {
        console.log('🔇 Unloading sound...');
        soundRef.current.unloadAsync(); 
        soundRef.current = null;
      }
    };
  }, []); // 🚩 Empty dependency array เนื่องจากใช้ Ref

  /**
   * เล่นเสียง
   */
  const playSound = async () => {
    try {
      setIsLoading(true);
      
      const currentSound = soundRef.current;

      if (currentSound) {
        const status = await currentSound.getStatusAsync();
        
        if (status.isPlaying) {
          setIsLoading(false);
          return;
        }

        // 1. ถ้าหยุดอยู่ ให้ Rewind กลับไปที่ 0 ก่อนเล่นใหม่
        if (status.positionMillis > 0 || status.didJustFinish) {
          await currentSound.setPositionAsync(0); 
        }
        
        await currentSound.playAsync();
        setIsPlaying(true);
        setIsLoading(false);
        console.log('✅ Playing sound (Repeat)');
        return;
      }
      
      // 2. Load and play new sound (First Load)
      console.log('🔊 Loading audio:', audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      // ********** ✅ FIXED 3: กำหนด Callback ให้กับ sound object **********
      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      // *******************************************************************
      
      // 🚩 FIXED 4: ใช้ Ref ในการเก็บค่า
      // setSound(newSound); // ไม่จำเป็นต้องใช้ setSound แล้ว
      soundRef.current = newSound; // สำหรับใช้ใน Native Callback
      
      setIsPlaying(true);
      setIsLoading(false);
      
      console.log('✅ Playing sound (First time)');
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      setIsLoading(false);
      setIsPlaying(false);
      
      Alert.alert(`Playback Failed`, `ไม่สามารถเล่นเสียงได้: ${error.message || 'กรุณาลองอีกครั้ง'}`);
    }
  };

  /**
   * หยุดเสียง
   */
  const pauseSound = async () => {
    try {
      const currentSound = soundRef.current;
      if (currentSound) {
        console.log('⏸️ Pausing sound');
        await currentSound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌ Error pausing sound:', error);
    }
  };

  /**
   * Toggle play/pause
   */
  const handlePress = () => {
    if (!audioUrl) {
      console.warn('⚠️ No audio URL provided');
      return;
    }

    if (isPlaying) {
      pauseSound();
    } else {
      playSound();
    }
  };

  // Get button size based on prop
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, iconSize: 20 };
      case 'large':
        return { width: 70, height: 70, iconSize: 35 };
      case 'medium':
      default:
        return { width: 56, height: 56, iconSize: 28 };
    }
  };

  const { width, height, iconSize } = getButtonSize();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width, height, borderRadius: width / 2 },
        style,
      ]}
      onPress={handlePress}
      disabled={isLoading || !audioUrl}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons
          name={isPlaying ? 'pause' : 'volume-high'}
          size={iconSize}
          color="#fff"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.THAI.SECONDARY, 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default AudioPlayer;