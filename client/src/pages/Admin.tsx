import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Mic, MicOff, Upload, Save, X, BookOpen, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";


type Tab = "topics" | "articles" | "questions";

export default function Admin() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState<Tab>("topics");

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

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: "topics", label: "专题管理", icon: BookOpen },
    { key: "articles", label: "文章管理", icon: FileText },
    { key: "questions", label: "题目管理", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-white to-[#f5f5f7] pt-12 pb-6">
        <div className="container">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">管理后台</h1>
          <p className="mt-2 text-muted-foreground">管理专题、文章和题目</p>

          <div className="mt-6 flex gap-1 bg-muted rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-[#f5f5f7]">
        <div className="container">
          {activeTab === "topics" && <TopicsManager />}
          {activeTab === "articles" && <ArticlesManager />}
          {activeTab === "questions" && <QuestionsManager />}
        </div>
      </section>
    </div>
  );
}

// ============ Topics Manager ============
function TopicsManager() {
  const utils = trpc.useUtils();
  const { data: topicsList } = trpc.topic.list.useQuery();
  const createMutation = trpc.topic.create.useMutation({ onSuccess: () => utils.topic.list.invalidate() });
  const deleteMutation = trpc.topic.delete.useMutation({ onSuccess: () => utils.topic.list.invalidate() });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "", color: "#0071e3" });

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("请输入专题名称");
    await createMutation.mutateAsync(form);
    setForm({ name: "", description: "", icon: "", color: "#0071e3" });
    setShowForm(false);
    toast.success("专题创建成功");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">专题列表</h2>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-full gap-1">
          <Plus className="w-4 h-4" /> 新建专题
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">新建专题</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="专题名称 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="图标（emoji）" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <Input placeholder="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">颜色：</label>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded border-0" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-full">
              <Save className="w-4 h-4 mr-1" /> 保存
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">取消</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {topicsList?.map((topic) => (
          <div key={topic.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{topic.icon || "📖"}</span>
              <div>
                <p className="font-medium">{topic.name}</p>
                <p className="text-xs text-muted-foreground">{topic.articleCount} 篇文章</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={async () => {
                if (confirm("确定删除此专题？")) {
                  await deleteMutation.mutateAsync({ id: topic.id });
                  toast.success("已删除");
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Articles Manager ============
function ArticlesManager() {
  const utils = trpc.useUtils();
  const { data: topicsList } = trpc.topic.list.useQuery();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const { data: articlesList } = trpc.article.listByTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );
  const createMutation = trpc.article.create.useMutation({
    onSuccess: () => {
      utils.article.listByTopic.invalidate();
      utils.topic.list.invalidate();
    },
  });
  const deleteMutation = trpc.article.delete.useMutation({
    onSuccess: () => {
      utils.article.listByTopic.invalidate();
      utils.topic.list.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", content: "", source: "", difficulty: "medium" as "easy" | "medium" | "hard" });

  const handleCreate = async () => {
    if (!selectedTopicId) return toast.error("请先选择专题");
    if (!form.title.trim() || !form.content.trim()) return toast.error("标题和内容不能为空");
    await createMutation.mutateAsync({ topicId: selectedTopicId, ...form });
    setForm({ title: "", author: "", content: "", source: "", difficulty: "medium" });
    setShowForm(false);
    toast.success("文章创建成功");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">文章管理</h2>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-full gap-1" disabled={!selectedTopicId}>
          <Plus className="w-4 h-4" /> 新建文章
        </Button>
      </div>

      {/* Topic Selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {topicsList?.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTopicId === topic.id
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground hover:bg-muted"
            }`}
          >
            {topic.icon} {topic.name}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">新建文章</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="文章标题 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="作者" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <textarea
              className="w-full min-h-[200px] p-4 rounded-xl border border-border text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="文章内容 *"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <VoiceInput onTranscribed={(text) => setForm({ ...form, content: form.content + text })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="来源" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              <select
                className="h-10 px-3 rounded-lg border border-border text-sm"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as "easy" | "medium" | "hard" })}
              >
                <option value="easy">基础</option>
                <option value="medium">进阶</option>
                <option value="hard">挑战</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-full">
              <Save className="w-4 h-4 mr-1" /> 保存
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">取消</Button>
          </div>
        </div>
      )}

      {selectedTopicId && (
        <div className="space-y-3">
          {articlesList?.map((article) => (
            <div key={article.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{article.title}</p>
                <p className="text-xs text-muted-foreground">
                  {article.author && `${article.author} · `}{article.questionCount} 道题目
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/questions/${article.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">管理题目</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (confirm("确定删除此文章？")) {
                      await deleteMutation.mutateAsync({ id: article.id });
                      toast.success("已删除");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {articlesList?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">该专题暂无文章</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Questions Manager ============
function QuestionsManager() {
  const utils = trpc.useUtils();
  const { data: topicsList } = trpc.topic.list.useQuery();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const { data: articlesList } = trpc.article.listByTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const { data: questionsList } = trpc.question.listByArticle.useQuery(
    { articleId: selectedArticleId! },
    { enabled: !!selectedArticleId }
  );
  const createMutation = trpc.question.create.useMutation({
    onSuccess: () => {
      utils.question.listByArticle.invalidate();
      utils.article.listByTopic.invalidate();
    },
  });
  const deleteMutation = trpc.question.delete.useMutation({
    onSuccess: () => {
      utils.question.listByArticle.invalidate();
      utils.article.listByTopic.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ questionText: "", standardAnswer: "", scoringCriteria: "", maxScore: 10 });

  const handleCreate = async () => {
    if (!selectedArticleId) return toast.error("请先选择文章");
    if (!form.questionText.trim() || !form.standardAnswer.trim()) return toast.error("题目和标准答案不能为空");
    await createMutation.mutateAsync({ articleId: selectedArticleId, ...form });
    setForm({ questionText: "", standardAnswer: "", scoringCriteria: "", maxScore: 10 });
    setShowForm(false);
    toast.success("题目创建成功");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">题目管理</h2>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-full gap-1" disabled={!selectedArticleId}>
          <Plus className="w-4 h-4" /> 新建题目
        </Button>
      </div>

      {/* Topic Selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {topicsList?.map((topic) => (
          <button
            key={topic.id}
            onClick={() => { setSelectedTopicId(topic.id); setSelectedArticleId(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTopicId === topic.id ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-muted"
            }`}
          >
            {topic.icon} {topic.name}
          </button>
        ))}
      </div>

      {/* Article Selector */}
      {selectedTopicId && articlesList && (
        <div className="flex gap-2 flex-wrap mb-6">
          {articlesList.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticleId(article.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedArticleId === article.id ? "bg-foreground text-background" : "bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {article.title}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">新建题目</h3>
          <div className="space-y-4">
            <textarea
              className="w-full min-h-[80px] p-4 rounded-xl border border-border text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="题目内容 *"
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            />
            <VoiceInput onTranscribed={(text) => setForm({ ...form, questionText: form.questionText + text })} label="语音录入题目" />
            <textarea
              className="w-full min-h-[80px] p-4 rounded-xl border border-border text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="标准答案 *"
              value={form.standardAnswer}
              onChange={(e) => setForm({ ...form, standardAnswer: e.target.value })}
            />
            <VoiceInput onTranscribed={(text) => setForm({ ...form, standardAnswer: form.standardAnswer + text })} label="语音录入答案" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="评分标准（可选）" value={form.scoringCriteria} onChange={(e) => setForm({ ...form, scoringCriteria: e.target.value })} />
              <Input type="number" placeholder="满分" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-full">
              <Save className="w-4 h-4 mr-1" /> 保存
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">取消</Button>
          </div>
        </div>
      )}

      {selectedArticleId && (
        <div className="space-y-3">
          {questionsList?.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-sm">{q.questionText}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground ml-8">标准答案：{q.standardAnswer.substring(0, 80)}...</p>
                  <p className="text-xs text-muted-foreground ml-8">满分：{q.maxScore} 分</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (confirm("确定删除此题目？")) {
                      await deleteMutation.mutateAsync({ id: q.id });
                      toast.success("已删除");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {questionsList?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">该文章暂无题目</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Voice Input Component ============
function VoiceInput({ onTranscribed, label = "语音录入" }: { onTranscribed: (text: string) => void; label?: string }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size > 16 * 1024 * 1024) {
          toast.error("录音文件过大，请缩短录音时间");
          return;
        }

        setProcessing(true);
        try {
          // Upload to S3 first
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");

          const response = await fetch("/api/upload-audio", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("上传失败");
          const { url } = await response.json();

          // Transcribe
          const result = await transcribeMutation.mutateAsync({ audioUrl: url });
          onTranscribed(result.text);
          toast.success("语音转文字完成");
        } catch (error) {
          toast.error("语音处理失败，请重试");
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      toast.error("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size="sm"
        className="rounded-full gap-1.5"
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
      >
        {processing ? (
          <span className="animate-pulse">处理中...</span>
        ) : recording ? (
          <>
            <MicOff className="w-3.5 h-3.5" /> 停止录音
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" /> {label}
          </>
        )}
      </Button>
      {recording && (
        <span className="text-xs text-red-500 animate-pulse">● 录音中...</span>
      )}
    </div>
  );
}
