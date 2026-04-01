import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const statusMap: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: "待批阅", icon: Clock, color: "text-muted-foreground" },
  grading: { label: "批阅中", icon: Loader2, color: "text-blue-600" },
  graded: { label: "已批阅", icon: CheckCircle2, color: "text-green-600" },
  error: { label: "批阅失败", icon: AlertCircle, color: "text-red-600" },
};

export default function History() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: submissions, isLoading } = trpc.submission.myHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  const { data: stats } = trpc.analytics.studentStats.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-white to-[#f5f5f7] pt-16 pb-12">
        <div className="container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">练习记录</h1>
          <p className="mt-3 text-lg text-muted-foreground">查看你的答题历史和成绩</p>

          {/* Stats */}
          {stats && (
            <div className="mt-8 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.totalSubmissions}</p>
                <p className="text-sm text-muted-foreground mt-1">总答题数</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.gradedSubmissions}</p>
                <p className="text-sm text-muted-foreground mt-1">已批阅</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-[#f5f5f7]">
        <div className="container max-w-3xl mx-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="mt-2 h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const st = statusMap[sub.status] || statusMap.pending;
                const Icon = st.icon;
                return (
                  <div key={sub.id} className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${st.color} ${sub.status === "grading" ? "animate-spin" : ""}`} />
                      <div>
                        <p className="text-sm font-medium">题目 #{sub.questionId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.status === "graded" && sub.score !== null && (
                        <span className="text-sm font-semibold text-primary">
                          {sub.score}/{sub.maxScore}
                        </span>
                      )}
                      <span className={`text-xs ${st.color}`}>{st.label}</span>
                      {sub.status === "graded" && (
                        <Link href={`/result/${sub.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7">
                            查看详情
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <HistoryIcon className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <p className="mt-4 text-lg text-muted-foreground">暂无练习记录</p>
              <Link href="/topics">
                <Button className="mt-4 rounded-full px-8">开始练习</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
