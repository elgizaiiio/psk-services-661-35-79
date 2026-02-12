import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_TELEGRAM_ID } from '@/lib/admin-constants';

const BroadcastTest = () => {
  const [message, setMessage] = useState(
    `🎉 Congratulations! You could be our next Monthly Winner!\n\n💰 Prize: $4,000 USDT\n\nThe biggest giveaway is LIVE now! Complete tasks, invite friends, and stay active to win.\n\n⏳ Don't miss your chance — join now!`
  );
  const [inlineButtonText, setInlineButtonText] = useState('Join Now 🚀');
  const [inlineButtonUrl, setInlineButtonUrl] = useState('https://t.me/Boltminingbot/App');
  const [status, setStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [lastOffset, setLastOffset] = useState(0);
  const [lastSent, setLastSent] = useState(0);
  const [lastFailed, setLastFailed] = useState(0);
  const [lastBlocked, setLastBlocked] = useState(0);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const sendBroadcast = async (offset = 0, totalSent = 0, totalFailed = 0, totalBlocked = 0) => {
    setStatus('sending');
    addLog(`Starting broadcast from offset ${offset}...`);

    try {
      const body: any = {
        message,
        adminTelegramId: ADMIN_TELEGRAM_ID,
        secretKey: 'MASS_BROADCAST_2024_SECURE',
        offset,
        totalSent,
        totalFailed,
        totalBlocked,
        isChainedCall: offset > 0,
      };

      if (inlineButtonText && inlineButtonUrl) {
        body.inlineButton = { text: inlineButtonText, url: inlineButtonUrl };
      }

      const { data, error } = await supabase.functions.invoke('send-mass-broadcast', { body });

      if (error) {
        addLog(`❌ Error: ${error.message}`);
        setStatus('error');
        return;
      }

      if (data?.complete) {
        addLog(`✅ Broadcast complete! Sent: ${data.sent}, Failed: ${data.failed}, Blocked: ${data.blocked}`);
        setStatus('complete');
      } else if (data?.progress) {
        const p = data.progress;
        setLastOffset(p.processed);
        setLastSent(p.sent);
        setLastFailed(p.failed);
        setLastBlocked(p.blocked);
        addLog(`📤 Batch done. Processed: ${p.processed}, Sent: ${p.sent}, Failed: ${p.failed}, Blocked: ${p.blocked}`);
        addLog(`⏳ Next batches are chaining automatically...`);
        setStatus('chaining');
      } else {
        addLog(`📤 Response: ${JSON.stringify(data)}`);
        setStatus('chaining');
      }
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`);
      setStatus('error');
    }
  };

  const resumeBroadcast = () => {
    addLog(`🔄 Resuming from offset ${lastOffset}, sent=${lastSent}, failed=${lastFailed}, blocked=${lastBlocked}`);
    sendBroadcast(lastOffset, lastSent, lastFailed, lastBlocked);
  };

  const checkStatus = async () => {
    addLog('🔍 Checking latest edge function logs...');
    // We can check by calling with a very high offset to see if complete
    try {
      const { data } = await supabase.functions.invoke('send-mass-broadcast', {
        body: {
          message: 'status_check',
          secretKey: 'MASS_BROADCAST_2024_SECURE',
          offset: 999999,
          totalSent: lastSent,
          totalFailed: lastFailed,
          totalBlocked: lastBlocked,
          isChainedCall: true,
        }
      });
      if (data?.complete) {
        addLog(`✅ Broadcast is complete. Sent: ${data.sent}, Failed: ${data.failed}, Blocked: ${data.blocked}`);
        setStatus('complete');
      } else {
        addLog(`📊 Status response: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      addLog(`❌ Status check error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">📡 Mass Broadcast Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Message</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Button Text</label>
              <input
                className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground text-sm"
                value={inlineButtonText}
                onChange={e => setInlineButtonText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Button URL</label>
              <input
                className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground text-sm"
                value={inlineButtonUrl}
                onChange={e => setInlineButtonUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Status:</span>
            <span className={`font-bold ${
              status === 'complete' ? 'text-green-500' :
              status === 'error' ? 'text-red-500' :
              status === 'sending' || status === 'chaining' ? 'text-yellow-500' :
              'text-muted-foreground'
            }`}>
              {status.toUpperCase()}
            </span>
            {lastOffset > 0 && (
              <span className="text-muted-foreground">
                | Processed: {lastOffset} | Sent: {lastSent} | Failed: {lastFailed} | Blocked: {lastBlocked}
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => sendBroadcast()}
              disabled={status === 'sending'}
              variant="default"
            >
              🚀 Send Broadcast
            </Button>
            <Button
              onClick={resumeBroadcast}
              disabled={status === 'sending' || lastOffset === 0}
              variant="secondary"
            >
              ▶️ Resume
            </Button>
            <Button
              onClick={checkStatus}
              variant="outline"
            >
              🔄 Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-y-auto bg-black/50 rounded-md p-3 font-mono text-xs text-green-400 space-y-1">
            {logs.length === 0 && <p className="text-muted-foreground">No logs yet...</p>}
            {logs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastTest;
