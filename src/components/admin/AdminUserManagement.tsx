import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BoltUser } from "@/types/bolt";
import { AlertTriangle, Trash2, Shield, RefreshCw } from "lucide-react";

interface AdminUserManagementProps {
  users: BoltUser[];
  onUsersUpdate: () => void;
  onMetricsUpdate: () => void;
}

interface SuspiciousPayment {
  id: string;
  user_id: string;
  amount_ton: number;
  status: string;
  product_type: string;
  created_at: string;
  username?: string;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ 
  users, 
  onUsersUpdate, 
  onMetricsUpdate 
}) => {
  const [selectedUser, setSelectedUser] = useState<BoltUser | null>(null);
  const [suspiciousPayments, setSuspiciousPayments] = useState<SuspiciousPayment[]>([]);
  const [loadingSuspicious, setLoadingSuspicious] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Load suspicious payments
  const loadSuspiciousPayments = async () => {
    setLoadingSuspicious(true);
    try {
      const { data, error } = await supabase
        .from('ton_payments')
        .select('id, user_id, amount_ton, status, product_type, created_at')
        .or('status.eq.confirmed,status.eq.suspicious')
        .is('tx_hash', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSuspiciousPayments(data || []);
    } catch (error) {
      console.error('Error loading suspicious payments:', error);
    } finally {
      setLoadingSuspicious(false);
    }
  };

  useEffect(() => {
    loadSuspiciousPayments();
  }, []);

  const updateUserBalance = async (userId: string, newBalance: number) => {
    const { error } = await supabase
      .from("bolt_users" as any)
      .update({ token_balance: newBalance })
      .eq("id", userId);
    if (error) return toast.error("Failed to update balance");
    toast.success("Balance updated successfully");
    onUsersUpdate();
    onMetricsUpdate();
  };

  const updateUserMiningSettings = async (userId: string, power: number, duration: number) => {
    const { error } = await supabase
      .from("bolt_users" as any)
      .update({ 
        mining_power: power,
        mining_duration_hours: duration 
      })
      .eq("id", userId);
    if (error) return toast.error("Failed to update mining settings");
    toast.success("Mining settings updated successfully");
    onUsersUpdate();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their data.")) return;
    
    const { error } = await supabase
      .from("bolt_users" as any)
      .delete()
      .eq("id", userId);
    if (error) return toast.error("Failed to delete user");
    toast.success("User deleted successfully");
    onUsersUpdate();
    onMetricsUpdate();
    setSelectedUser(null);
  };

  // Reset balance for users with suspicious payments
  const cleanupSuspiciousAccounts = async () => {
    if (!confirm("This will reset balances for all users with unverified 'confirmed' payments. Continue?")) return;
    
    setCleaningUp(true);
    try {
      // Get unique user IDs from suspicious payments
      const userIds = [...new Set(suspiciousPayments.map(p => p.user_id))];
      
      // Reset their balances
      for (const userId of userIds) {
        await supabase
          .from('bolt_users')
          .update({ token_balance: 0 })
          .eq('id', userId);
      }

      // Mark payments as suspicious
      await supabase
        .from('ton_payments')
        .update({ status: 'suspicious' })
        .in('id', suspiciousPayments.map(p => p.id));

      toast.success(`Reset balances for ${userIds.length} users and marked ${suspiciousPayments.length} payments as suspicious`);
      onUsersUpdate();
      onMetricsUpdate();
      loadSuspiciousPayments();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup suspicious accounts');
    } finally {
      setCleaningUp(false);
    }
  };

  // Delete a specific suspicious payment
  const deleteSuspiciousPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('ton_payments')
      .delete()
      .eq('id', paymentId);
    
    if (error) {
      toast.error('Failed to delete payment');
      return;
    }
    
    toast.success('Payment deleted');
    loadSuspiciousPayments();
  };

  return (
    <div className="space-y-6">
      {/* Suspicious Payments Alert */}
      {suspiciousPayments.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Suspicious Payments ({suspiciousPayments.length})</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={loadSuspiciousPayments}
                  disabled={loadingSuspicious}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingSuspicious ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={cleanupSuspiciousAccounts}
                  disabled={cleaningUp}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  {cleaningUp ? 'Cleaning...' : 'Clean All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {suspiciousPayments.map(payment => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                  >
                    <div>
                      <span className="font-mono text-xs">{payment.user_id.slice(0, 8)}...</span>
                      <span className="mx-2">•</span>
                      <span className="font-semibold">{payment.amount_ton} TON</span>
                      <span className="mx-2">•</span>
                      <span className="text-muted-foreground">{payment.product_type}</span>
                      <span className="mx-2">•</span>
                      <span className={`${payment.status === 'suspicious' ? 'text-orange-500' : 'text-destructive'}`}>
                        {payment.status}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => deleteSuspiciousPayment(payment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Users Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Users Management</div>
                <div className="text-sm text-muted-foreground">{users.length} total users</div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.photo_url} alt={user.first_name} />
                        <AvatarFallback>{user.first_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">@{user.telegram_username} • ID: {user.telegram_id}</div>
                        <div className="text-xs text-muted-foreground">
                          Balance: {Number(user.token_balance).toFixed(4)} BOLT • Power: ×{user.mining_power} • Duration: {user.mining_duration_hours}h
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div>
          {selectedUser && (
            <Card>
              <CardHeader>
                <div className="font-semibold">Edit: {selectedUser.first_name}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarImage src={selectedUser.photo_url} alt={selectedUser.first_name} />
                    <AvatarFallback>{selectedUser.first_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedUser.telegram_username}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Token Balance</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        defaultValue={Number(selectedUser.token_balance)}
                        id={`balance-${selectedUser.id}`}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={() => {
                        const newBalance = Number((document.getElementById(`balance-${selectedUser.id}`) as HTMLInputElement)?.value || 0);
                        updateUserBalance(selectedUser.id, newBalance);
                      }}>Save</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Mining Power</Label>
                    <Input
                      type="number"
                      defaultValue={selectedUser.mining_power}
                      id={`power-${selectedUser.id}`}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Mining Duration (hours)</Label>
                    <Input
                      type="number"
                      defaultValue={selectedUser.mining_duration_hours}
                      id={`duration-${selectedUser.id}`}
                      className="text-sm"
                    />
                  </div>
                  
                  <Button size="sm" className="w-full" onClick={() => {
                    const power = Number((document.getElementById(`power-${selectedUser.id}`) as HTMLInputElement)?.value || 1);
                    const duration = Number((document.getElementById(`duration-${selectedUser.id}`) as HTMLInputElement)?.value || 4);
                    updateUserMiningSettings(selectedUser.id, power, duration);
                  }}>
                    Update Mining Settings
                  </Button>
                  
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteUser(selectedUser.id)}>
                    Delete User
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
