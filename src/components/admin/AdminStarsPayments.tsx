import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, User, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface StarsPayment {
  id: string;
  user_id: string;
  telegram_id: number;
  amount_stars: number;
  amount_usd: number | null;
  product_type: string;
  product_id: string | null;
  status: string;
  telegram_payment_id: string | null;
  created_at: string;
  user?: {
    telegram_username: string | null;
    first_name: string | null;
  };
}

const AdminStarsPayments: React.FC = () => {
  const [payments, setPayments] = useState<StarsPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStars, setTotalStars] = useState(0);
  const [totalUsd, setTotalUsd] = useState(0);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Fetch stars payments with user info
      const { data, error } = await supabase
        .from('stars_payments')
        .select(`
          *,
          user:bolt_users!stars_payments_user_id_fkey(telegram_username, first_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading stars payments:', error);
        // Fallback without join
        const { data: fallbackData } = await supabase
          .from('stars_payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        setPayments((fallbackData || []) as StarsPayment[]);
        
        // Calculate totals
        const stars = (fallbackData || []).reduce((sum, p: any) => sum + (p.amount_stars || 0), 0);
        const usd = (fallbackData || []).reduce((sum, p: any) => sum + (p.amount_usd || 0), 0);
        setTotalStars(stars);
        setTotalUsd(usd);
      } else {
        setPayments((data || []) as StarsPayment[]);
        
        // Calculate totals
        const stars = (data || []).reduce((sum, p: any) => sum + (p.amount_stars || 0), 0);
        const usd = (data || []).reduce((sum, p: any) => sum + (p.amount_usd || 0), 0);
        setTotalStars(stars);
        setTotalUsd(usd);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي النجوم</p>
              <p className="text-2xl font-bold text-yellow-400">{totalStars.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي USD</p>
              <p className="text-2xl font-bold text-green-400">${totalUsd.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد المدفوعات</p>
              <p className="text-2xl font-bold text-blue-400">{payments.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          مدفوعات النجوم
        </h3>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مدفوعات بعد
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/20">
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {payment.user?.first_name || payment.user?.telegram_username || `TG:${payment.telegram_id}`}
                      </span>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{payment.product_type}</span>
                      <span>•</span>
                      <span>{format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {payment.amount_stars}
                  </div>
                  {payment.amount_usd && (
                    <div className="text-sm text-green-400">${payment.amount_usd}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminStarsPayments;
