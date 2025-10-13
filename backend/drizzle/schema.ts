import {
  pgTable,
  index,
  unique,
  pgPolicy,
  uuid,
  text,
  timestamp,
  boolean,
  foreignKey,
  date,
  check,
  integer,
  jsonb,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    email: text().notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneNumber: text('phone_number'),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
  },
  (table) => [
    index('idx_users_id').using('btree', table.id.asc().nullsLast().op('uuid_ops')),
    index('users_phone_number_idx')
      .using('btree', table.phoneNumber.asc().nullsLast().op('text_ops'))
      .where(sql`(phone_number IS NOT NULL)`),
    unique('users_email_key').on(table.email),
    pgPolicy('Users select own', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = id)`,
    }),
    pgPolicy('Users insert own', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Users update own', { as: 'permissive', for: 'update', to: ['authenticated'] }),
    pgPolicy('Users delete own', { as: 'permissive', for: 'delete', to: ['authenticated'] }),
  ]
);

export const items = pgTable(
  'items',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    name: text().notNull(),
    amount: text(),
    expiry: date(),
    categories: text().array().default(['']),
    notes: text(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_items_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('items_categories_idx').using('gin', table.categories.asc().nullsLast().op('array_ops')),
    index('items_name_trgm_idx').using('gin', table.name.asc().nullsLast().op('gin_trgm_ops')),
    index('items_notes_trgm_idx').using('gin', table.notes.asc().nullsLast().op('gin_trgm_ops')),
    index('items_user_id_idx').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'items_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Items select own', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('Items insert own', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Items update own', { as: 'permissive', for: 'update', to: ['authenticated'] }),
    pgPolicy('Items delete own', { as: 'permissive', for: 'delete', to: ['authenticated'] }),
  ]
);

export const loginEvents = pgTable(
  'login_events',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    ip: text(),
    userAgent: text('user_agent'),
    success: boolean().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_login_events_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'login_events_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Login events select own', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('Login events insert own', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Login events update own', { as: 'permissive', for: 'update', to: ['authenticated'] }),
    pgPolicy('Login events delete own', { as: 'permissive', for: 'delete', to: ['authenticated'] }),
  ]
);

export const recipes = pgTable(
  'recipes',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    title: text().notNull(),
    description: text(),
    mealType: text('meal_type').notNull(),
    servings: integer(),
    prepTimeMinutes: integer('prep_time_minutes'),
    ingredients: jsonb().notNull(),
    steps: jsonb().notNull(),
    usesItemIds: uuid('uses_item_ids').array().default(['']),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_recipes_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('recipes_user_id_idx').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'recipes_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Recipes select own', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('Recipes insert own', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Recipes update own', { as: 'permissive', for: 'update', to: ['authenticated'] }),
    pgPolicy('Recipes delete own', { as: 'permissive', for: 'delete', to: ['authenticated'] }),
    check(
      'recipes_meal_type_check',
      sql`meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])`
    ),
  ]
);

export const phoneVerificationCodes = pgTable(
  'phone_verification_codes',
  {
    id: uuid()
      .default(sql`COALESCE(gen_random_uuid(), uuid_generate_v4())`)
      .primaryKey()
      .notNull(),
    phoneNumber: text('phone_number').notNull(),
    code: varchar({ length: 6 }).notNull(),
    purpose: varchar({ length: 50 }).notNull(),
    userId: uuid('user_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    verified: boolean().default(false).notNull(),
    attempts: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('phone_verification_codes_expires_idx')
      .using('btree', table.expiresAt.asc().nullsLast().op('timestamptz_ops'))
      .where(sql`(verified = false)`),
    index('phone_verification_codes_lookup_idx')
      .using(
        'btree',
        table.phoneNumber.asc().nullsLast().op('text_ops'),
        table.code.asc().nullsLast().op('text_ops'),
        table.purpose.asc().nullsLast().op('text_ops'),
        table.expiresAt.asc().nullsLast().op('text_ops')
      )
      .where(sql`(verified = false)`),
    index('phone_verification_codes_phone_active_idx')
      .using(
        'btree',
        table.phoneNumber.asc().nullsLast().op('text_ops'),
        table.expiresAt.asc().nullsLast().op('timestamptz_ops')
      )
      .where(sql`(verified = false)`),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'phone_verification_codes_user_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    code: text().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    verified: boolean().default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('email_verification_codes_active_user_idx')
      .using('btree', table.userId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(verified = false)`),
    index('email_verification_codes_code_idx').using(
      'btree',
      table.code.asc().nullsLast().op('text_ops')
    ),
    index('email_verification_codes_expires_at_idx').using(
      'btree',
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('email_verification_codes_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'email_verification_codes_user_id_fkey',
    }).onDelete('cascade'),
  ]
);
