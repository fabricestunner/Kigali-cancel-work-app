import { describe, it, expect, beforeAll } from "vitest";
import * as ed from "@noble/ed25519";
import { decodeTicketToken, verifyTicketToken } from "./ticketToken";

const EVENT = "kcw2026";
let publicKeyHex: string;
let validToken: string;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function mint(payload: object, privKey: Uint8Array): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await ed.signAsync(new TextEncoder().encode(body), privKey);
  return `KCW1.${body}.${b64url(sig)}`;
}

beforeAll(async () => {
  const priv = ed.utils.randomPrivateKey();
  publicKeyHex = ed.etc.bytesToHex(await ed.getPublicKeyAsync(priv));
  validToken = await mint(
    { tid: 4417, oid: 1043, sz: "M", ev: EVENT, iat: 1755123456 },
    priv,
  );
});

describe("decodeTicketToken", () => {
  it("reads the payload without verifying", () => {
    const p = decodeTicketToken(validToken);
    expect(p).toEqual({ tid: 4417, oid: 1043, sz: "M", ev: EVENT, iat: 1755123456 });
  });

  it("rejects a token without the KCW1 prefix", () => {
    expect(decodeTicketToken("NOPE.abc.def")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(decodeTicketToken("")).toBeNull();
    expect(decodeTicketToken("KCW1.notbase64!!.x")).toBeNull();
    expect(decodeTicketToken("KCW1.onlytwoparts")).toBeNull();
  });

  it("rejects a payload missing required fields", async () => {
    const priv = ed.utils.randomPrivateKey();
    const incomplete = await mint({ tid: 1, oid: 1, sz: "M", ev: EVENT }, priv);
    expect(decodeTicketToken(incomplete)).toBeNull();
  });

  it("rejects a payload with wrong field types", async () => {
    const priv = ed.utils.randomPrivateKey();
    const wrongTypes = await mint(
      { tid: "4417", oid: 1043, sz: "M", ev: EVENT, iat: 1 },
      priv,
    );
    expect(decodeTicketToken(wrongTypes)).toBeNull();
  });
});

describe("verifyTicketToken", () => {
  it("accepts a genuine token", async () => {
    const p = await verifyTicketToken(validToken, publicKeyHex, EVENT);
    expect(p?.tid).toBe(4417);
  });

  it("rejects a tampered payload", async () => {
    const [, body, sig] = validToken.split(".");
    const forged = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(body.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
      ),
    );
    forged.tid = 9999;
    const forgedBody = b64url(new TextEncoder().encode(JSON.stringify(forged)));
    expect(await verifyTicketToken(`KCW1.${forgedBody}.${sig}`, publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects a token signed by a different key", async () => {
    const otherPriv = ed.utils.randomPrivateKey();
    const otherToken = await mint(
      { tid: 1, oid: 1, sz: "L", ev: EVENT, iat: 1 }, otherPriv,
    );
    expect(await verifyTicketToken(otherToken, publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects a ticket for a different event", async () => {
    expect(await verifyTicketToken(validToken, publicKeyHex, "kcw2027")).toBeNull();
  });

  it("rejects garbage without throwing", async () => {
    expect(await verifyTicketToken("garbage", publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects an empty string without throwing", async () => {
    expect(await verifyTicketToken("", publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects a token with an unsupported format version", async () => {
    const [, body, sig] = validToken.split(".");
    expect(await verifyTicketToken(`KCW2.${body}.${sig}`, publicKeyHex, EVENT)).toBeNull();
  });
});
