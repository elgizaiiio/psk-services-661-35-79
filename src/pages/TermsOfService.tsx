import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  useTelegramBackButton();

  return (
    <>
      <Helmet>
        <title>Terms of Service | BOLT Mining</title>
        <meta name="description" content="BOLT Mining Terms of Service and User Agreement." />
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
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
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
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By accessing and using BOLT Mining, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BOLT Mining is a virtual mining simulation platform where users can earn BOLT tokens 
                through various activities including mining sessions, completing tasks, and referrals.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">3. User Eligibility</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You must be at least 18 years old to use this service. By using BOLT Mining, 
                you represent that you meet this age requirement.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">4. Account Responsibility</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are responsible for maintaining the security of your account. 
                Any activity under your account is your responsibility. 
                Do not share your account credentials with others.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">5. Prohibited Activities</h2>
              <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                <li>Using bots, scripts, or automated tools</li>
                <li>Creating multiple accounts</li>
                <li>Fraudulent referrals or fake accounts</li>
                <li>Exploiting bugs or vulnerabilities</li>
                <li>Harassment of other users</li>
                <li>Any illegal activities</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">6. Token Value</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BOLT tokens are virtual assets within our platform. Their value may fluctuate 
                and is not guaranteed. We are not responsible for any financial losses.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">7. Service Modifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the service at any time 
                without prior notice. We may also update these terms periodically.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">8. Account Termination</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms 
                or engage in suspicious activities without prior warning.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BOLT Mining is provided "as is" without warranties of any kind. 
                We are not liable for any damages arising from the use of our service.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For questions about these terms, contact us through our official Telegram channel: @boltcomm
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

export default TermsOfService;
