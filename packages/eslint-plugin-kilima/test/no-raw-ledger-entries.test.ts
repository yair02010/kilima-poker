import { noRawLedgerEntries } from "../src/rules/no-raw-ledger-entries.ts";
import { files, ruleTester } from "./setup.ts";

ruleTester.run("no-raw-ledger-entries", noRawLedgerEntries, {
  valid: [
    { code: "await postings.post(handSettlement(hand));", filename: files.wallet },
    { code: 'await db.selectFrom("ledger.entries").selectAll().execute();', filename: files.wallet },
    { code: 'const q = "SELECT * FROM ledger.entries WHERE account_id = $1";', filename: files.wallet },
    { code: 'const ddl = "CREATE TABLE ledger.entries (id uuid)";', filename: files.wallet },
    { code: "const e: LedgerEntry = buildEntry(a);", filename: files.wallet },
    {
      code: 'await db.insertInto("ledger.entries").values(e).execute(); const x: LedgerEntry = { account: a, amount: 1n };',
      filename: files.ledgerPostings,
    },
    { code: 'const q = "INSERT INTO lobby.tables (id) VALUES ($1)";', filename: files.lobby },
  ],
  invalid: [
    {
      code: 'const q = "INSERT INTO ledger.entries (id) VALUES ($1)";',
      filename: files.wallet,
      errors: [{ messageId: "rawSql" }],
    },
    {
      code: "const q = `update ledger.balances set amount = ${x}`;",
      filename: files.wallet,
      errors: [{ messageId: "rawSql" }],
    },
    {
      code: 'const q = sql`DELETE FROM "ledger"."transactions" WHERE id = ${id}`;',
      filename: files.wallet,
      errors: [{ messageId: "rawSql" }],
    },
    {
      code: 'await db.insertInto("ledger.entries").values(e).execute();',
      filename: files.wallet,
      errors: [{ messageId: "kyselyWrite" }],
    },
    {
      code: 'await db.updateTable("ledger.balances").set(b).execute();',
      filename: files.lobby,
      errors: [{ messageId: "kyselyWrite" }],
    },
    {
      code: "const e: LedgerEntry = { account: a, amount: 1n };",
      filename: files.wallet,
      errors: [{ messageId: "entryConstruction" }],
    },
    {
      code: "const es: LedgerEntry[] = [];",
      filename: files.wallet,
      errors: [{ messageId: "entryConstruction" }],
    },
    {
      code: "const e = { account: a } as LedgerEntry;",
      filename: files.wallet,
      errors: [{ messageId: "entryConstruction" }],
    },
    {
      code: "const e = { account: a } satisfies LedgerPosting;",
      filename: files.wallet,
      errors: [{ messageId: "entryConstruction" }],
    },
    {
      code: "const e = new LedgerEntry(a, 1n);",
      filename: files.wallet,
      errors: [{ messageId: "entryConstruction" }],
    },
  ],
});
