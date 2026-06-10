import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── users ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  churchName: text("church_name"),
  city: text("city"),
  profilePhotoUrl: text("profile_photo_url"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  primaryAuthProvider: text("primary_auth_provider").notNull().default("email"),
  connectedAuthProviders: text("connected_auth_providers").array().default([]),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── prayer_groups ────────────────────────────────────────────────────────────

export const prayerGroupsTable = pgTable("prayer_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  churchName: text("church_name"),
  city: text("city"),
  imageUrl: text("image_url"),
  verse: text("verse"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  hidePrayerPersonNames: boolean("hide_prayer_person_names")
    .notNull()
    .default(false),
  allowCustomCategories: boolean("allow_custom_categories")
    .notNull()
    .default(true),
  allowComments: boolean("allow_comments").notNull().default(true),
  allowAnonymousRequests: boolean("allow_anonymous_requests")
    .notNull()
    .default(true),
  adminsCanViewAnonymousAuthors: boolean("admins_can_view_anonymous_authors")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrayerGroupSchema = createInsertSchema(prayerGroupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrayerGroup = z.infer<typeof insertPrayerGroupSchema>;
export type PrayerGroup = typeof prayerGroupsTable.$inferSelect;

// ─── group_members ────────────────────────────────────────────────────────────

export const groupMembersTable = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => prayerGroupsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  // role: admin | moderator | member
  role: text("role").notNull().default("member"),
  // status: active | removed | pending
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  invitedByUserId: uuid("invited_by_user_id").references(() => usersTable.id),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({
  id: true,
  joinedAt: true,
});
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembersTable.$inferSelect;

// ─── group_invites ────────────────────────────────────────────────────────────

export const groupInvitesTable = pgTable("group_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => prayerGroupsTable.id),
  invitedEmail: text("invited_email"),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  token: text("token").notNull().unique(),
  // status: pending | accepted | declined | expired | revoked
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  revokedAt: timestamp("revoked_at"),
});

export const insertGroupInviteSchema = createInsertSchema(groupInvitesTable).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});
export type InsertGroupInvite = z.infer<typeof insertGroupInviteSchema>;
export type GroupInvite = typeof groupInvitesTable.$inferSelect;

// ─── prayer_categories ────────────────────────────────────────────────────────

export const prayerCategoriesTable = pgTable("prayer_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => prayerGroupsTable.id),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrayerCategorySchema = createInsertSchema(prayerCategoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrayerCategory = z.infer<typeof insertPrayerCategorySchema>;
export type PrayerCategory = typeof prayerCategoriesTable.$inferSelect;

// ─── prayer_requests ──────────────────────────────────────────────────────────

export const prayerRequestsTable = pgTable("prayer_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => prayerGroupsTable.id),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  // encrypted fields
  descriptionEncrypted: text("description_encrypted"),
  prayerPersonNameEncrypted: text("prayer_person_name_encrypted"),
  prayerPersonInitials: text("prayer_person_initials"),
  categoryId: uuid("category_id").references(() => prayerCategoriesTable.id),
  // urgency: normal | important | urgent
  urgency: text("urgency").notNull().default("normal"),
  // status: active | follow_up | closed | archived
  status: text("status").notNull().default("active"),
  // closure_reason: null | no_longer_needed | answered_prayer
  closureReason: text("closure_reason"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  allowComments: boolean("allow_comments").notNull().default(true),
  importantDate: timestamp("important_date"),
  answeredTestimonyEncrypted: text("answered_testimony_encrypted"),
  closedNoteEncrypted: text("closed_note_encrypted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  archivedAt: timestamp("archived_at"),
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type PrayerRequest = typeof prayerRequestsTable.$inferSelect;

// ─── prayer_commitments ───────────────────────────────────────────────────────

export const prayerCommitmentsTable = pgTable("prayer_commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrayerCommitmentSchema = createInsertSchema(
  prayerCommitmentsTable,
).omit({ id: true, createdAt: true });
export type InsertPrayerCommitment = z.infer<typeof insertPrayerCommitmentSchema>;
export type PrayerCommitment = typeof prayerCommitmentsTable.$inferSelect;

// ─── prayer_comments ──────────────────────────────────────────────────────────

export const prayerCommentsTable = pgTable("prayer_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  commentEncrypted: text("comment_encrypted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insertPrayerCommentSchema = createInsertSchema(prayerCommentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrayerComment = z.infer<typeof insertPrayerCommentSchema>;
export type PrayerComment = typeof prayerCommentsTable.$inferSelect;

// ─── prayer_updates ───────────────────────────────────────────────────────────

export const prayerUpdatesTable = pgTable("prayer_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  updateTextEncrypted: text("update_text_encrypted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrayerUpdateSchema = createInsertSchema(prayerUpdatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrayerUpdate = z.infer<typeof insertPrayerUpdateSchema>;
export type PrayerUpdate = typeof prayerUpdatesTable.$inferSelect;

// ─── prayer_sessions ──────────────────────────────────────────────────────────

export const prayerSessionsTable = pgTable("prayer_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => prayerGroupsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  // mode: compact | detailed
  mode: text("mode").notNull().default("detailed"),
  // organization_type: priority | category
  organizationType: text("organization_type").notNull().default("priority"),
  filters: jsonb("filters"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertPrayerSessionSchema = createInsertSchema(prayerSessionsTable).omit({
  id: true,
  startedAt: true,
});
export type InsertPrayerSession = z.infer<typeof insertPrayerSessionSchema>;
export type PrayerSession = typeof prayerSessionsTable.$inferSelect;

// ─── prayer_session_items ─────────────────────────────────────────────────────

export const prayerSessionItemsTable = pgTable("prayer_session_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerSessionId: uuid("prayer_session_id")
    .notNull()
    .references(() => prayerSessionsTable.id),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id),
  prayedAt: timestamp("prayed_at"),
  skippedAt: timestamp("skipped_at"),
});

export const insertPrayerSessionItemSchema = createInsertSchema(
  prayerSessionItemsTable,
).omit({ id: true });
export type InsertPrayerSessionItem = z.infer<typeof insertPrayerSessionItemSchema>;
export type PrayerSessionItem = typeof prayerSessionItemsTable.$inferSelect;

// ─── prayer_logs ─────────────────────────────────────────────────────────────

export const prayerLogsTable = pgTable("prayer_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  prayedAt: timestamp("prayed_at").defaultNow().notNull(),
});
export type PrayerLog = typeof prayerLogsTable.$inferSelect;

// ─── notifications ────────────────────────────────────────────────────────────

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  groupId: uuid("group_id").references(() => prayerGroupsTable.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: uuid("related_entity_id"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

// ─── prayer_request_translations ─────────────────────────────────────────────

export const prayerRequestTranslationsTable = pgTable("prayer_request_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  prayerRequestId: uuid("prayer_request_id")
    .notNull()
    .references(() => prayerRequestsTable.id, { onDelete: "cascade" }),
  targetLanguage: text("target_language").notNull(),
  translatedTitle: text("translated_title").notNull(),
  translatedDescription: text("translated_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PrayerRequestTranslation = typeof prayerRequestTranslationsTable.$inferSelect;

// ─── audit_logs ───────────────────────────────────────────────────────────────

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id),
  groupId: uuid("group_id").references(() => prayerGroupsTable.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
