-- Adminer 4.8.1 PostgreSQL 15.1 (Debian 15.1-1.pgdg110+1) dump

-- \connect "Exchanger";

DROP TABLE IF EXISTS "Transactions";
DROP SEQUENCE IF EXISTS "Transactions_id_seq";
CREATE SEQUENCE "Transactions_id_seq" INCREMENT 1 MINVALUE 1;

CREATE TABLE "public"."Transactions" (
    "id" smallint DEFAULT nextval('"Transactions_id_seq"') NOT NULL,
    "spent_value" real,
    "spent_currency" text,
    "gained_value" real,
    "gained_currency" text,
    "timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "user" smallint NOT NULL,
    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

DROP TABLE IF EXISTS "Users";
DROP SEQUENCE IF EXISTS "Users_id_seq";
CREATE SEQUENCE "Users_id_seq" INCREMENT 1 MINVALUE 1;

CREATE TABLE "public"."Users" (
    "email" text NOT NULL,
    "password" text NOT NULL,
    "name" text NOT NULL,
    "iban" text NOT NULL,
    "salt" text NOT NULL,
    "id" smallint DEFAULT nextval('"Users_id_seq"') NOT NULL,
    CONSTRAINT "Users_email" UNIQUE ("email"),
    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

ALTER TABLE ONLY "public"."Transactions" ADD CONSTRAINT "Transactions_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) NOT DEFERRABLE;

-- 2023-01-20 08:37:14.147508+00
