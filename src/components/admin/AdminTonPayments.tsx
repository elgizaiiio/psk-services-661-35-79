import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RefreshCw, Trash2, ExternalLink, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

interface TonPayment {
  id: string;
  user_id: string;
  amount_ton: number;
  description: string | null;
  product_type: string;
  product_id: string | null;
  status: string;
  destination_address: string;
  tx_hash: string | null;
  wallet_address: string | null;
  confirmed_at: string | null;
  metadata: any;
  created_at: string;
  payment_method: string;
  payment_currency: string | null;
}

const AdminTonPayments: React.FC = () => {
  const [payments, setPayments] = useState<TonPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<TonPayment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ton_payments" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments((data || []) as unknown as TonPayment[]);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.error("فشل في تحميل التحويلات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const getStatusBadge = (status: string, txHash: string | null) => {
    const isSuspicious = status === "confirmed" && !txHash;
    
    if (isSuspicious) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          مشبوه
        </Badge>
      );
    }

    switch (status) {
      case "confirmed":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" />
            مؤكد
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "failed":
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            {status === "failed" ? "فاشل" : "ملغي"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancelPayment = async () => {
    if (!selectedPayment) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("ton_payments" as any)
        .update({ 
          status: "cancelled",
          metadata: {
            ...(selectedPayment.metadata || {}),
            cancelled_at: new Date().toISOString(),
            cancelled_reason: "Admin: Fake payment"
          }
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      toast.success("تم إلغاء التحويل بنجاح");
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      loadPayments();
    } catch (error) {
      console.error("Error cancelling payment:", error);
      toast.error("فشل في إلغاء التحويل");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address: string) => {
    if (!address) return "-";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getTotalStats = () => {
    const confirmed = payments.filter(p => p.status === "confirmed");
    const suspicious = confirmed.filter(p => !p.tx_hash);
    const legitimate = confirmed.filter(p => p.tx_hash);
    
    return {
      total: payments.length,
      confirmed: confirmed.length,
      suspicious: suspicious.length,
      legitimate: legitimate.length,
      totalAmount: confirmed.reduce((sum, p) => sum + Number(p.amount_ton), 0),
      legitimateAmount: legitimate.reduce((sum, p) => sum + Number(p.amount_ton), 0),
      suspiciousAmount: suspicious.reduce((sum, p) => sum + Number(p.amount_ton), 0),
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي التحويلات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.legitimate}</div>
            <div className="text-sm text-muted-foreground">تحويلات حقيقية</div>
            <div className="text-xs text-green-500">{stats.legitimateAmount.toFixed(2)} TON</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats.suspicious}</div>
            <div className="text-sm text-muted-foreground">تحويلات مشبوهة</div>
            <div className="text-xs text-destructive">{stats.suspiciousAmount.toFixed(2)} TON</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalAmount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">إجمالي TON</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">جميع التحويلات</CardTitle>
          <Button onClick={loadPayments} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">TX Hash</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const isSuspicious = payment.status === "confirmed" && !payment.tx_hash;
                  return (
                    <TableRow 
                      key={payment.id}
                      className={isSuspicious ? "bg-destructive/5" : ""}
                    >
                      <TableCell>
                        {getStatusBadge(payment.status, payment.tx_hash)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {Number(payment.amount_ton).toFixed(2)} TON
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{payment.product_type}</div>
                        {payment.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {payment.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateAddress(payment.user_id)}
                      </TableCell>
                      <TableCell>
                        {payment.tx_hash ? (
                          <a
                            href={`https://tonviewer.com/transaction/${payment.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-xs font-mono"
                          >
                            {truncateAddress(payment.tx_hash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-destructive text-xs">لا يوجد</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        {payment.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تحويلات
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء التحويل</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>هل أنت متأكد من إلغاء هذا التحويل؟</p>
              {selectedPayment && (
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <div>المبلغ: <strong>{Number(selectedPayment.amount_ton).toFixed(2)} TON</strong></div>
                  <div>المنتج: {selectedPayment.product_type}</div>
                  <div>TX Hash: {selectedPayment.tx_hash || "لا يوجد (مشبوه)"}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPayment}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTonPayments;
