// mobile/src/components/icons/SvgIcons.js
// ✅ Custom SVG Icon Components — replaces emoji throughout the app

import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../../theme';

// ========================================
// Save / Bookmark Icon (replaces 💾)
// ========================================
export const SaveIcon = ({ size = 24, color = COLORS.primary, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {filled ? (
      <Path
        d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4H5zm7 13l-4-4h2.5V8h3v4H16l-4 4z"
        fill={color}
      />
    ) : (
      <Path
        d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zM12 16l-4-4h2.5V8h3v4H16l-4 4zM14 3v4h4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

// ========================================
// Celebration / Confetti Icon (replaces 🎉)
// ========================================
export const CelebrationIcon = ({ size = 24, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.8 21l1.6-7L3 9.2l7.2-.6L13 2l2.8 6.6 7.2.6-4.4 4.8 1.6 7-6.2-4-6.2 4z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path d="M2 2l3 3M22 2l-3 3M12 1v3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// ========================================
// Globe / Language Icon (replaces 🌍)
// ========================================
export const GlobeIcon = ({ size = 24, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"
      stroke={color}
      strokeWidth={1.8}
    />
  </Svg>
);

// ========================================
// Heart Icon (replaces 💜)
// ========================================
export const HeartIcon = ({ size = 24, color = COLORS.primary, filled = true }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// Checkmark Circle (replaces ✅)
// ========================================
export const CheckCircleIcon = ({ size = 24, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ========================================
// Fire / Streak Icon (replaces 🔥)
// ========================================
export const FireIcon = ({ size = 24, color = '#F97316' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 23c-4.97 0-8-3.03-8-7 0-3.53 2.83-6.37 4-7.47.26-.25.7-.06.7.31v1.26c0 .89 1.08 1.34 1.71.71l3.18-3.18c.38-.38.59-.88.59-1.41V2.21c0-.45.54-.67.85-.35C18.37 5.19 20 8.69 20 12c0 6.08-3.03 11-8 11z"
      fill={color}
      opacity={0.9}
    />
  </Svg>
);

// ========================================
// Sparkle / AI Icon (replaces ✨ / 🤖)
// ========================================
export const SparkleIcon = ({ size = 24, color = COLORS.primaryLight }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.09 6.26L20 10.27l-4.91 3.82L16.18 21 12 17.27 7.82 21l1.09-6.91L4 10.27l5.91-2.01L12 2z"
      fill={color}
      stroke={color}
      strokeWidth={1}
      strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// Chat Bubble Icon (replaces 💬)
// ========================================
export const ChatBubbleIcon = ({ size = 24, color = COLORS.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// Trash / Delete Icon (replaces 🗑️)
// ========================================
export const TrashIcon = ({ size = 24, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// ========================================
// Book / Learn Icon (replaces 📚/🎓)
// ========================================
export const BookIcon = ({ size = 24, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// Bell / Notification Icon (replaces 🔔)
// ========================================
export const BellIcon = ({ size = 24, color = COLORS.primaryLight }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// Flag icons per language (replaces flag emojis)
// ========================================
export const ThaiFlag = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.66} viewBox="0 0 30 20">
    <Rect width="30" height="4" y="0" fill="#ED1C24" />
    <Rect width="30" height="4" y="4" fill="#FFFFFF" />
    <Rect width="30" height="4" y="8" fill="#241D4F" />
    <Rect width="30" height="4" y="12" fill="#FFFFFF" />
    <Rect width="30" height="4" y="16" fill="#ED1C24" />
  </Svg>
);

export const USFlag = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.66} viewBox="0 0 30 20">
    <G>
      {[...Array(13)].map((_, i) => (
        <Rect key={i} width="30" height={20/13} y={i * (20/13)} fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'} />
      ))}
    </G>
    <Rect width="12" height="10.77" fill="#3C3B6E" />
    <G fill="#FFFFFF">
      {[...Array(9)].map((_, r) => (
        [...Array(r % 2 === 0 ? 6 : 5)].map((_, c) => (
          <Circle key={`${r}-${c}`} cx={0.8 + c * 1.9 + (r % 2 === 0 ? 0 : 0.95)} cy={0.8 + r * 1.15} r="0.4" />
        ))
      ))}
    </G>
  </Svg>
);

export const JPFlag = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.66} viewBox="0 0 30 20">
    <Rect width="30" height="20" fill="#FFFFFF" />
    <Circle cx="15" cy="10" r="6" fill="#BC002D" />
  </Svg>
);

// ========================================
// Utility: get flag SVG by language code
// ========================================
export const getLanguageFlag = (langCode) => {
  switch (langCode) {
    case 'th': return <ThaiFlag />;
    case 'en': return <USFlag />;
    case 'jp':
    case 'ja': return <JPFlag />;
    default: return <GlobeIcon size={16} />;
  }
};
