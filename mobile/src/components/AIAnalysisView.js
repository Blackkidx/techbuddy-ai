// mobile/src/components/AIAnalysisView.js
// ✅ Premium AI Analysis with Dark Theme & Beautiful Animations

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { submitFeedback } from '../services/feedbackService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========================================
// COLORS - Dark Purple Theme
// ========================================
const COLORS = {
    // Backgrounds
    background: '#0f0a1a',
    surface: '#1a1425',
    surfaceLight: '#251e35',
    card: '#2d2540',

    // Primary
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',

    // Text
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',

    // Intent Gradients
    INTENT: {
        Problem: ['#ff6b6b', '#ee5a5a'],
        Question: ['#4facfe', '#00f2fe'],
        Update: ['#43e97b', '#38f9d7'],
        Request: ['#fa709a', '#fee140'],
        Chat: ['#a78bfa', '#8b5cf6'],
    },

    // Status
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
};

// ========================================
// TOAST NOTIFICATION Component
// ========================================
const Toast = ({ visible, message, type = 'success', onHide }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after 2.5 seconds
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => onHide && onHide());
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const bgColors = type === 'success'
        ? [COLORS.success, '#059669']
        : [COLORS.error, '#dc2626'];

    return (
        <Animated.View style={[
            styles.toastContainer,
            { transform: [{ translateY }], opacity }
        ]}>
            <LinearGradient colors={bgColors} style={styles.toastGradient}>
                <Ionicons
                    name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color="#fff"
                />
                <Text style={styles.toastText}>{message}</Text>
            </LinearGradient>
        </Animated.View>
    );
};

