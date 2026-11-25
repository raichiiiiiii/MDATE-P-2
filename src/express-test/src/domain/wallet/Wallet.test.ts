import assert from "node:assert/strict";
import { test } from "node:test";
import { InsufficientCoinsError, InvalidTransactionAmountError, Wallet } from "./Wallet.js";

test("wallet credits update balance and lifetime earned without mutating the original", () => {
  const current = new Wallet("user-1", 20, 20);
  const credited = current.applyDelta(25);

  assert.equal(current.balance, 20);
  assert.equal(credited.balance, 45);
  assert.equal(credited.lifetimeEarned, 45);
});

test("wallet debits reduce balance but never reduce lifetime earned", () => {
  const current = new Wallet("user-1", 200, 350);
  const debited = current.applyDelta(-80);

  assert.equal(debited.balance, 120);
  assert.equal(debited.lifetimeEarned, 350);
});

test("wallet refuses a debit that would make the balance negative", () => {
  const current = new Wallet("user-1", 40, 100);
  assert.throws(() => current.applyDelta(-41), (error) => {
    assert.ok(error instanceof InsufficientCoinsError);
    assert.equal(error.required, 41);
    assert.equal(error.available, 40);
    return true;
  });
});

test("wallet refuses zero and fractional deltas", () => {
  const current = new Wallet("user-1", 10, 10);
  assert.throws(() => current.applyDelta(0), InvalidTransactionAmountError);
  assert.throws(() => current.applyDelta(1.5), InvalidTransactionAmountError);
});
