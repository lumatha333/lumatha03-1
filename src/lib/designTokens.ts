/**
 * Lumatha Design System Tokens
 * 
 * Based on the refined UX specifications:
 * - 8px spacing grid
 * - 12-20px rounded corners
 * - Soft shadows
 * - Consistent elevations
 */

// ============ SPACING (8px grid) ============
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',    // Base unit
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ============ BORDER RADIUS ============
export const radius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// Component-specific radius recommendations:
// - Cards: 16px (lg)
// - Buttons: 12px (md) or 9999px (full) for pill
// - Inputs: 12px (md)
// - Avatars: 9999px (full) or 16px (lg)
// - Modals/Sheets: 24px (2xl) top, 20px (xl) all around

// ============ SHADOWS ============
export const shadows = {
  none: 'none',
  
  // Soft shadows for cards/elevated elements
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  
  // Colored glows (for interactive elements)
  glow: {
    primary: '0 0 20px rgba(124, 58, 237, 0.3)',
    success: '0 0 20px rgba(34, 197, 94, 0.3)',
    warning: '0 0 20px rgba(251, 191, 36, 0.3)',
    danger: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
  
  // Dark theme optimized
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  },
} as const;

// ============ ANIMATION TIMING ============
export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

export const easings = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// ============ Z-INDEX SCALE ============
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
  story: 10000,  // For story viewer
} as const;

// ============ TYPOGRAPHY SCALE ============
export const typography = {
  sizes: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============ COLORS (Lumatha Palette) ============
export const colors = {
  // Primary
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Main brand color
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Dark theme backgrounds
  dark: {
    bg: '#0a0f1e',
    elevated: '#111827',
    surface: '#1f2937',
    border: 'rgba(255, 255, 255, 0.1)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.4)',
    },
  },
  
  // Mood colors
  mood: {
    calm: '#3b82f6',
    energetic: '#f97316',
    creative: '#a855f7',
    happy: '#eab308',
    reflective: '#64748b',
    romantic: '#f43f5e',
  },
} as const;

// ============ COMPONENT TOKENS ============
export const components = {
  // Cards
  card: {
    borderRadius: radius.lg, // 16px
    padding: spacing[4], // 16px
    shadow: shadows.dark.md,
    hoverShadow: shadows.dark.lg,
  },
  
  // Buttons
  button: {
    borderRadius: {
      default: radius.md, // 12px
      pill: radius.full,
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[2]} ${spacing[4]}`,
      lg: `${spacing[3]} ${spacing[6]}`,
    },
  },
  
  // Inputs
  input: {
    borderRadius: radius.md, // 12px
    padding: spacing[3], // 12px
    height: '44px',
  },
  
  // Avatars
  avatar: {
    borderRadius: radius.full,
    sizes: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '56px',
      xl: '72px',
    },
  },
  
  // Sheets/Modals
  sheet: {
    borderRadius: {
      top: `${radius['2xl']} ${radius['2xl']} 0 0`,
      all: radius['2xl'],
    },
  },
} as const;

// ============ BREAKPOINTS ============
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============ UTILITY FUNCTIONS ============

/**
 * Generate spacing class string
 * @example spacingClass('px', 4) // "px-4" (16px)
 */
export function spacingClass(
  prefix: 'p' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'm' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr' | 'gap' | 'space-x' | 'space-y',
  value: keyof typeof spacing | number
): string {
  return `${prefix}-${value}`;
}

/**
 * Generate shadow style based on elevation
 */
export function getShadow(elevation: 'none' | 'sm' | 'md' | 'lg' | 'xl', isDark = true): string {
  if (elevation === 'none') return shadows.none;
  return isDark ? shadows.dark[elevation] : shadows[elevation];
}

/**
 * Generate transition string
 */
export function transition(
  properties: string[],
  duration: keyof typeof transitions = 'normal',
  easing: keyof typeof easings = 'default'
): string {
  return properties
    .map(prop => `${prop} ${transitions[duration]} ${easings[easing]}`)
    .join(', ');
}

/**
 * Generate glassmorphism styles
 */
export function glassmorphism(
  opacity = 0.1,
  blur = 10,
  saturation = 180
): React.CSSProperties {
  return {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
  };
}

// ============ TAILWIND CLASSES ============
export const tailwind = {
  // Spacing shortcuts
  gap: {
    1: 'gap-1',    // 4px
    2: 'gap-2',    // 8px
    3: 'gap-3',    // 12px
    4: 'gap-4',    // 16px
    6: 'gap-6',    // 24px
    8: 'gap-8',    // 32px
  },
  
  // Rounded shortcuts
  rounded: {
    sm: 'rounded-lg',    // 8px
    md: 'rounded-xl',    // 12px
    lg: 'rounded-2xl',   // 16px
    xl: 'rounded-[20px]',// 20px
    '2xl': 'rounded-3xl',// 24px
  },
  
  // Animation
  animate: {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    easeOut: 'ease-out',
  },
  
  // Common patterns
  card: 'bg-[#0a0f1e] rounded-2xl overflow-hidden',
  button: {
    primary: 'bg-white text-black rounded-xl font-semibold px-4 py-2',
    ghost: 'bg-white/10 text-white rounded-xl font-medium px-4 py-2 hover:bg-white/20',
  },
  input: 'bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/40',
  avatar: 'rounded-full object-cover border-2 border-white/10',
} as const;

// Export all as default
export default {
  spacing,
  radius,
  shadows,
  transitions,
  easings,
  zIndex,
  typography,
  colors,
  components,
  breakpoints,
  tailwind,
};
