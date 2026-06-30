/**
 * LeadIntake — Google Apps Script Web App that receives the FREE-funnel popup
 * lead (POSTed by app/api/lead/route.ts) and appends one row to the CRM sheet.
 *
 * ── Setup ────────────────────────────────────────────────────────────────
 * 1. Open the CRM Google Sheet → Extensions → Apps Script.
 * 2. Add this file (or paste its contents).
 * 3. Set SHEET_NAME below to the tab you want leads written to.
 * 4. Deploy → New deployment → type "Web app":
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copy the Web app URL (ends in /exec).
 * 5. Put that URL in the site's env as LEAD_WEBHOOK_URL, then redeploy the site.
 *
 * The first POST creates the header row automatically (from HEADERS), so the
 * column order always matches the lead payload.
 */

var SHEET_NAME = "Leads";

// Column order written to the sheet. Mirrors the /api/lead payload, with the
// CRM-lifecycle fields reserved as empty columns to be filled downstream.
var HEADERS = [
  "lead_id",
  "created_at",
  "first_name",
  "last_name",
  "email",
  "phone",
  "city",
  "country_code",
  "weight_to_lose",
  "biggest_challenge",
  "fbc",
  "fbp",
  "client_ip_address",
  "client_user_agent",
  "external_id",
  "event_source_url",
  "amount",
  "is_test",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "landing_url",
  "referrer",
  // ---- reserved CRM-lifecycle columns (filled later by the sales team) ----
  "attended",
  "showup_time",
  "qualified",
  "qualified_time",
  "sale_closed",
  "contracted_value",
  "sales_time"
];

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // serialize appends so rows never collide

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var row = HEADERS.map(function (key) {
      var v = body[key];
      return v === undefined || v === null ? "" : v;
    });
    sheet.appendRow(row);

    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, lead_id: body.lead_id || "" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple health check when the URL is opened in a browser.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "LeadIntake" }))
    .setMimeType(ContentService.MimeType.JSON);
}
