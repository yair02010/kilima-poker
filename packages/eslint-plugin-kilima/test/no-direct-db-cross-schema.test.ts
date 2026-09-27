import { noDirectDbCrossSchema } from "../src/rules/no-direct-db-cross-schema.ts";
import { files, ruleTester } from "./setup.ts";

ruleTester.run("no-direct-db-cross-schema", noDirectDbCrossSchema, {
  valid: [
    { code: 'const q = "SELECT * FROM lobby.tables WHERE id = $1";', filename: files.lobby },
    { code: 'await db.selectFrom("lobby.tables").selectAll().execute();', filename: files.lobby },
    { code: 'await db.withSchema("lobby").selectFrom("tables").execute();', filename: files.lobby },
    { code: 'const q = "SELECT * FROM ledger.entries";', filename: files.wallet },
    { code: 'producer.send("player.registered", evt);', filename: files.lobby },
    { code: 'log.info("identity.login succeeded");', filename: files.lobby },
    { code: 'const q = "SELECT * FROM identity.accounts";', filename: "/repo/packages/shared/src/x.ts" },
    {
      code: 'const q = "SELECT * FROM identity.accounts";',
      filename: files.sample,
      options: [{ ownership: { identity: "sample" } }],
    },
  ],
  invalid: [
    {
      code: 'const q = "SELECT * FROM identity.accounts WHERE id = $1";',
      filename: files.lobby,
      errors: [
        { messageId: "foreignSchema", data: { service: "lobby", schema: "identity", owner: "identity" } },
      ],
    },
    {
      code: "const q = sql`SELECT s.* FROM lobby.seats s JOIN player.profiles p ON p.id = s.player_id`;",
      filename: files.lobby,
      errors: [{ messageId: "foreignSchema" }],
    },
    {
      code: 'await db.selectFrom("ledger.balances").selectAll().execute();',
      filename: files.lobby,
      errors: [{ messageId: "foreignSchema" }],
    },
    {
      code: 'await db.withSchema("tournament").selectFrom("entries").execute();',
      filename: files.lobby,
      errors: [{ messageId: "foreignSchema" }],
    },
    {
      code: 'await db.selectFrom("lobby.tables").innerJoin("player.profiles as p", "p.id", "t.owner").execute();',
      filename: files.lobby,
      errors: [{ messageId: "foreignSchema" }],
    },
    {
      code: 'const q = "INSERT INTO audit.events (id) VALUES ($1)";',
      filename: files.wallet,
      errors: [{ messageId: "auditDirect" }],
    },
    {
      code: 'const q = "SELECT * FROM \\"cashier\\".\\"payments\\"";',
      filename: files.wallet,
      errors: [{ messageId: "foreignSchema" }],
    },
    {
      code: 'const q = "SELECT * FROM identity.accounts";',
      filename: files.windowsLobby,
      errors: [{ messageId: "foreignSchema" }],
    },
  ],
});
