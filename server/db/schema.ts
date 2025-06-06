// Drizzle ORM and Zod schemas for recommendations, analysis, users, etc.
// This file is for server-side use only.
import { pgTable, text, timestamp, jsonb, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Using text for Firebase auth ID
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  photo_url: text("photo_url"),
  created_at: timestamp("created_at").defaultNow(),
  dark_mode: boolean("dark_mode").default(false),
  language: text("language").default("en"),
});

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(chatConversations),
  analysisResults: many(analysisResults),
  recommendationSets: many(recommendationSets),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  created_at: true,
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().notNull().$defaultFn(() => uuidv4()),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.user_id],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().notNull().$defaultFn(() => uuidv4()),
  conversation_id: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversation_id],
    references: [chatConversations.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  created_at: true,
});

// Analysis results table
export const analysisResults = pgTable("analysis_results", {
  id: uuid("id").primaryKey().notNull().$defaultFn(() => uuidv4()),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  user: one(users, {
    fields: [analysisResults.user_id],
    references: [users.id],
  }),
}));

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Recommendation sets table
export const recommendationSets = pgTable("recommendation_sets", {
  id: uuid("id").primaryKey().notNull().$defaultFn(() => uuidv4()),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Recommendation items table
export const recommendationItems = pgTable("recommendation_items", {
  id: uuid("id").primaryKey().notNull().$defaultFn(() => uuidv4()),
  set_id: uuid("set_id").notNull().references(() => recommendationSets.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: text("confidence").notNull(),
  data: jsonb("data").notNull(),
  source: text("source").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const recommendationSetsRelations = relations(recommendationSets, ({ one, many }) => ({
  user: one(users, {
    fields: [recommendationSets.user_id],
    references: [users.id],
  }),
  items: many(recommendationItems),
}));

export const recommendationItemsRelations = relations(recommendationItems, ({ one }) => ({
  set: one(recommendationSets, {
    fields: [recommendationItems.set_id],
    references: [recommendationSets.id],
  }),
}));

export const insertRecommendationSetSchema = createInsertSchema(recommendationSets).omit({
  id: true,
  created_at: true,
});

export const insertRecommendationItemSchema = createInsertSchema(recommendationItems).omit({
  id: true,
  created_at: true,
});

// User Settings schema
export const UserSettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['en', 'id']).default('en'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

export type RecommendationItem = typeof recommendationItems.$inferSelect;
export type InsertRecommendationItem = typeof recommendationItems.$inferInsert;

export type RecommendationSet = typeof recommendationSets.$inferSelect;
export type InsertRecommendationSet = typeof recommendationSets.$inferInsert;
