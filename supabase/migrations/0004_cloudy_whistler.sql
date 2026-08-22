CREATE TABLE "payment_expense_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"expense_split_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_expense_splits" ADD CONSTRAINT "payment_expense_splits_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_expense_splits" ADD CONSTRAINT "payment_expense_splits_expense_split_id_expense_splits_id_fk" FOREIGN KEY ("expense_split_id") REFERENCES "public"."expense_splits"("id") ON DELETE cascade ON UPDATE no action;