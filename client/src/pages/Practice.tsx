import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function Practice() {
  const { isAuthenticated } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const articleId = Number(params.id);

  const { data: article, isLoading: articleLoading } = trpc.article.getById.useQuery({ id: articleId });
  const { data: questionsList, isLoading: questionsLoading } = trpc.question.listByArticle.useQuery({ articleId });

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.submission.submit.useMutation();
  const gradeAllMutation = trpc.submission.gradeAll.useMutation();

  const allAnswered = useMemo(() => {
    if (!questionsList) return false;
    return questionsList.every((q) => answers[q.id]?.trim());
  }, [questionsList, answers]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!questionsList || !allAnswered) return;

    try {
      const answerList = questionsList.map((q) => ({
        questionId: q.id,
        answerText: answers[q.id] || "",
      }));

      const result = await submitMutation.mutateAsync({ articleId, answers: answerList });
      setSubmitted(true);
      toast.success("答案已提交，正在 AI 批阅中...");

      // Start grading
      const gradingResult = await gradeAllMutation.mutateAsync({ submissionIds: result.submissionIds });
      toast.success("批阅完成！");
      navigate(`/result/${result.submissionIds.join(",")}`);
    } catch (error) {
      toast.error("提交失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container py-8 max-w-4xl mx-auto">
        <Link href={article ? `/topics/${article.topicId}` : "/topics"}>
          <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Button>
        </Link>

        {articleLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        ) : article ? (
          <>
            {/* Article Content */}
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{article.title}</h1>
              {article.author && (
                <p className="mt-2 text-muted-foreground">作者：{article.author}</p>
              )}
              <div className="mt-6 bg-[#f5f5f7] rounded-2xl p-6 sm:p-8">
                <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>
              {article.source && (
                <p className="mt-3 text-xs text-muted-foreground text-right">来源：{article.source}</p>
              )}
            </div>

            {/* Questions */}
            {questionsLoading ? (
              <div className="animate-pulse space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-muted rounded-2xl h-40" />
                ))}
              </div>
            ) : questionsList && questionsList.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">阅读理解题目</h2>
                {questionsList.map((question, idx) => (
                  <div key={question.id} className="bg-[#f5f5f7] rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-base font-medium leading-relaxed">
                          {question.questionText}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          （{question.maxScore} 分）
                        </p>
                        <textarea
                          className="mt-3 w-full min-h-[120px] p-4 rounded-xl border border-border bg-white text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="请在此输入你的答案..."
                          value={answers[question.id] || ""}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                          disabled={submitted}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Submit */}
                <div className="flex justify-center pt-4 pb-8">
                  {submitted ? (
                    <div className="flex items-center gap-2 text-primary">
                      {gradeAllMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-lg font-medium">AI 正在批阅中...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-lg font-medium">批阅完成</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="rounded-full px-10 h-12 text-base font-medium"
                      disabled={!allAnswered || submitMutation.isPending}
                      onClick={handleSubmit}
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {!isAuthenticated ? "登录后提交" : "提交答案"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">该文章暂无题目</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
