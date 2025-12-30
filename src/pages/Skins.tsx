import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { callGameApi } from "@/lib/gameApi";
import { toast } from "sonner";

 type Player = {
  username: string | null;
  telegram_id: number | null;
  coins: number;
  current_skin: string;
};

 type Skin = {
  skin_key: string;
  name: string;
  price_ton: number;
};

const Skins: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  useTelegramBackButton();

  const load = useCallback(async () => {
    try {
      const data = await callGameApi("get_player", {
        telegram_id: tgUser?.id,
        username: tgUser?.username,
      });
      setPlayer(data.player);
      setSkins(data.skins || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load data");
    }
  }, [tgUser]);

  useEffect(() => { load(); }, [load]);

  const buySkin = async (s: Skin) => {
    if (!player) return;
    try {
      const data = await callGameApi("purchase", {
        telegram_id: player.telegram_id,
        item_type: "skin",
        item_key: s.skin_key,
        amount_ton: s.price_ton,
      });
      setPlayer(data.player);
      toast.success(`Successfully applied skin ${s.name}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to purchase skin");
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 pt-16 pb-24 space-y-4">
      <Helmet>
        <title>Buy Skins | 2048 TON</title>
        <meta name="description" content="Browse and purchase game skins using TON to customize your game board appearance." />
        <link rel="canonical" href={`${window.location.origin}/skins`} />
      </Helmet>


      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Default Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Default Skin</div>
            <div className="text-xs text-muted-foreground">Free</div>
            <Button
              size="sm"
              variant="secondary"
              disabled
            >
              Active
            </Button>
          </div>

          {/* Blue Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Blue Skin</div>
            <div className="text-xs text-muted-foreground">0.1 TON</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buySkin({skin_key: 'blue', name: 'Blue Skin', price_ton: 0.1})}
            >
              Buy
            </Button>
          </div>

          {/* Red Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Red Skin</div>
            <div className="text-xs text-muted-foreground">0.2 TON</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buySkin({skin_key: 'red', name: 'Red Skin', price_ton: 0.2})}
            >
              Buy
            </Button>
          </div>

          {/* Gold Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Gold Skin</div>
            <div className="text-xs text-muted-foreground">0.5 TON</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buySkin({skin_key: 'gold', name: 'Gold Skin', price_ton: 0.5})}
            >
              Buy
            </Button>
          </div>

          {/* Rainbow Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Rainbow Skin</div>
            <div className="text-xs text-muted-foreground">1.0 TON</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buySkin({skin_key: 'rainbow', name: 'Rainbow Skin', price_ton: 1.0})}
            >
              Buy
            </Button>
          </div>

          {/* Diamond Skin */}
          <div className="p-3 rounded-lg border flex flex-col items-center gap-2">
            <div className="text-sm font-medium text-center leading-tight">Diamond Skin</div>
            <div className="text-xs text-muted-foreground">2.0 TON</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buySkin({skin_key: 'diamond', name: 'Diamond Skin', price_ton: 2.0})}
            >
              Buy
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default Skins;
