// mobile/src/components/CustomToast.js
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';

const TOAST_TYPES = {
    success: {
        gradient: COLORS.successGradient,
        icon: 'checkmark-circle',
        title: 'Success',
    },
    error: {
        gradient: COLORS.errorGradient,
        icon: 'close-circle',
        title: 'Error',
    },
    warning: {
        gradient: COLORS.warningGradient,
        icon: 'warning',
        title: 'Warning',
    },
    info: {
        gradient: COLORS.infoGradient,
        icon: 'information-circle',
        title: 'Info',
    },
};

const CustomToast = ({ visible, message, type = 'info', onHide, duration = 3000 }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show animation with spring physics
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Progress bar animation
            if (duration > 0) {
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: false,
                }).start();

                // Auto hide
                const timer = setTimeout(() => {
                    hideToast();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            progressAnim.setValue(0);
            if (onHide && visible) onHide();
        });
    };

    if (!visible) return null;

    const config = TOAST_TYPES[type] || TOAST_TYPES.info;
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={config.icon} size={24} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{config.title}</Text>
                        <Text style={styles.message} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                {/* Progress bar */}
                {duration > 0 && (
                    <View style={styles.progressContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: progressWidth,
                                },
                            ]}
                        />
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: SPACING.base,
        right: SPACING.base,
        zIndex: 9999,
        ...SHADOWS.lg,
    },
    gradient: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.base,
    },
    iconContainer: {
        marginRight: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...TEXT_STYLES.bodyMedium,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        ...TEXT_STYLES.small,
        color: '#fff',
        opacity: 0.95,
    },
    closeButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    progressContainer: {
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
    },
});

export default CustomToast;
