import { eq, desc, sql, and, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  topics, InsertTopic,
  articles, InsertArticle,
  questions, InsertQuestion,
  submissions, InsertSubmission,
  gradings, InsertGrading,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Helpers ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Topic Helpers ============

export async function getAllTopics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(topics).orderBy(topics.sortOrder);
}

export async function getTopicById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
  return result[0];
}

export async function createTopic(data: InsertTopic) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(topics).values(data);
  return result[0].insertId;
}

export async function updateTopic(id: number, data: Partial<InsertTopic>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(topics).set(data).where(eq(topics.id, id));
}

export async function deleteTopic(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(topics).where(eq(topics.id, id));
}

// ============ Article Helpers ============

export async function getArticlesByTopicId(topicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles).where(eq(articles.topicId, topicId)).orderBy(desc(articles.createdAt));
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0];
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(data);
  await db.update(topics).set({ articleCount: sql`${topics.articleCount} + 1` }).where(eq(topics.id, data.topicId));
  return result[0].insertId;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const article = await getArticleById(id);
  if (article) {
    await db.delete(articles).where(eq(articles.id, id));
    await db.update(topics).set({ articleCount: sql`GREATEST(${topics.articleCount} - 1, 0)` }).where(eq(topics.id, article.topicId));
  }
}

// ============ Question Helpers ============

export async function getQuestionsByArticleId(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.articleId, articleId)).orderBy(questions.sortOrder);
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result[0];
}

export async function createQuestion(data: InsertQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(questions).values(data);
  await db.update(articles).set({ questionCount: sql`${articles.questionCount} + 1` }).where(eq(articles.id, data.articleId));
  return result[0].insertId;
}

export async function updateQuestion(id: number, data: Partial<InsertQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(questions).set(data).where(eq(questions.id, id));
}

export async function deleteQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const question = await getQuestionById(id);
  if (question) {
    await db.delete(questions).where(eq(questions.id, id));
    await db.update(articles).set({ questionCount: sql`GREATEST(${articles.questionCount} - 1, 0)` }).where(eq(articles.id, question.articleId));
  }
}

// ============ Submission Helpers ============

export async function createSubmission(data: InsertSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(submissions).values(data);
  return result[0].insertId;
}

export async function updateSubmission(id: number, data: Partial<InsertSubmission>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(submissions).set(data).where(eq(submissions.id, id));
}

export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return result[0];
}

export async function getUserSubmissions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(eq(submissions.userId, userId)).orderBy(desc(submissions.createdAt)).limit(limit);
}

export async function getUserSubmissionsByArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(and(eq(submissions.userId, userId), eq(submissions.articleId, articleId))).orderBy(desc(submissions.createdAt));
}

// ============ Grading Helpers ============

export async function createGrading(data: InsertGrading) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gradings).values(data);
  return result[0].insertId;
}

export async function getGradingBySubmissionId(submissionId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gradings).where(eq(gradings.submissionId, submissionId)).limit(1);
  return result[0];
}

// ============ Analytics Helpers ============

export async function getStudentStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const totalSubmissions = await db.select({ count: count() }).from(submissions).where(eq(submissions.userId, userId));
  const gradedSubmissions = await db.select({ count: count() }).from(submissions).where(and(eq(submissions.userId, userId), eq(submissions.status, "graded")));
  return {
    totalSubmissions: totalSubmissions[0]?.count ?? 0,
    gradedSubmissions: gradedSubmissions[0]?.count ?? 0,
  };
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return null;
  const totalUsers = await db.select({ count: count() }).from(users);
  const totalSubmissions = await db.select({ count: count() }).from(submissions);
  const totalArticles = await db.select({ count: count() }).from(articles);
  const totalTopics = await db.select({ count: count() }).from(topics);
  const topicStats = await db
    .select({ topicId: articles.topicId, topicName: topics.name, submissionCount: count(submissions.id) })
    .from(submissions)
    .innerJoin(articles, eq(submissions.articleId, articles.id))
    .innerJoin(topics, eq(articles.topicId, topics.id))
    .groupBy(articles.topicId, topics.name);
  const recentGraded = await db
    .select({ submissionId: submissions.id, userId: submissions.userId, score: submissions.score, maxScore: submissions.maxScore, createdAt: submissions.createdAt, articleId: submissions.articleId })
    .from(submissions)
    .where(eq(submissions.status, "graded"))
    .orderBy(desc(submissions.createdAt))
    .limit(100);
  return { totalUsers: totalUsers[0]?.count ?? 0, totalSubmissions: totalSubmissions[0]?.count ?? 0, totalArticles: totalArticles[0]?.count ?? 0, totalTopics: totalTopics[0]?.count ?? 0, topicStats, recentGraded };
}