// ========================================
// SKELETON LOADER - Improved
// ========================================
function SkeletonLoader() {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.bezier(0.4, 0, 0.6, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.bezier(0.4, 0, 0.6, 1),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    return (
        <View style={styles.skeletonContainer}>
            <Animated.View style={[styles.skeletonBadge, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { opacity }]} />
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
        </View>
    );
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function AIAnalysisView({
    intent,
    confidence,
    translation,
    technicalTerms = [],
    messageId,
    userId,
    isMyMessage = false,
    sourceLanguage,
    targetLanguage,
    originalMessage
}) {
    const [expanded, setExpanded] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [feedbackType, setFeedbackType] = useState(null);
    const [correctionText, setCorrectionText] = useState('');
    const [selectedIntent, setSelectedIntent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedbackGiven, setFeedbackGiven] = useState({ intent: null, translation: null });

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Subtle pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isLoading]);

    // Toggle expand animation
    const toggleExpand = () => {
        const toValue = expanded ? 0 : 1;
        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue,
                friction: 8,
                tension: 50,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
                toValue,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
        setExpanded(!expanded);
    };

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    if (isLoading || (!intent && !translation && technicalTerms.length === 0)) {
        return <SkeletonLoader />;
    }

    const intentGradient = COLORS.INTENT[intent] || COLORS.INTENT.Chat;
    const confidencePercent = confidence ? Math.round(confidence * 100) : 0;

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // ========================================
    // HANDLERS
    // ========================================
    const handleFeedbackPositive = async (type) => {
        try {
            await submitFeedback({
                user_id: userId,
                message_id: messageId,
                feedback_type: type,
                original_text: originalMessage || '',
                ai_prediction: type === 'translation' ? translation : intent,
                user_correction: null,
                is_correct: true,
                source_language: sourceLanguage,
                target_language: targetLanguage
            });
            setFeedbackGiven(prev => ({ ...prev, [type]: true }));
            showToast('Thanks for your feedback! 🎉', 'success');
        } catch (error) {
            showToast('Failed to submit feedback', 'error');
        }
    };

    const handleFeedbackNegative = (type) => {
        setFeedbackType(type);
        setFeedbackModalVisible(true);
    };

    const submitCorrection = async () => {
        if (feedbackType === 'intent' && !selectedIntent) {
            showToast('Please select the correct intent', 'error');
            return;
        }
        if (feedbackType === 'translation' && !correctionText.trim()) {
            showToast('Please enter your correction', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await submitFeedback({
                user_id: userId,
                message_id: messageId,
                feedback_type: feedbackType,
                original_text: originalMessage || '',
                ai_prediction: feedbackType === 'translation' ? translation : intent,
                user_correction: feedbackType === 'intent' ? selectedIntent : correctionText,
                is_correct: false,
                source_language: sourceLanguage,
                target_language: targetLanguage
            });

            setFeedbackGiven(prev => ({ ...prev, [feedbackType]: false }));
            showToast('Correction submitted! Thank you 🙏', 'success');
            setFeedbackModalVisible(false);
            setCorrectionText('');
            setSelectedIntent('');
        } catch (error) {
            showToast('Failed to submit correction', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================
    // RENDER FEEDBACK BUTTONS
    // ========================================
    const renderFeedbackButtons = (type) => {
        const given = feedbackGiven[type];

        if (given !== null) {
            return (
                <View style={styles.feedbackGiven}>
                    <Ionicons
                        name={given ? "checkmark-circle" : "create-outline"}
                        size={14}
                        color={given ? COLORS.success : COLORS.warning}
                    />
                    <Text style={[styles.feedbackGivenText, { color: given ? COLORS.success : COLORS.warning }]}>
                        {given ? 'Thanks!' : 'Noted'}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.feedbackBtns}>
                <TouchableOpacity
                    onPress={() => handleFeedbackPositive(type)}
                    style={styles.feedbackIconBtn}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={[COLORS.success, '#059669']}
                        style={styles.feedbackIconGradient}
                    >
                        <Ionicons name="thumbs-up" size={12} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleFeedbackNegative(type)}
                    style={styles.feedbackIconBtn}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={[COLORS.error, '#dc2626']}
                        style={styles.feedbackIconGradient}
                    >
                        <Ionicons name="thumbs-down" size={12} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    // ========================================
    // RENDER
    // ========================================
    return (
        <>
            {/* Toast Notification */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />

            <Animated.View style={[
                styles.container,
                isMyMessage ? styles.containerMy : styles.containerFriend,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                    ],
                }
            ]}>
                {/* Glassmorphism Background */}
                <View style={styles.glassContainer}>
                    {/* Header - Always visible */}
                    <TouchableOpacity
                        style={styles.header}
                        onPress={toggleExpand}
                        activeOpacity={0.8}
                    >
                        {/* Intent Badge */}
                        <LinearGradient
                            colors={intentGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.intentBadge}
                        >
                            <Ionicons name="sparkles" size={10} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.intentText}>{intent || 'Chat'}</Text>
                        </LinearGradient>

                        {/* Confidence Badge */}
                        {confidence > 0 && (
                            <View style={styles.confidenceBadge}>
                                <Text style={styles.confidenceText}>{confidencePercent}%</Text>
                            </View>
                        )}


                        {/* Expand Icon */}
                        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Expanded Content */}
                    {expanded && (
                        <Animated.View style={styles.expandedContent}>
                            {/* Translation Section */}
                            {translation && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <LinearGradient
                                            colors={['#4facfe', '#00f2fe']}
                                            style={styles.sectionIcon}
                                        >
                                            <Ionicons name="language" size={12} color="#fff" />
                                        </LinearGradient>
                                        <Text style={styles.sectionTitle}>Translation</Text>
                                        {sourceLanguage && targetLanguage && (
                                            <View style={styles.langBadge}>
                                                <Text style={styles.langText}>
                                                    {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        {renderFeedbackButtons('translation')}
                                    </View>
                                    <Text style={styles.translationContent}>"{translation}"</Text>
                                </View>
                            )}

                            {/* Technical Terms */}
                            {technicalTerms.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <LinearGradient
                                            colors={['#fa709a', '#fee140']}
                                            style={styles.sectionIcon}
                                        >
                                            <Ionicons name="code-slash" size={12} color="#fff" />
                                        </LinearGradient>
                                        <Text style={styles.sectionTitle}>Tech Terms</Text>
                                    </View>
                                    <View style={styles.termsRow}>
                                        {technicalTerms.map((term, index) => (
                                            <LinearGradient
                                                key={index}
                                                colors={[COLORS.primary, COLORS.primaryDark]}
                                                style={styles.termChip}
                                            >
                                                <Text style={styles.termChipText}>{term}</Text>
                                            </LinearGradient>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Intent Feedback */}
                            {intent && (
                                <View style={styles.intentFeedbackRow}>
                                    <Text style={styles.intentFeedbackLabel}>Is this intent correct?</Text>
                                    {renderFeedbackButtons('intent')}
                                </View>
                            )}

                            {/* AI Badge */}
                            <View style={styles.aiBranding}>
                                <Ionicons name="sparkles" size={10} color={COLORS.textMuted} />
                                <Text style={styles.aiBrandingText}>Powered by TechBuddy AI</Text>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </Animated.View>

            {/* ========================================
                FEEDBACK MODAL - Premium Design
            ======================================== */}
            <Modal
                visible={feedbackModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFeedbackModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={styles.modalContent}>
                        {/* Modal Header */}
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.modalHeader}
                        >
                            <Ionicons name="create" size={24} color="#fff" />
                            <Text style={styles.modalTitle}>
                                {feedbackType === 'intent' ? 'Correct Intent' : 'Correct Translation'}
                            </Text>
                        </LinearGradient>

                        <View style={styles.modalBody}>
                            {/* Current AI Prediction */}
                            <View style={styles.currentPrediction}>
                                <Text style={styles.currentLabel}>AI predicted:</Text>
                                <LinearGradient
                                    colors={COLORS.INTENT[intent] || COLORS.INTENT.Chat}
                                    style={styles.currentBadge}
                                >
                                    <Text style={styles.currentBadgeText}>
                                        {feedbackType === 'translation' ? translation : intent}
                                    </Text>
                                </LinearGradient>
                            </View>

                            {/* Intent Selector */}
                            {feedbackType === 'intent' && (
                                <View style={styles.intentOptions}>
                                    <Text style={styles.selectLabel}>Select correct intent:</Text>
                                    {['Problem', 'Question', 'Update', 'Request', 'Chat'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[
                                                styles.intentOption,
                                                selectedIntent === opt && styles.intentOptionSelected
                                            ]}
                                            onPress={() => setSelectedIntent(opt)}
                                        >
                                            <View style={[
                                                styles.radioOuter,
                                                selectedIntent === opt && styles.radioOuterSelected
                                            ]}>
                                                {selectedIntent === opt && <View style={styles.radioInner} />}
                                            </View>
                                            <LinearGradient
                                                colors={COLORS.INTENT[opt]}
                                                style={styles.optionBadge}
                                            >
                                                <Text style={styles.optionBadgeText}>{opt}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Translation Input */}
                            {feedbackType === 'translation' && (
                                <View style={styles.translationInput}>
                                    {sourceLanguage && targetLanguage && (
                                        <View style={styles.langContext}>
                                            <View style={styles.langContextRow}>
                                                <Text style={styles.langContextLabel}>Original ({sourceLanguage.toUpperCase()}):</Text>
                                                <Text style={styles.langContextText}>{originalMessage}</Text>
                                            </View>
                                        </View>
                                    )}
                                    <Text style={styles.selectLabel}>Your correction:</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={`Enter correct ${targetLanguage?.toUpperCase() || ''} translation...`}
                                        placeholderTextColor={COLORS.textMuted}
                                        value={correctionText}
                                        onChangeText={setCorrectionText}
                                        multiline
                                        autoFocus
                                    />
                                </View>
                            )}
                        </View>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setFeedbackModalVisible(false);
                                    setCorrectionText('');
                                    setSelectedIntent('');
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={submitCorrection}
                                disabled={submitting}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.submitBtn}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={16} color="#fff" />
                                            <Text style={styles.submitBtnText}>Submit</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
    // Toast
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Skeleton
    skeletonContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    skeletonBadge: {
        width: 70,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.card,
    },
    skeletonText: {
        width: 50,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.card,
        flex: 1,
    },
    skeletonIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.card,
    },

    // Container
    container: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    containerMy: {
        alignSelf: 'flex-end',
    },
    containerFriend: {
        alignSelf: 'flex-start',
    },

    // Glass Container
    glassContainer: {
        backgroundColor: 'rgba(45, 37, 64, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        overflow: 'hidden',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    intentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    intentText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Confidence Badge
    confidenceBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    confidenceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },


    // Expanded Content
    expandedContent: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },

    // Section
    section: {
        marginTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    sectionIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },
    langBadge: {
        backgroundColor: 'rgba(79, 172, 254, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    langText: {
        color: '#4facfe',
        fontSize: 10,
        fontWeight: '700',
    },
    translationContent: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 20,
        marginLeft: 32,
    },

    // Terms
    termsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginLeft: 32,
    },
    termChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    termChipText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Intent Feedback Row
    intentFeedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    intentFeedbackLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },

    // Feedback Buttons
    feedbackBtns: {
        flexDirection: 'row',
        gap: 8,
    },
    feedbackIconBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    feedbackIconGradient: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    feedbackGiven: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    feedbackGivenText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // AI Branding
    aiBranding: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 12,
        paddingTop: 8,
    },
    aiBrandingText: {
        color: COLORS.textMuted,
        fontSize: 10,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalBody: {
        padding: 20,
    },

    // Current Prediction
    currentPrediction: {
        alignItems: 'center',
        marginBottom: 20,
    },
    currentLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 8,
    },
    currentBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    // Intent Options
    intentOptions: {
        gap: 10,
    },
    selectLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    intentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 12,
    },
    intentOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    optionBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
    },
    optionBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // Translation Input
    translationInput: {
        gap: 12,
    },
    langContext: {
        backgroundColor: COLORS.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    langContextRow: {
        gap: 4,
    },
    langContextLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '600',
    },
    langContextText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    textInput: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 16,
        color: COLORS.textPrimary,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },

    // Modal Actions
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        backgroundColor: COLORS.card,
    },
    cancelBtnText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
