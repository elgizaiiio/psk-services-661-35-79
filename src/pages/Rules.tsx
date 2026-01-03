import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const Rules: React.FC = () => {
  const navigate = useNavigate();
  useTelegramBackButton();

  return (
    <>
      <Helmet>
        <title>Rules | BOLT Mining</title>
        <meta name="description" content="BOLT Mining Community Rules and Guidelines." />
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
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Rules & Guidelines</h1>
            </div>
          </motion.div>

          {/* Mining Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              ⛏️ Mining Rules
            </h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Mining sessions must be started manually</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Claim your rewards before the session expires</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Upgrade mining power to earn more tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>No bots or automated scripts allowed</span>
              </li>
            </ul>
          </motion.div>

          {/* Referral Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              👥 Referral Rules
            </h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Earn 500 BOLT for each valid referral</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Referred users must be real and active</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>No fake accounts or self-referrals</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>Fraudulent referrals will result in ban</span>
              </li>
            </ul>
          </motion.div>

          {/* Withdrawal Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              💰 Withdrawal Rules
            </h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Minimum withdrawal amounts apply</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Withdrawals are processed within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Valid wallet address required</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>Network fees may apply</span>
              </li>
            </ul>
          </motion.div>

          {/* Violations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Violations & Penalties
            </h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li>• <strong>Warning:</strong> First minor violation</li>
              <li>• <strong>Temporary Ban:</strong> Repeated violations</li>
              <li>• <strong>Permanent Ban:</strong> Serious fraud or abuse</li>
              <li>• <strong>Balance Reset:</strong> Exploiting bugs</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              All decisions are final. Appeals can be made through @boltcomm.
            </p>
          </motion.div>

          {/* Fair Play */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-primary/10 border border-primary/20 p-5 space-y-3"
          >
            <h2 className="text-lg font-semibold text-foreground">🤝 Fair Play Commitment</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are committed to providing a fair experience for all users. 
              Report any suspicious activity to help keep our community safe.
            </p>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center py-4">
            Last updated: January 2026
          </p>
        </div>
      </div>
    </>
  );
};

export default Rules;
