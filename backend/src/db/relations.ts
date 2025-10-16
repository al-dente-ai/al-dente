import { relations } from 'drizzle-orm/relations';
import {
  users,
  items,
  loginEvents,
  recipes,
  phoneVerificationCodes,
  emailVerificationCodes,
} from './schema';

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  loginEvents: many(loginEvents),
  recipes: many(recipes),
  phoneVerificationCodes: many(phoneVerificationCodes),
  emailVerificationCodes: many(emailVerificationCodes),
}));

export const loginEventsRelations = relations(loginEvents, ({ one }) => ({
  user: one(users, {
    fields: [loginEvents.userId],
    references: [users.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

export const phoneVerificationCodesRelations = relations(phoneVerificationCodes, ({ one }) => ({
  user: one(users, {
    fields: [phoneVerificationCodes.userId],
    references: [users.id],
  }),
}));

export const emailVerificationCodesRelations = relations(emailVerificationCodes, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationCodes.userId],
    references: [users.id],
  }),
}));
