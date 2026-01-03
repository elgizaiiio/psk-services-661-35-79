import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  useTelegramBackButton();

  return (
    <>
      <Helmet>
        <title>Privacy Policy | BOLT Mining</title>
        <meta name="description" content="BOLT Mining Privacy Policy - How we collect and use your data." />
      </Helmet>

      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-5"
          >
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect the following information when you use BOLT Mining:
              </p>
              <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                <li>Telegram ID and username</li>
                <li>First and last name from Telegram</li>
                <li>Profile photo URL</li>
                <li>Mining activity and token balances</li>
                <li>Referral relationships</li>
                <li>Task completion history</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
              <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                <li>Provide and improve our services</li>
                <li>Process mining rewards and referral bonuses</li>
                <li>Send notifications about your account</li>
                <li>Prevent fraud and abuse</li>
                <li>Analyze usage patterns to improve the app</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">3. Notifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may send you notifications through Telegram about mining sessions, rewards, 
                and updates. You can stop notifications by sending /mute to our bot.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell your personal data. We may share anonymized analytics with partners. 
                Your username may appear on leaderboards if you opt-in to contests.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your data. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We retain your data as long as your account is active. 
                You can request account deletion by contacting support.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
              <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                <li>Access your personal data</li>
                <li>Request data correction</li>
                <li>Request account deletion</li>
                <li>Opt-out of notifications (/mute)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">8. Third-Party Services</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use Telegram for authentication and messaging. 
                Please review Telegram's privacy policy for their data practices.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For privacy-related inquiries, contact us through @boltcomm on Telegram.
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
              Last updated: January 2026
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
