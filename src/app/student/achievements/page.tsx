"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Check,
  Coins,
  Crown,
  Flame,
  Medal,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trophy,
} from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, StatusBadge, Surface } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { getErrorMessage, gamificationApi, type BadgeReward, type GamificationStats, type LeaderboardEntry, type ShopItem } from "@/lib/api";
import { cn } from "@/lib/utils";

type AchievementTab = "badges" | "leaderboard" | "shop";
type LeaderboardScope = "class" | "school";

function rewardIcon(value: string, fallback: "badge" | "shop" = "badge") {
  const source = value.toLowerCase();
  if (source.includes("streak") || source.includes("fire")) return Flame;
  if (source.includes("coin") || source.includes("money")) return Coins;
  if (source.includes("title") || source.includes("crown")) return Crown;
  if (source.includes("trophy") || source.includes("rank")) return Trophy;
  return fallback === "shop" ? Package : Award;
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [badges, setBadges] = useState<BadgeReward[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ leaderboard: LeaderboardEntry[]; my_rank: number; scope: string } | null>(null);
  const [shop, setShop] = useState<{ coins: number; items: ShopItem[] } | null>(null);
  const [tab, setTab] = useState<AchievementTab>("badges");
  const [scope, setScope] = useState<LeaderboardScope>("class");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"check-in" | number | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (nextScope: LeaderboardScope = scope) => {
    setLoading(true);
    setError("");
    try {
      const [nextStats, nextBadges, nextLeaderboard, nextShop] = await Promise.all([
        gamificationApi.getMyStats(),
        gamificationApi.getBadges(),
        gamificationApi.getLeaderboard(nextScope),
        gamificationApi.getShop(),
      ]);
      setStats(nextStats);
      setBadges(nextBadges);
      setLeaderboard(nextLeaderboard);
      setShop(nextShop);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu thành tích."));
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCheckIn() {
    setBusy("check-in");
    setError("");
    try {
      const result = await gamificationApi.checkIn();
      setNotice(result.already_checked ? "Bạn đã điểm danh hôm nay." : `${result.message} +${result.xp_earned ?? 0} XP`);
      await load();
    } catch (checkInError) {
      setError(getErrorMessage(checkInError, "Không thể điểm danh lúc này."));
    } finally {
      setBusy(null);
    }
  }

  async function handleBuy(item: ShopItem) {
    if (item.owned || busy !== null) return;
    setBusy(item.id);
    setError("");
    try {
      const result = await gamificationApi.buyItem(item.id);
      setNotice(`${result.message} Còn ${result.coins_remaining} xu.`);
      await load();
    } catch (buyError) {
      setError(getErrorMessage(buyError, "Không thể đổi phần thưởng."));
    } finally {
      setBusy(null);
    }
  }

  async function changeScope(nextScope: LeaderboardScope) {
    setScope(nextScope);
    setError("");
    try {
      setLeaderboard(await gamificationApi.getLeaderboard(nextScope));
    } catch (scopeError) {
      setError(getErrorMessage(scopeError, "Không thể tải bảng xếp hạng."));
    }
  }

  return (
    <div>
      <PageHeader
        title="Thành tích & phần thưởng"
        description="Theo dõi tiến bộ, ghi nhận nỗ lực và đổi xu lấy những phần thưởng trong lớp học."
        actions={
          <Button onClick={() => void handleCheckIn()} disabled={busy === "check-in"}>
            <Flame className="size-4" aria-hidden="true" />
            {busy === "check-in" ? "Đang điểm danh..." : "Điểm danh hôm nay"}
          </Button>
        }
      />

      {error && <ErrorState className="mb-5" title="Không thể tải dữ liệu" description={error} action={<Button variant="secondary" size="small" onClick={() => void load()}><RefreshCw className="size-4" />Thử lại</Button>} />}
      {notice && <p role="status" className="mb-5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-success dark:border-emerald-900 dark:bg-emerald-950/30">{notice}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Cấp độ", value: stats?.level ?? 1, icon: Crown },
              { label: "Kinh nghiệm", value: stats?.xp ?? 0, icon: Sparkles },
              { label: "Xu", value: stats?.coins ?? 0, icon: Coins },
              { label: "Chuỗi ngày", value: `${stats?.streak ?? 0} ngày`, icon: Flame },
              { label: "Huy hiệu", value: `${stats?.badges_earned ?? 0}/${stats?.total_badges ?? 0}`, icon: Medal },
            ].map((item) => (
              <Surface key={item.label} className="p-4">
                <item.icon className="size-5 text-brand-strong" aria-hidden="true" />
                <p className="mt-3 text-xl font-extrabold text-ink">{item.value}</p>
                <p className="text-xs font-bold text-ink-soft">{item.label}</p>
              </Surface>
            ))}
          </div>

          <Surface className="mt-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-ink-soft"><span>Cấp {stats?.level ?? 1}</span><span>{stats?.xp_progress ?? 0}% đến cấp tiếp theo</span></div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats?.xp_progress ?? 0} aria-label="Tiến độ cấp độ"><div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, stats?.xp_progress ?? 0))}%` }} /></div>
            <p className="mt-2 text-xs text-ink-soft">Còn {stats?.xp_to_next_level ?? 0} XP để mở khóa cấp tiếp theo.</p>
          </Surface>

          <Tabs<AchievementTab> label="Nội dung thành tích" value={tab} onChange={setTab} options={[{ value: "badges", label: "Huy hiệu" }, { value: "leaderboard", label: "Bảng xếp hạng" }, { value: "shop", label: "Cửa hàng" }]} className="mt-6" />

          {tab === "badges" && (
            badges.length === 0 ? <Surface><EmptyState icon={Award} title="Chưa có huy hiệu" description="Hoàn thành bài học và thử thách để mở khóa huy hiệu đầu tiên." /></Surface> :
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => { const Icon = rewardIcon(badge.category); return <Surface key={badge.id} className={cn("p-5", !badge.earned && "opacity-65")}><div className="flex items-start justify-between gap-4"><div className={cn("grid size-11 place-items-center rounded-[12px]", badge.earned ? "bg-brand-soft text-brand-strong" : "bg-surface-subtle text-ink-soft")}><Icon className="size-5" aria-hidden="true" /></div>{badge.earned && <StatusBadge><Check className="size-3" />Đã nhận</StatusBadge>}</div><h2 className="mt-4 text-base font-extrabold text-ink">{badge.name}</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{badge.description}</p><p className="mt-4 text-xs font-bold text-brand-strong">+{badge.xp_reward} XP · +{badge.coin_reward} xu</p></Surface>; })}
              </div>
          )}

          {tab === "leaderboard" && (
            <Surface className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-ink">Thi đua tích cực</h2><p className="mt-1 text-sm text-ink-soft">Chỉ hiển thị tên và điểm để giữ bảng xếp hạng thân thiện.</p></div><div className="flex gap-1 rounded-[10px] bg-surface-subtle p-1">{(["class", "school"] as const).map((item) => <button key={item} type="button" onClick={() => void changeScope(item)} className={cn("rounded-[8px] px-3 py-2 text-xs font-bold", scope === item ? "bg-surface text-brand-strong shadow-sm" : "text-ink-soft")} aria-pressed={scope === item}>{item === "class" ? "Trong lớp" : "Toàn trường"}</button>)}</div></div>
              {!leaderboard?.leaderboard?.length ? <EmptyState icon={Trophy} title="Chưa có dữ liệu xếp hạng" description="Khi có hoạt động học tập, bảng xếp hạng sẽ xuất hiện ở đây." /> : <div className="mt-5 divide-y divide-line">{leaderboard.leaderboard.map((entry) => <div key={entry.id} className={cn("flex items-center gap-3 py-3", entry.is_me && "rounded-[10px] bg-brand-soft px-3")}><span className="w-8 text-center text-sm font-extrabold text-ink-soft">#{entry.rank}</span><div className="grid size-9 place-items-center rounded-full bg-surface-subtle text-xs font-extrabold text-brand-strong">{entry.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-ink">{entry.name}{entry.is_me ? " (Bạn)" : ""}</p><p className="text-xs text-ink-soft">Cấp {entry.level} · chuỗi {entry.streak} ngày</p></div><span className="text-sm font-extrabold text-brand-strong">{entry.xp} XP</span></div>)}</div>}
              {leaderboard && <p className="mt-4 text-center text-xs font-bold text-ink-soft">Thứ hạng của bạn: #{leaderboard.my_rank}</p>}
            </Surface>
          )}

          {tab === "shop" && (
            <Surface className="p-5 sm:p-6"><div className="flex items-center gap-3 rounded-[12px] bg-brand-soft px-4 py-3 text-sm font-bold text-brand-strong"><Coins className="size-5" />Bạn đang có {shop?.coins ?? 0} xu</div>{!shop?.items?.length ? <EmptyState icon={ShoppingBag} title="Cửa hàng đang trống" description="Hãy quay lại sau khi có phần thưởng mới." /> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shop.items.map((item) => { const Icon = rewardIcon(item.item_type, "shop"); const canBuy = !item.owned && (shop.coins >= item.price); return <div key={item.id} className="rounded-[12px] border border-line bg-surface-subtle p-4"><div className="grid size-10 place-items-center rounded-[10px] bg-surface text-brand-strong"><Icon className="size-5" /></div><h2 className="mt-3 text-sm font-extrabold text-ink">{item.name}</h2><p className="mt-1 min-h-12 text-sm leading-6 text-ink-soft">{item.description}</p>{item.owned ? <StatusBadge>Đã sở hữu</StatusBadge> : <Button size="small" className="mt-4 w-full" disabled={!canBuy || busy === item.id} onClick={() => void handleBuy(item)}>{busy === item.id ? "Đang đổi..." : <><Coins className="size-3.5" />{item.price} xu</>}</Button>}</div>; })}</div>}</Surface>
          )}
        </>
      )}
    </div>
  );
}
