export type ThemeId = 'sunset' | 'matcha' | 'berry' | 'ocean' | 'midnight';
export type BgPatternId = 'dots' | 'grid' | 'clean' | 'custom';
export type WashiTapeStyle = 'soft' | 'colorful' | 'pattern' | 'none';
export type SoundProfile = 'pop' | 'bubble' | 'arcade';
export type FontMood = 'modern' | 'handwriting' | 'rounded';
export type CelebrationFx = 'confetti' | 'fireworks' | 'stars' | 'none';
export type NoteColor = 'auto' | 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'white';
export type NoteColorMode = 'column' | 'priority' | 'custom';
export type PinStyle = 'pin' | 'paperclip' | 'woodpeg' | 'magnet' | 'tape';
export type CompletionStamp = 'SELESAI!' | 'LUNAS' | 'APPROVED' | 'MANTAP! 👍' | 'DONE ✓' | 'none';
export type StampColor = 'red' | 'green' | 'blue' | 'purple' | 'gold';
export type ViewDensity = 'cozy' | 'compact';
export type SortByOption = 'manual' | 'priority' | 'dueDate' | 'title';
export type DeskBuddyType = 'cat' | 'dog' | 'plant' | 'coffee' | 'none';

export interface ColumnSetting {
  title: string;
  subtitle: string;
  emoji: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string; // 'purple' | 'pink' | 'amber' | 'emerald' | 'sky' | 'rose' | 'indigo' | 'teal'
}

export interface UserPreferences {
  appName: string;
  customLogoUrl: string | null;
  appIconPreset: string;
  appBadgeText: string;
  userName: string;
  boardTitle: string;
  boardIcon: string;
  dailyMotto: string;
  theme: ThemeId;
  bgPattern: BgPatternId;
  customBgUrl: string | null; // Base64 data URL for custom board wallpaper
  bgDim: number; // 0 to 80 percent dim
  bgBlur: number; // 0 to 10 px blur
  avatarIcon: string;
  washiTapeStyle: WashiTapeStyle;
  soundProfile: SoundProfile;
  fontMood: FontMood;
  celebrationFx: CelebrationFx;
  // Point 4: Sticky Note Paper Color Personalization
  noteColorMode: NoteColorMode;
  // Point 5: Gamification & Daily Goals
  dailyTargetGoal: number; // e.g. 4
  rewardNote: string; // e.g. "Beli Es Kopi Susu! ☕"
  rewardClaimedDate: string | null; // Tracks if reward was claimed today
  customCategories: CustomCategory[];
  columns: {
    TODO: ColumnSetting;
    IN_PROGRESS: ColumnSetting;
    DONE: ColumnSetting;
  };
  // New: Physical Aesthetics & Pins
  pinStyle: PinStyle;
  completionStamp: CompletionStamp;
  stampColor: StampColor;
  // New: View Density & Sorting
  viewDensity: ViewDensity;
  sortBy: SortByOption;
  // New: Desk Buddy Mascot & Custom Footer
  deskBuddy: DeskBuddyType;
  footerText: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  previewColors: [string, string, string];
  bgClass: string;
  bgHex: string;
  dotColor: string;
  cardBg: string;
  headerBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentGradient: string;
  accentTextGradient: string;
  primaryButton: string;
  focusRing: string;
  isDark: boolean;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  icon: string;
  desc: string;
  columns: {
    TODO: ColumnSetting;
    IN_PROGRESS: ColumnSetting;
    DONE: ColumnSetting;
  };
}
