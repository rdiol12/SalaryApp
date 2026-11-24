import { buildXlsx, zipStored, utf8Bytes, toBase64 } from "../xlsxWriter.js";
import { buildMonthSheets } from "../shiftWorkbook.js";

// The link module only needs Linking.openURL from react-native.
jest.mock("react-native", () => ({ Linking: { openURL: jest.fn() } }));
const { Linking } = require("react-native");
const { buildPocketFlowSalaryLink, parseAmount, sendSalaryToPocketFlow } = require("../pocketflow.js");

const text = (bytes) => Buffer.from(bytes).toString("utf8");

/** Reads a stored-only ZIP back: { name: Buffer }. */
const unzip = (bytes) => {
  const buf = Buffer.from(bytes);
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(at)).toBe(0x02014b50);
    const size = buf.readUInt32LE(at + 24);
    const nameLength = buf.readUInt16LE(at + 28);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.slice(at + 46, at + 46 + nameLength).toString("utf8");
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    files[name] = buf.slice(dataStart, dataStart + size);
    at += 46 + nameLength;
  }
  return files;
};

describe("xlsx writer", () => {
  test("utf-8 and base64 match Node's own", () => {
    for (const sample of ["abc", "שלום ₪", "😀 mixed עברית"]) {
      expect(Buffer.from(utf8Bytes(sample)).toString("utf8")).toBe(sample);
    }
    for (let n = 0; n < 8; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 5) % 256);
      expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
    }
  });

  test("zip entries read back intact with the right checksum", () => {
    const data = utf8Bytes("hello hello hello");
    const files = unzip(zipStored([{ name: "a.txt", data }, { name: "dir/ב.txt", data: utf8Bytes("שלום") }]));
    expect(text(files["a.txt"])).toBe("hello hello hello");
    expect(text(files["dir/ב.txt"])).toBe("שלום");
    // CRC-32 of "hello hello hello", computed independently with zlib.
    const zipped = Buffer.from(zipStored([{ name: "a.txt", data }]));
    expect(zipped.readUInt32LE(14)).toBe(3858335872);
  });

  test("workbook has the expected parts, escapes text and marks the sheet right-to-left", () => {
    const files = unzip(buildXlsx([{ name: "גיליון: [1]", rtl: true, widths: [10], rows: [[{ v: "כותרת", bold: true }, 12.5, 3], ["a & <b>", null, ""]] }]));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml"])
    );
    const sheet = text(files["xl/worksheets/sheet1.xml"]);
    expect(sheet).toContain('rightToLeft="1"');
    expect(sheet).toContain('<c r="A1" t="inlineStr" s="1">');
    expect(sheet).toContain('<c r="B1" s="2"><v>12.5</v></c>');
    expect(sheet).toContain('<c r="C1"><v>3</v></c>');
    expect(sheet).toContain("a &amp; &lt;b&gt;");
    expect(sheet).not.toContain('r="B2"');
    // Characters Excel refuses in sheet names are removed.
    expect(text(files["xl/workbook.xml"])).toContain('name="גיליון   1"');
  });
});

describe("month workbook", () => {
  const shifts = [
    { date: "2026-11-03", type: "עבודה", startTime: "08:00", endTime: "17:00", totalHours: "9.00", hourlyPercent: "100", bonus: "0", notes: "" },
    { date: "2026-11-01", type: "שבת", startTime: "23:00", endTime: "07:00", totalHours: "8.00", hourlyPercent: "150", bonus: "50", notes: "לילה" },
    { date: "2026-11-05", type: "מחלה", startTime: "08:00", endTime: "16:00", totalHours: "8.00", hourlyPercent: "100", bonus: "0" },
  ];
  const [shiftSheet, summary] = buildMonthSheets({ shifts, stats: { net: 990.4, gross: 1200, totalHours: "17.0", shiftCount: 2 }, title: "נובמבר 2026", jobName: "ראשית" });
  const plain = (cell) => (cell && typeof cell === "object" ? cell.v : cell);

  test("shifts are sorted by date, with weekday names", () => {
    expect(shiftSheet.rows.slice(1, 4).map((r) => [r[0], r[1], r[2]])).toEqual([
      ["01/11/2026", "ראשון", "שבת"],
      ["03/11/2026", "שלישי", "עבודה"],
      ["05/11/2026", "חמישי", "מחלה"],
    ]);
  });

  test("sick and vacation days carry no hours; the total row adds only worked hours", () => {
    expect(shiftSheet.rows[3].slice(3, 8)).toEqual(["", "", null, null, null]);
    const total = shiftSheet.rows[shiftSheet.rows.length - 1].map(plain);
    expect(total[5]).toBe(17);
    expect(total[7]).toBe(50);
  });

  test("summary shows the job and the net pay", () => {
    const rows = summary.rows.map((r) => r.map(plain));
    expect(rows).toContainEqual(["עבודה", "ראשית"]);
    expect(rows).toContainEqual(["נטו לתשלום", 990.4]);
  });
});

describe("PocketFlow salary link", () => {
  const today = new Date(2026, 10, 24); // 24 Nov 2026

  test("an open month is sent as expected income dated the first day after it", () => {
    const { url, final } = buildPocketFlowSalaryLink({ amount: 8450, monthKey: "2026-11", hours: 160, today });
    expect(final).toBe(false);
    expect(url).toBe(
      "pocketflow://income?amount=8450.00&month=2026-11&date=2026-12-01&done=0&wage=5281&source=SalaryPro&merchant=" + encodeURIComponent("משכורת")
    );
  });

  test("a finished month is final and dated today; December rolls into January", () => {
    expect(buildPocketFlowSalaryLink({ amount: 1, monthKey: "2026-10", today }).url).toContain("date=2026-11-24&done=1");
    expect(buildPocketFlowSalaryLink({ amount: 1, monthKey: "2026-12", today }).url).toContain("date=2027-01-01&done=0");
    expect(buildPocketFlowSalaryLink({ amount: 1, monthKey: "2025-12", today }).final).toBe(true);
  });

  test("each job gets its own source, and no hourly pay is sent without hours", () => {
    const { url } = buildPocketFlowSalaryLink({ amount: 99.5, monthKey: "2026-11", jobName: "משרה ב", today });
    expect(url).toContain("amount=99.50");
    expect(url).toContain("source=" + encodeURIComponent("SalaryPro משרה ב"));
    expect(url).not.toContain("wage=");
  });

  test("amounts typed by hand", () => {
    expect(parseAmount("8450")).toBe(8450);
    expect(parseAmount("8,450.5")).toBe(8450.5);
    expect(parseAmount("8450,50")).toBe(8450.5);
    expect(parseAmount("₪ 12,000")).toBe(12000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("0")).toBeNull();
  });

  test("reports whether PocketFlow could be opened", async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    await expect(sendSalaryToPocketFlow({ amount: 10, monthKey: "2026-11", today })).resolves.toBe(true);
    expect(Linking.openURL).toHaveBeenLastCalledWith(expect.stringMatching(/^pocketflow:\/\/income\?amount=10\.00/));
    Linking.openURL.mockRejectedValueOnce(new Error("no handler"));
    await expect(sendSalaryToPocketFlow({ amount: 10, monthKey: "2026-11", today })).resolves.toBe(false);
  });
});
