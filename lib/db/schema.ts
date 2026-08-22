import { pgTable, uuid, text, varchar, numeric, boolean, timestamp, date, pgEnum } from 'drizzle-orm/pg-core'

export const expenseCategoryEnum = pgEnum('expense_category', [
  'travel',
  'food',
  'accommodation',
  'activities',
  'shopping',
  'health',
  'gifts',
  'misc',
])

export const expenseTypeEnum = pgEnum('expense_type', ['personal', 'shared'])

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('PHP'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  initialBudget: numeric('initial_budget').notNull().default('0'),
  isSelf: boolean('is_self').notNull().default(false),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'),
})

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  category: expenseCategoryEnum('category').notNull(),
  paidById: uuid('paid_by_id').notNull().references(() => members.id),
  type: expenseTypeEnum('type').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  shareAmount: numeric('share_amount').notNull(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  fromMemberId: uuid('from_member_id').notNull().references(() => members.id),
  toMemberId: uuid('to_member_id').notNull().references(() => members.id),
  amount: numeric('amount').notNull(),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const paymentExpenseSplits = pgTable('payment_expense_splits', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  expenseSplitId: uuid('expense_split_id').notNull().references(() => expenseSplits.id, { onDelete: 'cascade' }),
})

export type Trip = typeof trips.$inferSelect
export type NewTrip = typeof trips.$inferInsert
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type ExpenseSplit = typeof expenseSplits.$inferSelect
export type NewExpenseSplit = typeof expenseSplits.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type PaymentExpenseSplit = typeof paymentExpenseSplits.$inferSelect
export type NewPaymentExpenseSplit = typeof paymentExpenseSplits.$inferInsert
