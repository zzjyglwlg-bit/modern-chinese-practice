import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Topics() {
  const { data: topicsList, isLoading } = trpc.topic.list.useQuery();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-b from-white to-[#f5f5f7] pt-16 pb-12">
        <div className="container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">专题练习</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            选择一个文体专题，开始系统化的阅读训练
          </p>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-12 bg-[#f5f5f7]">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="mt-4 h-6 bg-muted rounded w-1/2" />
                  <div className="mt-2 h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : topicsList && topicsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicsList.map((topic) => (
                <Link key={topic.id} href={`/topics/${topic.id}`}>
                  <div className="group bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start justify-between">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: (topic.color || "#0071e3") + "15" }}
                      >
                        {topic.icon || "📖"}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        {topic.articleCount} 篇
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {topic.description || "暂无描述"}
                    </p>
                    <div className="mt-5 flex items-center text-primary text-sm font-medium">
                      进入专题 <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <p className="mt-4 text-lg text-muted-foreground">暂无专题</p>
              <p className="mt-1 text-sm text-muted-foreground/70">管理员可在后台添加专题分类</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
