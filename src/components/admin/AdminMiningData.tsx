import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

type MiningSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_per_hour: number;
  mining_power_multiplier: number;
  total_tokens_mined: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
};

interface AdminMiningDataProps {
  miningSessions: MiningSession[];
}

const AdminMiningData: React.FC<AdminMiningDataProps> = ({ miningSessions }) => {
  const activeSessions = miningSessions.filter(session => session.is_active);
  const completedSessions = miningSessions.filter(session => !session.is_active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Mining Sessions</div>
          <div className="flex gap-2">
            <Badge variant="default">{activeSessions.length} Active</Badge>
            <Badge variant="secondary">{completedSessions.length} Completed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {miningSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-sm">Session #{session.id.slice(0, 8)}</div>
                    {session.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User: {session.user_id.slice(0, 8)} • Power: ×{session.mining_power_multiplier} • Rate: {session.tokens_per_hour}/h
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tokens Mined: <span className="font-mono font-medium">{session.total_tokens_mined.toFixed(4)} VIRAL</span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Started:</div>
                  <div>{formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}</div>
                  {session.completed_at && (
                    <>
                      <div className="mt-1">Completed:</div>
                      <div>{formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminMiningData;