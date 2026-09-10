import { describe, expect, it } from "vitest";
import { kind } from "./index";

const parse = (params: unknown) => kind.parseInitializationParams(params);

/**
 * What `resultPool.getCanonicalOptions` mints for `targetOptions`, which is what the
 * settings panel writes into `targetRef`. Taken verbatim from an exported template.
 *
 * This is the case the guard was originally wrong about: the block wrote an id its own
 * kind refused, so applying a template exported from this block failed. Anything that
 * stops this test passing has broken the export/apply round trip again.
 */
const ANCHORED_ID =
  '{"axes":[{"anchor":"main","idx":1}],"domain":{"pl7.app/alphabet":"aminoacid","pl7.app/vdj/feature":"CDR3"},"name":"pl7.app/vdj/sequence"}';

/** The other four serialized key forms `isColumnUniversalId` recognizes. */
const GLOBAL_ID = '{"__isRef":true,"blockId":"b1","name":"pf/sequence"}';
const LOCAL_ID = '{"name":"pf/sequence","resolvePath":["a","b"]}';
const FILTERED_ID = `{"__isFiltered":true,"axisFilters":[[0,"IGH"]],"source":${JSON.stringify(GLOBAL_ID)}}`;
const OVERRIDDEN_ID = `{"__isOverridden":true,"source":${JSON.stringify(GLOBAL_ID)},"specOverrides":{"annotations":{"pl7.app/label":"x"}}}`;

describe("targetRef", () => {
  it.each([
    ["an anchored id, as getCanonicalOptions mints it", ANCHORED_ID],
    ["a global key id", GLOBAL_ID],
    ["a local key id", LOCAL_ID],
    ["a filtered key id", FILTERED_ID],
    ["an overridden key id", OVERRIDDEN_ID],
  ])("accepts %s", (_label, targetRef) => {
    expect(parse({ targetRef })).toEqual({ targetRef });
  });

  it.each([
    ["a string that is not JSON", "pl7.app/vdj/sequence"],
    ["malformed JSON", '{"name":"pf/sequence"'],
    ["JSON that is not a column key", '{"foo":1}'],
    ["JSON that is not an object", '"pf/sequence"'],
    ["a number", 42],
    ["null", null],
    ["the key form rather than its serialization", { name: "pf/sequence", resolvePath: [] }],
  ])("rejects %s", (_label, targetRef) => {
    expect(() => parse({ targetRef })).toThrow("'targetRef' must be a sequence column identifier.");
  });
});

describe("lastAppliedModality", () => {
  it.each(["antibody_tcr", "peptide", "amplicon"])("accepts %s", (lastAppliedModality) => {
    expect(parse({ lastAppliedModality })).toEqual({ lastAppliedModality });
  });

  it.each([
    ["a value the contract does not name", "vdj"],
    ["the empty string", ""],
    ["a number", 3],
  ])("rejects %s", (_label, lastAppliedModality) => {
    expect(() => parse({ lastAppliedModality })).toThrow(
      "'lastAppliedModality' must be one of antibody_tcr, peptide, amplicon.",
    );
  });
});

describe("the params envelope", () => {
  it("accepts an absent targetRef, like every other optional field", () => {
    expect(parse({})).toEqual({});
  });

  it("drops keys the contract does not name", () => {
    expect(parse({ targetRef: ANCHORED_ID, notAParam: "x" })).toEqual({ targetRef: ANCHORED_ID });
  });

  it("rejects params that are not an object", () => {
    expect(() => parse(null)).toThrow();
    expect(() => parse([ANCHORED_ID])).toThrow();
    expect(() => parse(5)).toThrow();
  });
});
