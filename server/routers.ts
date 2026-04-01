import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可执行此操作" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  topic: router({
    list: publicProcedure.query(async () => db.getAllTopics()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const topic = await db.getTopicById(input.id);
      if (!topic) throw new TRPCError({ code: "NOT_FOUND", message: "专题不存在" });
      return topic;
    }),
    create: adminProcedure.input(z.object({ name: z.string().min(1), description: z.string().optional(), icon: z.string().optional(), color: z.string().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => ({ id: await db.createTopic(input) })),
    update: adminProcedure.input(z.object({ id: z.number(), name: z.string().min(1).optional(), description: z.string().optional(), icon: z.string().optional(), color: z.string().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateTopic(id, data); return { success: true }; }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteTopic(input.id); return { success: true }; }),
  }),

  article: router({
    listByTopic: publicProcedure.input(z.object({ topicId: z.number() })).query(async ({ input }) => db.getArticlesByTopicId(input.topicId)),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const article = await db.getArticleById(input.id);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "文章不存在" });
      return article;
    }),
    create: adminProcedure.input(z.object({ topicId: z.number(), title: z.string().min(1), author: z.string().optional(), content: z.string().min(1), source: z.string().optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional() })).mutation(async ({ input }) => ({ id: await db.createArticle(input) })),
    update: adminProcedure.input(z.object({ id: z.number(), topicId: z.number().optional(), title: z.string().min(1).optional(), author: z.string().optional(), content: z.string().min(1).optional(), source: z.string().optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateArticle(id, data); return { success: true }; }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteArticle(input.id); return { success: true }; }),
  }),

  question: router({
    listByArticle: publicProcedure.input(z.object({ articleId: z.number() })).query(async ({ input }) => db.getQuestionsByArticleId(input.articleId)),
    create: adminProcedure.input(z.object({ articleId: z.number(), questionText: z.string().min(1), standardAnswer: z.string().min(1), scoringCriteria: z.string().optional(), maxScore: z.number().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => ({ id: await db.createQuestion(input) })),
    update: adminProcedure.input(z.object({ id: z.number(), questionText: z.string().min(1).optional(), standardAnswer: z.string().min(1).optional(), scoringCriteria: z.string().optional(), maxScore: z.number().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateQuestion(id, data); return { success: true }; }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteQuestion(input.id); return { success: true }; }),
  }),

  submission: router({
    submit: protectedProcedure.input(z.object({ articleId: z.number(), answers: z.array(z.object({ questionId: z.number(), answerText: z.string().min(1) })) })).mutation(async ({ ctx, input }) => {
      const submissionIds: number[] = [];
      for (const answer of input.answers) {
        const question = await db.getQuestionById(answer.questionId);
        if (!question) continue;
        const id = await db.createSubmission({ userId: ctx.user.id, articleId: input.articleId, questionId: answer.questionId, answerText: answer.answerText, maxScore: question.maxScore, status: "pending" });
        submissionIds.push(id);
      }
      return { submissionIds };
    }),

    grade: protectedProcedure.input(z.object({ submissionId: z.number() })).mutation(async ({ input }) => {
      const submission = await db.getSubmissionById(input.submissionId);
      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "答题记录不存在" });
      const question = await db.getQuestionById(submission.questionId);
      if (!question) throw new TRPCError({ code: "NOT_FOUND", message: "题目不存在" });
      const article = await db.getArticleById(submission.articleId);
      await db.updateSubmission(input.submissionId, { status: "grading" });
      try {
        const prompt = `你是一位高中语文教师，正在批阅学生的现代文阅读理解答案。

## 文章信息
标题：${article?.title ?? "未知"}
作者：${article?.author ?? "未知"}

## 题目
${question.questionText}

## 标准答案
${question.standardAnswer}

## 评分标准
${question.scoringCriteria || "根据答案的完整性、准确性和表达能力进行评分"}

## 满分
${question.maxScore}分

## 学生答案
${submission.answerText}

请以JSON格式返回评分结果。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位经验丰富的高中语文教师，擅长批阅现代文阅读理解题目。请严格按照JSON格式返回评分结果。" },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_schema", json_schema: { name: "grading_result", strict: true, schema: { type: "object", properties: { score: { type: "number" }, comment: { type: "string" }, strengths: { type: "string" }, weaknesses: { type: "string" }, suggestions: { type: "string" } }, required: ["score", "comment", "strengths", "weaknesses", "suggestions"], additionalProperties: false } } },
        });
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new Error("AI 返回内容为空");
        const gradingResult = JSON.parse(content);
        const score = Math.min(Math.max(0, gradingResult.score), question.maxScore);
        await db.createGrading({ submissionId: input.submissionId, score: String(score), comment: gradingResult.comment, strengths: gradingResult.strengths, weaknesses: gradingResult.weaknesses, suggestions: gradingResult.suggestions });
        await db.updateSubmission(input.submissionId, { status: "graded", score: String(score) });
        return { score, maxScore: question.maxScore, comment: gradingResult.comment, strengths: gradingResult.strengths, weaknesses: gradingResult.weaknesses, suggestions: gradingResult.suggestions };
      } catch (error) {
        await db.updateSubmission(input.submissionId, { status: "error" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 批阅失败，请稍后重试" });
      }
    }),

    gradeAll: protectedProcedure.input(z.object({ submissionIds: z.array(z.number()) })).mutation(async ({ input }) => {
      const results = [];
      for (const submissionId of input.submissionIds) {
        const submission = await db.getSubmissionById(submissionId);
        if (!submission) continue;
        const question = await db.getQuestionById(submission.questionId);
        if (!question) continue;
        const article = await db.getArticleById(submission.articleId);
        await db.updateSubmission(submissionId, { status: "grading" });
        try {
          const prompt = `你是一位高中语文教师，正在批阅学生的现代文阅读理解答案。

## 文章信息
标题：${article?.title ?? "未知"}
作者：${article?.author ?? "未知"}

## 题目
${question.questionText}

## 标准答案
${question.standardAnswer}

## 评分标准
${question.scoringCriteria || "根据答案的完整性、准确性和表达能力进行评分"}

## 满分
${question.maxScore}分

## 学生答案
${submission.answerText}

请以JSON格式返回评分结果。`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "你是一位经验丰富的高中语文教师，擅长批阅现代文阅读理解题目。请严格按照JSON格式返回评分结果。" },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_schema", json_schema: { name: "grading_result", strict: true, schema: { type: "object", properties: { score: { type: "number" }, comment: { type: "string" }, strengths: { type: "string" }, weaknesses: { type: "string" }, suggestions: { type: "string" } }, required: ["score", "comment", "strengths", "weaknesses", "suggestions"], additionalProperties: false } } },
          });
          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== "string") throw new Error("AI 返回内容为空");
          const gradingResult = JSON.parse(content);
          const score = Math.min(Math.max(0, gradingResult.score), question.maxScore);
          await db.createGrading({ submissionId, score: String(score), comment: gradingResult.comment, strengths: gradingResult.strengths, weaknesses: gradingResult.weaknesses, suggestions: gradingResult.suggestions });
          await db.updateSubmission(submissionId, { status: "graded", score: String(score) });
          results.push({ submissionId, score, maxScore: question.maxScore, comment: gradingResult.comment, strengths: gradingResult.strengths, weaknesses: gradingResult.weaknesses, suggestions: gradingResult.suggestions });
        } catch (error) {
          await db.updateSubmission(submissionId, { status: "error" });
          results.push({ submissionId, error: "批阅失败" });
        }
      }
      return { results };
    }),

    myHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ ctx, input }) => db.getUserSubmissions(ctx.user.id, input.limit ?? 50)),
    myArticleSubmissions: protectedProcedure.input(z.object({ articleId: z.number() })).query(async ({ ctx, input }) => db.getUserSubmissionsByArticle(ctx.user.id, input.articleId)),
    getGrading: protectedProcedure.input(z.object({ submissionId: z.number() })).query(async ({ input }) => db.getGradingBySubmissionId(input.submissionId)),
  }),

  voice: router({
    transcribe: adminProcedure.input(z.object({ audioUrl: z.string().url(), language: z.string().optional() })).mutation(async ({ input }) => {
      const result = await transcribeAudio({ audioUrl: input.audioUrl, language: input.language ?? "zh", prompt: "这是一段高中现代文阅读材料或题目内容的朗读" });
      if ("error" in result) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      return { text: result.text, language: result.language };
    }),
  }),

  analytics: router({
    studentStats: protectedProcedure.query(async ({ ctx }) => db.getStudentStats(ctx.user.id)),
    adminDashboard: adminProcedure.query(async () => db.getAdminAnalytics()),
  }),
});

export type AppRouter = typeof appRouter;
