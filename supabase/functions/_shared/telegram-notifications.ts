// Shared Telegram notification helper

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

export async function sendTelegramNotification(
  telegramId: number,
  text: string,
  replyMarkup?: object
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const body: Record<string, unknown> = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'HTML',
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('Telegram notification sent:', result.ok);
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

// Notification templates
export const notifications = {
  miningComplete: (amount: number, balance: number) => `
⛏️ <b>Mining Complete!</b>

💰 You earned: <b>+${amount.toLocaleString()} BOLT</b>
💎 New balance: <b>${balance.toLocaleString()} BOLT</b>

🚀 Start a new mining session now!
`,

  miningPowerUpgrade: (oldPower: number, newPower: number) => `
⚡ <b>Mining Power Upgraded!</b>

📊 Previous: <b>${oldPower}x</b>
🚀 New: <b>${newPower}x</b>

Your mining is now <b>${Math.round((newPower / oldPower - 1) * 100)}%</b> more powerful!
`,

  miningDurationUpgrade: (oldHours: number, newHours: number) => `
⏱️ <b>Mining Duration Upgraded!</b>

📊 Previous: <b>${oldHours} hours</b>
🚀 New: <b>${newHours} hours</b>

Enjoy longer mining sessions! 🎉
`,

  paymentConfirmed: (productType: string, amount: number) => `
✅ <b>Payment Confirmed!</b>

📦 Product: <b>${productType}</b>
💰 Amount: <b>${amount} TON</b>

Thank you for your support! 🙏
`,

  referralJoined: (friendName: string, bonus: number, milestoneBonus: number, totalReferrals: number) => {
    let message = `
🎉 <b>New Referral!</b>

👤 <b>${friendName}</b> joined using your link!
💰 You earned: <b>+${bonus} BOLT</b>`;

    if (milestoneBonus > 0) {
      message += `
🏆 Milestone Bonus: <b>+${milestoneBonus} BOLT</b>`;
    }

    message += `
📊 Total referrals: <b>${totalReferrals}</b>

Keep inviting friends to earn more! 🚀`;
    return message;
  },

  balance: (balance: number, power: number, duration: number, referrals: number, referralEarnings: number) => `
📊 <b>Your BOLT Stats</b>

💰 Balance: <b>${balance.toLocaleString()} BOLT</b>
⚡ Mining Power: <b>${power}x</b>
⏱️ Mining Duration: <b>${duration}h</b>
👥 Total Referrals: <b>${referrals}</b>
🎁 Referral Earnings: <b>${referralEarnings.toLocaleString()} BOLT</b>
`,

  help: () => `
📚 <b>Available Commands</b>

/start - Start the bot & open mining app
/balance - Check your BOLT balance & stats
/referral - Get your referral link
/help - Show this help message

🚀 <b>Quick Actions:</b>
• Tap the button below to start mining
• Invite friends to earn bonus BOLT
• Complete daily tasks for extra rewards
`,
};
