import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, Lightbulb, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Streamdown } from "streamdown";

export default function Result() {
  const params = useParams<{ ids: string }>();
  const submissionIds = useMemo(() => params.ids?.split(",").map(Number).filter(Boolean) || [], [params.ids]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container py-8 max-w-4xl mx-auto">
        <Link href="/history">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground gap-1">
            <ArrowLeft className="w-4 h-4" /> 练习记录
          </Button>
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">批阅结果</h1>

        <div className="space-y-6">
          {submissionIds.map((id, idx) => (
            <GradingCard key={id} submissionId={id} index={idx + 1} />
          ))}
        </div>

        <div className="flex justify-center gap-4 pt-8 pb-12">
          <Link href="/topics">
            <Button variant="outline" className="rounded-full px-8">
              继续练习
            </Button>
          </Link>
          <Link href="/history">
            <Button className="rounded-full px-8">
              查看历史
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function GradingCard({ submissionId, index }: { submissionId: number; index: number }) {
  const { data: grading, isLoading } = trpc.submission.getGrading.useQuery({ submissionId });

  if (isLoading) {
    return (
      <div className="bg-[#f5f5f7] rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/4 mb-4" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    );
  }

  if (!grading) {
    return (
      <div className="bg-[#f5f5f7] rounded-2xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <span>第 {index} 题：批阅结果暂不可用</span>
        </div>
      </div>
    );
  }

  const scoreNum = Number(grading.score);
  const scoreColor = scoreNum >= 8 ? "text-green-600" : scoreNum >= 5 ? "text-amber-600" : "text-red-600";
  const scoreBg = scoreNum >= 8 ? "bg-green-50" : scoreNum >= 5 ? "bg-amber-50" : "bg-red-50";

  return (
    <div className="bg-[#f5f5f7] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">第 {index} 题</h3>
        <div className={`px-4 py-2 rounded-full font-bold text-lg ${scoreColor} ${scoreBg}`}>
          {grading.score} 分
        </div>
      </div>

      {/* Comment */}
      <div className="bg-white rounded-xl p-4 mb-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm leading-relaxed">
            <Streamdown>{grading.comment}</Streamdown>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Strengths */}
        {grading.strengths && (
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">优点</span>
            </div>
            <p className="text-xs text-green-800 leading-relaxed">{grading.strengths}</p>
          </div>
        )}

        {/* Weaknesses */}
        {grading.weaknesses && (
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-700">不足</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">{grading.weaknesses}</p>
          </div>
        )}

        {/* Suggestions */}
        {grading.suggestions && (
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">建议</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">{grading.suggestions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
