import { noHoleCardsInLogs } from "../src/rules/no-hole-cards-in-logs.ts";
import { ruleTester } from "./setup.ts";

ruleTester.run("no-hole-cards-in-logs", noHoleCardsInLogs, {
  valid: [
    'log.info({ handId, seat: 3 }, "hand started");',
    'logger.warn({ tableId }, "slow action");',
    'req.log.info({ board: ["As", "Kd", "2c"] }, "flop");',
    "sendToSeat(seat, { holeCards });",
    'hand.cards.push(card); log.info({ count: 2 }, "dealt");',
    "metrics.info({ cards });",
  ],
  invalid: [
    { code: 'log.info({ holeCards }, "dealt");', errors: [{ messageId: "forbiddenField" }] },
    {
      code: 'logger.debug({ hand: { seat: { cards: c } } }, "x");',
      errors: [{ messageId: "forbiddenField" }],
    },
    { code: "req.log.info({ deck: d });", errors: [{ messageId: "forbiddenField" }] },
    { code: 'this.logger.error({ "hole": h });', errors: [{ messageId: "forbiddenField" }] },
    { code: "log.info(player.holeCards);", errors: [{ messageId: "forbiddenField" }] },
    { code: "log.info(`dealt ${seat.cards}`);", errors: [{ messageId: "forbiddenField" }] },
    { code: "console.log(JSON.stringify(hand.deck));", errors: [{ messageId: "forbiddenField" }] },
    { code: "const l = log.child({ cards });", errors: [{ messageId: "forbiddenField" }] },
    { code: 'log.child({ handId }).info({ deckOrder }, "x");', errors: [{ messageId: "forbiddenField" }] },
    { code: "tableLogger.info({ ...seat, holes });", errors: [{ messageId: "forbiddenField" }] },
    { code: "log.info({ s: 1 });", options: [{ fields: ["s"] }], errors: [{ messageId: "forbiddenField" }] },
  ],
});
