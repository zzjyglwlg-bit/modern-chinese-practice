import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const difficultyLabel: Record<string, string> = { easy: "基础", medium: "进阶", hard: "挑战" };
const difficultyColor: Record<string, string> = { easy: "text-green-600 bg-green-50", medium: "text-blue-600 bg-blue-50", hard: "text-red-600 bg-red-50" };

export default function TopicDetail() {
  const params = useParams<{ id: string }>();
  const topicId = Number(params.id);
  const { data: topic, isLoading: topicLoading } = trpc.topic.getById.useQuery({ id: topicId });
  const { data: articlesList, isLoading: articlesLoading } = trpc.article.listByTopic.useQuery({ topicId });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-b from-white to-[#f5f5f7] pt-12 pb-10">
        <div className="container">
          <Link href="/topics">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground gap-1">
              <ArrowLeft className="w-4 h-4" /> 返回专题
            </Button>
          </Link>
          {topicLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded w-48" />
              <div className="mt-3 h-5 bg-muted rounded w-96" />
            </div>
          ) : topic ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.icon || "📖"}</span>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{topic.name}</h1>
              </div>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
                {topic.description || "选择一篇文章开始练习"}
              </p>
            </>
          ) : null}
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 bg-[#f5f5f7]">
        <div className="container">
          {articlesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="mt-3 h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : articlesList && articlesList.length > 0 ? (
            <div className="space-y-4">
              {articlesList.map((article) => (
                <Link key={article.id} href={`/practice/${article.id}`}>
                  <div className="group bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[article.difficulty]}`}>
                            {difficultyLabel[article.difficulty]}
                          </span>
                        </div>
                        {article.author && (
                          <p className="mt-1 text-sm text-muted-foreground">作者：{article.author}</p>
                        )}
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {article.content.substring(0, 120)}...
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{article.questionCount} 道题目</span>
                          {article.source && <span>来源：{article.source}</span>}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 flex-shrink-0 ml-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <p className="mt-4 text-lg text-muted-foreground">暂无文章</p>
              <p className="mt-1 text-sm text-muted-foreground/70">管理员可在后台添加阅读文章</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
