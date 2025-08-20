import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Target, Coins, Clock, TrendingUp } from "lucide-react";

type MetricsData = {
  users: number;
  active24h: number;
  codeAnswers24h: number;
  completedTasks24h: number;
  totalTokens: number;
  totalUpgrades: number;
};

interface AdminMetricsProps {
  metrics: MetricsData | null;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const metricCards = [
    {
      title: "Total Users",
      value: metrics.users,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active (24h)",
      value: metrics.active24h,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Tasks (24h)",
      value: metrics.completedTasks24h,
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Codes (24h)",
      value: metrics.codeAnswers24h,
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Total Tokens",
      value: metrics.totalTokens.toFixed(0),
      icon: Coins,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Upgrades",
      value: metrics.totalUpgrades,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{metric.title}</div>
              <div className="text-xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminMetrics;