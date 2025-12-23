import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BoltDailyCode } from "@/types/bolt";

interface AdminDailyCodesProps {
  codes: Partial<BoltDailyCode> | null;
  setCodes: React.Dispatch<React.SetStateAction<Partial<BoltDailyCode> | null>>;
  onCodesUpdate: () => void;
}

const AdminDailyCodes: React.FC<AdminDailyCodesProps> = ({ codes, setCodes, onCodesUpdate }) => {
  const upsertCodes = async () => {
    if (!codes) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("bolt_daily_codes" as any)
      .upsert({
        id: codes.id,
        date: today,
        code1: codes.code1,
        code2: codes.code2,
        code3: codes.code3,
        code4: codes.code4,
        points_reward: codes.points_reward || 100
      });
    if (error) return toast.error("Failed to update daily codes");
    toast.success("Daily codes updated successfully");
    onCodesUpdate();
  };

  const generateRandomCodes = () => {
    const randomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodes(c => ({
      ...(c || { code1: '', code2: '', code3: '', code4: '', points_reward: 100 }),
      code1: randomCode(),
      code2: randomCode(),
      code3: randomCode(),
      code4: randomCode()
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Daily Secret Codes</div>
          <Button variant="outline" size="sm" onClick={generateRandomCodes}>
            Generate Random
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Code 1</Label>
            <Input 
              value={codes?.code1 || ''} 
              onChange={(e) => setCodes(c => ({ 
                ...(c || { code1: '', code2: '', code3: '', code4: '', points_reward: 100 }), 
                code1: e.target.value 
              }))}
              className="text-sm font-mono"
              placeholder="Enter code"
            />
          </div>
          <div>
            <Label className="text-xs">Code 2</Label>
            <Input 
              value={codes?.code2 || ''} 
              onChange={(e) => setCodes(c => ({ 
                ...(c || { code1: '', code2: '', code3: '', code4: '', points_reward: 100 }), 
                code2: e.target.value 
              }))}
              className="text-sm font-mono"
              placeholder="Enter code"
            />
          </div>
          <div>
            <Label className="text-xs">Code 3</Label>
            <Input 
              value={codes?.code3 || ''} 
              onChange={(e) => setCodes(c => ({ 
                ...(c || { code1: '', code2: '', code3: '', code4: '', points_reward: 100 }), 
                code3: e.target.value 
              }))}
              className="text-sm font-mono"
              placeholder="Enter code"
            />
          </div>
          <div>
            <Label className="text-xs">Code 4</Label>
            <Input 
              value={codes?.code4 || ''} 
              onChange={(e) => setCodes(c => ({ 
                ...(c || { code1: '', code2: '', code3: '', code4: '', points_reward: 100 }), 
                code4: e.target.value 
              }))}
              className="text-sm font-mono"
              placeholder="Enter code"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={upsertCodes} className="flex-1">
            Save Daily Codes
          </Button>
        </div>

        {codes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Today's Active Codes:</div>
            <div className="grid grid-cols-4 gap-2">
              {[codes.code1, codes.code2, codes.code3, codes.code4].map((code, index) => (
                <div key={index} className="text-center p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground">Code {index + 1}</div>
                  <div className="font-mono font-bold">{code || 'EMPTY'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDailyCodes;
