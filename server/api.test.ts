import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1, openId: "admin-user", email: "admin@example.com", name: "Admin",
    loginMethod: "manus", role: "admin",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: (name: string, options: Record<string, unknown>) => { clearedCookies.push({ name, options }); } } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2, openId: "regular-user", email: "user@example.com", name: "Student",
    loginMethod: "manus", role: "user",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

// ============ Auth Tests ============
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns user data when authenticated", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Admin");
    expect(result?.role).toBe("admin");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ============ Topic Tests ============
describe("topic", () => {
  it("list returns an array for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.topic.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topic.create({ name: "Test" })).rejects.toThrow();
  });

  it("create throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topic.create({ name: "Test" })).rejects.toThrow();
  });

  it("getById throws NOT_FOUND for non-existent topic", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topic.getById({ id: 999999 })).rejects.toThrow();
  });

  it("update throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topic.update({ id: 1, name: "Updated" })).rejects.toThrow();
  });

  it("delete throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topic.delete({ id: 1 })).rejects.toThrow();
  });
});

// ============ Article Tests ============
describe("article", () => {
  it("listByTopic returns an array", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.article.listByTopic({ topicId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getById throws NOT_FOUND for non-existent article", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.article.getById({ id: 999999 })).rejects.toThrow();
  });

  it("create throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.article.create({ topicId: 1, title: "Test", content: "Content" })).rejects.toThrow();
  });

  it("update throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.article.update({ id: 1, title: "Updated" })).rejects.toThrow();
  });

  it("delete throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.article.delete({ id: 1 })).rejects.toThrow();
  });
});

// ============ Question Tests ============
describe("question", () => {
  it("listByArticle returns an array", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.question.listByArticle({ articleId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.question.create({ articleId: 1, questionText: "Q?", standardAnswer: "A" })).rejects.toThrow();
  });

  it("update throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.question.update({ id: 1, questionText: "Updated?" })).rejects.toThrow();
  });

  it("delete throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.question.delete({ id: 1 })).rejects.toThrow();
  });
});

// ============ Submission Tests ============
describe("submission", () => {
  it("submit throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.submission.submit({ articleId: 1, answers: [{ questionId: 1, answerText: "test" }] })).rejects.toThrow();
  });

  it("submit returns empty submissionIds when questions don't exist", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submission.submit({ articleId: 999999, answers: [{ questionId: 999999, answerText: "test" }] });
    expect(result.submissionIds).toEqual([]);
  });

  it("grade throws NOT_FOUND for non-existent submission", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.submission.grade({ submissionId: 999999 })).rejects.toThrow();
  });

  it("myHistory returns an array for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submission.myHistory({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("myHistory throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.submission.myHistory({ limit: 10 })).rejects.toThrow();
  });

  it("myArticleSubmissions returns an array", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submission.myArticleSubmissions({ articleId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getGrading returns undefined for non-existent submission", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submission.getGrading({ submissionId: 999999 });
    expect(result).toBeUndefined();
  });

  it("gradeAll returns empty results for non-existent submissions", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submission.gradeAll({ submissionIds: [999999] });
    expect(result.results).toEqual([]);
  });
});

// ============ Voice Tests ============
describe("voice", () => {
  it("transcribe throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.voice.transcribe({ audioUrl: "https://example.com/audio.webm" })).rejects.toThrow();
  });

  it("transcribe throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.voice.transcribe({ audioUrl: "https://example.com/audio.webm" })).rejects.toThrow();
  });
});

// ============ Analytics Tests ============
describe("analytics", () => {
  it("studentStats returns stats for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.studentStats();
    expect(result).toBeDefined();
    if (result) {
      expect(typeof result.totalSubmissions).toBe("number");
      expect(typeof result.gradedSubmissions).toBe("number");
    }
  });

  it("studentStats throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.studentStats()).rejects.toThrow();
  });

  it("adminDashboard throws FORBIDDEN for regular users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.adminDashboard()).rejects.toThrow();
  });

  it("adminDashboard throws UNAUTHORIZED for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.adminDashboard()).rejects.toThrow();
  });

  it("adminDashboard returns data for admin users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.adminDashboard();
    expect(result).toBeDefined();
    if (result) {
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.totalSubmissions).toBe("number");
      expect(typeof result.totalArticles).toBe("number");
      expect(typeof result.totalTopics).toBe("number");
      expect(Array.isArray(result.topicStats)).toBe(true);
      expect(Array.isArray(result.recentGraded)).toBe(true);
    }
  });
});
