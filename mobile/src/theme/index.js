// mobile/src/theme/index.js
// Central export for all theme tokens

export { COLORS } from './colors';
export { TYPOGRAPHY, TEXT_STYLES } from './typography';
export { SPACING, RADIUS, ICON_SIZE } from './spacing';
export { SHADOWS } from './shadows';

// Re-export everything as a theme object
import { COLORS } from './colors';
import { TYPOGRAPHY, TEXT_STYLES } from './typography';
import { SPACING, RADIUS, ICON_SIZE } from './spacing';
import { SHADOWS } from './shadows';

export const theme = {
    colors: COLORS,
    typography: TYPOGRAPHY,
    textStyles: TEXT_STYLES,
    spacing: SPACING,
    radius: RADIUS,
    iconSize: ICON_SIZE,
    shadows: SHADOWS,
};

export default theme;
