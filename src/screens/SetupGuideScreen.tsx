import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface StepItemProps {
  stepNumber: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  codeSnippet?: string;
}

function StepCard({ stepNumber, icon, title, subtitle, badge, codeSnippet }: StepItemProps) {
  return (
    <View style={styles.stepCard}>
      {/* Top Meta Row: Step Pill + Badge + Icon */}
      <View style={styles.stepMetaRow}>
        <View style={styles.stepMetaLeft}>
          <View style={styles.stepNumberPill}>
            <Text style={styles.stepNumberText}>STEP {stepNumber}</Text>
          </View>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.stepIconBox}>
          <Feather name={icon} size={15} color={colors.amber} />
        </View>
      </View>

      {/* Step Title */}
      <Text style={styles.stepTitle}>{title}</Text>

      {/* Step Explanation */}
      <Text style={styles.stepSubtitle}>{subtitle}</Text>

      {/* Optional Highlight Box */}
      {codeSnippet && (
        <View style={styles.snippetBox}>
          <Feather name="wifi" size={14} color={colors.primaryLight} />
          <Text style={styles.snippetText} numberOfLines={1} ellipsizeMode="middle">
            {codeSnippet}
          </Text>
        </View>
      )}
    </View>
  );
}

function TipItem({ icon, title, desc }: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <Feather name={icon} size={15} color={colors.primaryLight} />
      </View>
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function SetupGuideScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Device Setup Guide</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Feather name="cpu" size={26} color={colors.amber} />
          </View>
          <Text style={styles.heroTitle}>Connect Your Controller</Text>
          <Text style={styles.heroSubtitle}>
            Follow these 4 simple steps to connect your ESP32 controller to your home Wi-Fi network without touching any code.
          </Text>
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>STEP-BY-STEP SETUP</Text>

          <StepCard
            stepNumber="1"
            icon="zap"
            title="Power On the Controller"
            subtitle="Plug in your ESP32 smart home unit. When the device has no Wi-Fi credentials saved, the status LED will blink slowly to indicate Setup Mode."
            badge="FIRST BOOT"
          />

          <StepCard
            stepNumber="2"
            icon="wifi"
            title="Connect to Setup Hotspot"
            subtitle="Open your phone or laptop Wi-Fi settings and connect to the temporary setup network:"
            codeSnippet="Homely-SmartHome-Setup"
          />

          <StepCard
            stepNumber="3"
            icon="globe"
            title="Select Your Home Wi-Fi"
            subtitle="The setup portal should open automatically. If not, open your browser and go to 192.168.4.1. Choose your 2.4 GHz network, enter your password, and tap Connect."
            codeSnippet="http://192.168.4.1"
          />

          <StepCard
            stepNumber="4"
            icon="check-circle"
            title="Open the Homely App"
            subtitle="Switch your phone back to your normal home Wi-Fi network. The Homely app will automatically discover and link to your device!"
            badge="ALL DONE"
          />
        </View>

        {/* Hardware Status LED Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>STATUS LED INDICATORS (ON-BOX DASHBOARD)</Text>
          <View style={styles.card}>
            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 1 — Wi-Fi &amp; Connection</Text>
                <Text style={styles.ledDesc}>
                  • Solid ON: Connected to your home Wi-Fi and online{'\n'}
                  • Fast Blinking: Connecting to network{'\n'}
                  • Slow Pulsing (all LEDs): Setup Mode (hotspot active)
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 2 — System Mode</Text>
                <Text style={styles.ledDesc}>Lit ON when in Auto Mode (sensors active), OFF in Manual Mode.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 3 — Porch Light</Text>
                <Text style={styles.ledDesc}>Lit ON when the Porch light is turned on.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 4 — Living Room Light</Text>
                <Text style={styles.ledDesc}>Lit ON when the Living Room lights are active.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 5 — Bedroom Light</Text>
                <Text style={styles.ledDesc}>Lit ON when the Bedroom light is turned on.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 6 — Bedroom Fan</Text>
                <Text style={styles.ledDesc}>Lit ON when the Bedroom ceiling fan is running.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.ledRow}>
              <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
              <View style={styles.ledTextCol}>
                <Text style={styles.ledTitle}>LED 7 — Motion Detector</Text>
                <Text style={styles.ledDesc}>Flashes instantly whenever motion is detected in the area.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Troubleshooting & Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>HELPFUL TIPS & TROUBLESHOOTING</Text>
          <View style={styles.card}>
            <TipItem
              icon="radio"
              title="2.4 GHz Wi-Fi Required"
              desc="ESP32 connects to standard 2.4 GHz Wi-Fi networks (5 GHz only bands are not supported by the hardware)."
            />
            <View style={styles.divider} />
            <TipItem
              icon="sliders"
              title="Manual IP Fallback"
              desc="If your router does not support mDNS name resolution, enter the ESP32 IP address in App Settings."
            />
            <View style={styles.divider} />
            <TipItem
              icon="refresh-cw"
              title="Changing Wi-Fi Network"
              desc="If you move or change your router, power on the controller. If it cannot find the network after 12 seconds, it automatically re-opens the setup hotspot."
            />
          </View>
        </View>

        {/* Bottom Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={16} color="#000" />
          <Text style={styles.doneBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl, paddingTop: spacing.lg },

  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },

  section: { gap: spacing.md },
  sectionHeading: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },

  stepCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stepNumberPill: {
    backgroundColor: colors.amber,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  stepNumberText: {
    color: '#000',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.amber,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  stepIconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    marginTop: 2,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  snippetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: 2,
  },
  snippetText: {
    color: colors.primaryLight,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    flex: 1,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  ledRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  ledDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  ledTextCol: { flex: 1, gap: 2 },
  ledTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  ledDesc: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 17,
  },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(56,189,248,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  tipContent: { flex: 1, gap: 2 },
  tipTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  tipDesc: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },

  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  doneBtnText: {
    color: '#000',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
});
