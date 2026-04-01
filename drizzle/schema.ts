import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }),
  color: varchar("color", { length: 20 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  articleCount: int("articleCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 100 }),
  content: text("content").notNull(),
  source: varchar("source", { length: 255 }),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  questionCount: int("questionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  questionText: text("questionText").notNull(),
  standardAnswer: text("standardAnswer").notNull(),
  scoringCriteria: text("scoringCriteria"),
  maxScore: int("maxScore").default(10).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  questionId: int("questionId").notNull(),
  answerText: text("answerText").notNull(),
  score: decimal("score", { precision: 5, scale: 1 }),
  maxScore: int("maxScore").default(10).notNull(),
  status: mysqlEnum("status", ["pending", "grading", "graded", "error"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export const gradings = mysqlTable("gradings", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  score: decimal("score", { precision: 5, scale: 1 }).notNull(),
  comment: text("comment").notNull(),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  suggestions: text("suggestions"),
  gradedAt: timestamp("gradedAt").defaultNow().notNull(),
});

export type Grading = typeof gradings.$inferSelect;
export type InsertGrading = typeof gradings.$inferInsert;
