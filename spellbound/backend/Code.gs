/**
 * SPELLBOUND: THE DRAGON'S LEDGER — Cloud Save Backend (v3)
 *
 * WHAT CHANGED FROM v2
 * 1. The "save too large" guard allowed 100,000 characters, but a single
 *    Google Sheets cell holds at most 50,000. A save between those two sizes
 *    passed the check and then failed on write, reporting a confusing
 *    spreadsheet error instead of a clear one. The limit is now 45,000.
 * 2. Every overwrite keeps the previous save in a "prev_data" column. If a
 *    device with an old save overwrites a newer one, the good save is still
 *    sitting in the sheet rather than being gone for good.
 * 3. doPost no longer assumes e.postData exists, and trims the wizard name so
 *    "  Merlin  " and "Merlin" can't become two different rows.
 *
 * HOW TO UPDATE (you already deployed v1/v2)
 * 1. Open your "Spellbound Saves" sheet → Extensions → Apps Script.
 * 2. Select all the old code, delete it, paste this entire file. Save.
 * 3. Deploy → Manage deployments → ✏️ pencil → Version: "New version" → Deploy.
 *    The /exec URL stays the same, so the game needs no changes.
 *
 * The existing sheet keeps working — the prev_data column is added the first
 * time a save is written.
 */

const SHEET_NAME = "Saves";

/* A Google Sheets cell tops out at 50,000 characters. Stay clear of the edge
   so a save can never pass this check and still fail to write. */
const MAX_SAVE_CHARS = 45000;

const HEADERS = ["key", "wizard", "save_data", "updated", "level", "gold", "prev_data"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  // Older sheets were created with 6 columns; add prev_data if it's missing.
  if (sh.getLastColumn() < HEADERS.length) {
    sh.getRange(1, HEADERS.length).setValue("prev_data");
  }
  return sh;
}

function keyOf_(name) {
  return String(name || "").trim().toLowerCase();
}

function findRow_(sh, key) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const vals = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    const k = String(vals[i][0]);
    if (k === key || k.indexOf(key + "#") === 0) return i + 2; // matches old PIN-era keys too
  }
  return -1;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** GET ?action=list  → all wizards.   GET ?name=... → one save. */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const sh = sheet_();
    if (p.action === "list") {
      const last = sh.getLastRow();
      const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, 6).getValues();
      const list = rows.map(function (r) {
        let el = "";
        try { el = (JSON.parse(r[2]) || {}).el || ""; } catch (_) {}
        return { name: String(r[1]), level: r[4] || 1, gold: r[5] || 0, el: el,
                 updated: r[3] instanceof Date ? r[3].toISOString() : String(r[3]) };
      }).sort(function (a, b) { return a.updated < b.updated ? 1 : -1; });
      return out_({ ok: true, wizards: list });
    }
    if (!p.name) return out_({ ok: false, error: "missing name" });
    const r = findRow_(sh, keyOf_(p.name));
    if (r < 0) return out_({ ok: false, error: "not_found" });
    return out_({ ok: true, data: JSON.parse(sh.getRange(r, 3).getValue()) });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

/** SAVE: POST body = JSON {name, data} */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return out_({ ok: false, error: "no body" });
    }
    const body = JSON.parse(e.postData.contents);
    const name = String((body && body.name) || "").trim();
    if (!name || !body.data) return out_({ ok: false, error: "missing fields" });

    const json = JSON.stringify(body.data);
    if (json.length > MAX_SAVE_CHARS) {
      return out_({ ok: false, error: "save too large (" + json.length + " chars, max " + MAX_SAVE_CHARS + ")" });
    }

    const sh = sheet_();
    const key = keyOf_(name);
    const r = findRow_(sh, key);

    // Keep the save we are about to replace, so a stale device overwriting a
    // newer save is recoverable by hand rather than a permanent loss.
    let prev = "";
    if (r >= 0) {
      try { prev = String(sh.getRange(r, 3).getValue() || ""); } catch (_) {}
      if (prev.length > MAX_SAVE_CHARS) prev = "";
    }

    const row = [key, name, json, new Date(),
                 (body.data && body.data.lvl) || "", (body.data && body.data.gold) || "", prev];
    if (r < 0) sh.appendRow(row);
    else sh.getRange(r, 1, 1, HEADERS.length).setValues([row]);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
