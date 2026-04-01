import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { BarChart3, Users, FileText, BookOpen, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0071e3", "#34c759", "#ff9500", "#ff3b30", "#5856d6", "#af52de"];

export default function Analytics() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: analytics, isLoading } = trpc.analytics.adminDashboard.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">
            {loading ? "加载中..." : "仅管理员可访问此页面"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-white to-[#f5f5f7] pt-12 pb-6">
        <div className="container">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">数据分析</h1>
          <p className="mt-2 text-muted-foreground">学生练习数据概览与统计报表</p>
        </div>
      </section>

      <section className="py-8 bg-[#f5f5f7]">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-8 bg-muted rounded w-16 mb-2" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="注册用户" value={analytics.totalUsers} color="text-blue-600 bg-blue-50" />
                <StatCard icon={BookOpen} label="专题数量" value={analytics.totalTopics} color="text-purple-600 bg-purple-50" />
                <StatCard icon={FileText} label="文章数量" value={analytics.totalArticles} color="text-green-600 bg-green-50" />
                <StatCard icon={TrendingUp} label="答题总数" value={analytics.totalSubmissions} color="text-amber-600 bg-amber-50" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Topic Distribution */}
                {analytics.topicStats.length > 0 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">专题答题分布</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.topicStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="topicName" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="submissionCount" fill="#0071e3" radius={[6, 6, 0, 0]} name="答题数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Pie Chart */}
                {analytics.topicStats.length > 0 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">专题占比</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.topicStats}
                          dataKey="submissionCount"
                          nameKey="topicName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ topicName, percent }) => `${topicName} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.topicStats.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent Scores */}
                {analytics.recentGraded.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">近期批阅成绩</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.recentGraded.slice(0, 20).map((s, i) => ({
                        index: i + 1,
                        score: Number(s.score) || 0,
                        maxScore: s.maxScore,
                        percentage: s.maxScore > 0 ? Math.round((Number(s.score) / s.maxScore) * 100) : 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="index" tick={{ fontSize: 12 }} label={{ value: "答题序号", position: "insideBottom", offset: -5 }} />
                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} label={{ value: "得分率%", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value: number) => [`${value}%`, "得分率"]} />
                        <Bar dataKey="percentage" fill="#34c759" radius={[4, 4, 0, 0]} name="得分率" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {analytics.topicStats.length === 0 && analytics.recentGraded.length === 0 && (
                <div className="text-center py-20">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                  <p className="mt-4 text-lg text-muted-foreground">暂无数据</p>
                  <p className="mt-1 text-sm text-muted-foreground/70">学生开始答题后，数据将在此展示</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
