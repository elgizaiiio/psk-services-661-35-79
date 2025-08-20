import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ViralUser = {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power_multiplier: number;
  mining_duration_hours: number;
  created_at: string;
  updated_at: string;
};

interface AdminUserManagementProps {
  users: ViralUser[];
  onUsersUpdate: () => void;
  onMetricsUpdate: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ 
  users, 
  onUsersUpdate, 
  onMetricsUpdate 
}) => {
  const [selectedUser, setSelectedUser] = useState<ViralUser | null>(null);

  const updateUserBalance = async (userId: string, newBalance: number) => {
    const { error } = await supabase.from("viral_users").update({ token_balance: newBalance }).eq("id", userId);
    if (error) return toast.error("Failed to update balance");
    toast.success("Balance updated successfully");
    onUsersUpdate();
    onMetricsUpdate();
  };

  const updateUserMiningSettings = async (userId: string, power: number, duration: number) => {
    const { error } = await supabase.from("viral_users").update({ 
      mining_power_multiplier: power,
      mining_duration_hours: duration 
    }).eq("id", userId);
    if (error) return toast.error("Failed to update mining settings");
    toast.success("Mining settings updated successfully");
    onUsersUpdate();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their data.")) return;
    
    const { error } = await supabase.from("viral_users").delete().eq("id", userId);
    if (error) return toast.error("Failed to delete user");
    toast.success("User deleted successfully");
    onUsersUpdate();
    onMetricsUpdate();
    setSelectedUser(null);
  };

  return (
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
                        Balance: {user.token_balance.toFixed(4)} VIRAL • Power: ×{user.mining_power_multiplier} • Duration: {user.mining_duration_hours}h
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
                      defaultValue={selectedUser.token_balance}
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
                  <Label className="text-xs">Mining Power Multiplier</Label>
                  <Input
                    type="number"
                    defaultValue={selectedUser.mining_power_multiplier}
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
  );
};

export default AdminUserManagement;