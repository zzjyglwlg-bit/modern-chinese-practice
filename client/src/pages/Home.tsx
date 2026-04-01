import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BookOpen, Brain, BarChart3, Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: BookOpen,
    title: "专题分类练习",
    desc: "按记叙文、议论文、说明文等文体分类，系统化提升阅读能力",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Brain,
    title: "AI 智能批阅",
    desc: "接入 DeepSeek 大语言模型，提供专业的评分和个性化点评",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "成绩追踪分析",
    desc: "完整的练习记录和数据分析，清晰了解学习进度与薄弱环节",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Sparkles,
    title: "即时反馈",
    desc: "提交答案后即刻获得 AI 评分、优缺点分析和改进建议",
    color: "bg-amber-50 text-amber-600",
  },
];

const difficultyLabel: Record<string, string> = {
  easy: "基础",
  medium: "进阶",
  hard: "挑战",
};

const difficultyColor: Record<string, string> = {
  easy: "text-green-600 bg-green-50",
  medium: "text-blue-600 bg-blue-50",
  hard: "text-red-600 bg-red-50",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: topicsList } = trpc.topic.list.useQuery();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Apple style */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#f5f5f7] pt-20 pb-24">
        <div className="container text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            现代文阅读
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
            AI 驱动的智能练习与批阅平台
          </p>
          <p className="mt-3 text-base text-muted-foreground/80 max-w-xl mx-auto">
            专题分类 · 智能评分 · 即时反馈 · 成绩追踪
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/topics">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium">
                开始练习
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base font-medium"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                登录账号
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">
            为什么选择我们
          </h2>
          <p className="mt-3 text-muted-foreground text-center text-lg max-w-xl mx-auto">
            融合 AI 技术与语文教学经验，让阅读理解练习更高效
          </p>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      {topicsList && topicsList.length > 0 && (
        <section className="py-20 bg-[#f5f5f7]">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  专题分类
                </h2>
                <p className="mt-2 text-muted-foreground text-lg">
                  选择一个专题，开始你的阅读训练
                </p>
              </div>
              <Link href="/topics">
                <Button variant="ghost" className="text-primary gap-1">
                  查看全部 <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicsList.slice(0, 6).map((topic) => (
                <Link key={topic.id} href={`/topics/${topic.id}`}>
                  <div className="group bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start justify-between">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: (topic.color || "#0071e3") + "15" }}
                      >
                        {topic.icon || "📖"}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {topic.articleCount} 篇文章
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {topic.description || "暂无描述"}
                    </p>
                    <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      开始练习 <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            准备好提升阅读能力了吗？
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-lg mx-auto">
            立即开始练习，让 AI 帮你找到进步的方向
          </p>
          <div className="mt-8">
            <Link href="/topics">
              <Button size="lg" className="rounded-full px-10 h-12 text-base font-medium">
                立即开始
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-[#f5f5f7] py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>现代文阅读练习平台 · AI 智能批阅</p>
        </div>
      </footer>
    </div>
  );
}
