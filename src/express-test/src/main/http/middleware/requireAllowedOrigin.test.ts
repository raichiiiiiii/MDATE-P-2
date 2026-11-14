import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameRequestOrigin } from "./requireAllowedOrigin.js";

test("allows the local HTTP origin when no forwarded scheme is present", () => {
  assert.equal(
    isSameRequestOrigin("http://localhost:8080", "localhost:8080", undefined, "http"),
    true,
  );
});

test("allows the local HTTP origin when Nginx forwards the scheme", () => {
  assert.equal(
    isSameRequestOrigin("http://localhost:8080", "localhost:8080", "http", "http"),
    true,
  );
});

test("allows an HTTPS Cloudflare Quick Tunnel origin", () => {
  assert.equal(
    isSameRequestOrigin(
      "https://predicted-certainly-jewellery-europe.trycloudflare.com",
      "predicted-certainly-jewellery-europe.trycloudflare.com",
      "https",
      "http",
    ),
    true,
  );
});

test("allows a different Quick Tunnel hostname without changing configuration", () => {
  assert.equal(
    isSameRequestOrigin(
      "https://another-random-name.trycloudflare.com",
      "another-random-name.trycloudflare.com",
      "https",
      "http",
    ),
    true,
  );
});

test("rejects a different site even when the request uses HTTPS", () => {
  assert.equal(
    isSameRequestOrigin(
      "https://attacker.example",
      "mdate.example.com",
      "https",
      "http",
    ),
    false,
  );
});

test("rejects a scheme mismatch", () => {
  assert.equal(
    isSameRequestOrigin("https://localhost:8080", "localhost:8080", "http", "http"),
    false,
  );
});

test("rejects opaque, malformed, and non-origin URL values", () => {
  assert.equal(isSameRequestOrigin("null", "localhost:8080", "http", "http"), false);
  assert.equal(isSameRequestOrigin("not a URL", "localhost:8080", "http", "http"), false);
  assert.equal(isSameRequestOrigin("http://localhost:8080/path", "localhost:8080", "http", "http"), false);
});

test("rejects missing or malformed Host and forwarded protocol values", () => {
  assert.equal(isSameRequestOrigin("http://localhost:8080", undefined, "http", "http"), false);
  assert.equal(isSameRequestOrigin("http://localhost:8080", "localhost:8080", "ftp", "http"), false);
});
