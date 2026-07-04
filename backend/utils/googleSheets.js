const { google } = require("googleapis");
const path = require("path");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_FILE =
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ||
  path.join(__dirname, "../config/google-service-account.json");

if (!SPREADSHEET_ID) {
  console.warn("[googleSheets] GOOGLE_SHEET_ID is not set in env — sheet sync will fail.");
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

let sheetsClientPromise = null;
async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = auth.getClient().then((authClient) =>
      google.sheets({ version: "v4", auth: authClient })
    );
  }
  return sheetsClientPromise;
}

let tabCache = new Set(); // tabs we've already confirmed exist this run

/**
 * Ensures a tab exists in the spreadsheet. Creates it with a header row
 * if missing. Cheap no-op on repeat calls thanks to tabCache.
 */
async function ensureTab(tabName, headers) {
  if (tabCache.has(tabName)) return;

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = meta.data.sheets.map((s) => s.properties.title);

  if (!existingTitles.includes(tabName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    if (headers && headers.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }

  tabCache.add(tabName);
}

/**
 * Simple append — one row per call, keyed by header name.
 * Use this from "create" controllers where you don't need
 * update/delete tracking, e.g.:
 *   await appendRowToSheet("PO", { "PO No": po.poNo, ... });
 */
async function appendRowToSheet(tabName, rowObj) {
  const headers = Object.keys(rowObj);
  await ensureTab(tabName, headers);

  const sheets = await getSheetsClient();
  const values = [headers.map((h) => rowObj[h] ?? "")];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

/**
 * Finds all sheet row numbers (1-indexed, matching the Sheets UI)
 * where column A equals docId. Column A must hold the Mongo _id
 * as a string — this is why every *ToRows() mapper puts DB ID first.
 */
async function findRowsByDocId(tabName, docId) {
  const sheets = await getSheetsClient();
  let res;
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
    });
  } catch (e) {
    return []; // tab doesn't exist yet
  }
  const col = res.data.values || [];
  const rowNumbers = [];
  col.forEach((cell, idx) => {
    if (cell[0] === String(docId)) rowNumbers.push(idx + 1);
  });
  return rowNumbers;
}

/**
 * Deletes every sheet row belonging to docId (there can be more than
 * one row per document, e.g. one row per line item).
 */
async function deleteDocFromSheet(tabName, docId) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetMeta = meta.data.sheets.find((s) => s.properties.title === tabName);
  if (!sheetMeta) return;

  const rowNumbers = await findRowsByDocId(tabName, docId);
  if (!rowNumbers.length) return;

  // Delete from the bottom up so earlier deletions don't shift the
  // row indices of rows still queued for deletion.
  const requests = rowNumbers
    .sort((a, b) => b - a)
    .map((rowNum) => ({
      deleteDimension: {
        range: {
          sheetId: sheetMeta.properties.sheetId,
          dimension: "ROWS",
          startIndex: rowNum - 1,
          endIndex: rowNum,
        },
      },
    }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  });
}

/**
 * Upsert for documents that can be edited or have multiple line-item
 * rows: wipes any existing rows for docId, then re-appends the fresh
 * set. Use this from routes on create AND update, e.g.:
 *   await syncRowsForDoc("GRN", GRN_HEADERS, doc._id, grnToRows(doc));
 */
async function syncRowsForDoc(tabName, headers, docId, rows) {
  await ensureTab(tabName, headers);
  await deleteDocFromSheet(tabName, docId);

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

module.exports = {
  appendRowToSheet,
  syncRowsForDoc,
  deleteDocFromSheet,
  ensureTab,
};