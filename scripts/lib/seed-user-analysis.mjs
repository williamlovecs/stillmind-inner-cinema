/** Product-test analysis; never a clinical efficacy/safety verdict. */
export function norm(value) { return String(value ?? "").trim().toLowerCase().replaceAll("-", "_"); }
export function truthy(value) { return ["yes", "true", "1", "y"].includes(norm(value)); }
const knownBoolean = value => ["yes","true","1","y","no","false","0","n"].includes(norm(value));
export function average(rows, field) {
  const values = rows.map(row => String(row[field] ?? "").trim()).filter(Boolean)
    .map(Number).filter(value => Number.isInteger(value) && value >= 1 && value <= 5);
  return values.length ? values.reduce((sum,value) => sum + value, 0) / values.length : null;
}
/** RFC-style quoted commas/newlines, escaped quotes and BOM. Reject malformed/duplicate headers. */
export function parseCsv(source) {
  const records = []; let record = [], cell = "", quoted = false, closedQuote = false;
  const text = source.replace(/^\uFEFF/, "");
  const endCell = () => { record.push(cell.trim()); cell = ""; closedQuote = false; };
  const endRecord = () => { endCell(); if (record.some(Boolean)) records.push(record); record = []; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else cell += char;
    } else if (char === ',') endCell();
    else if (char === '\n' || char === '\r') { if (char === '\r' && text[i+1] === '\n') i++; endRecord(); }
    else if (char === '"' && !cell && !closedQuote) quoted = true;
    else if (closedQuote || char === '"') throw new Error("Malformed CSV quoting");
    else cell += char;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  if (cell || record.length || closedQuote) endRecord();
  if (!records.length) return [];
  const headers = records.shift();
  if (new Set(headers).size !== headers.length || headers.some(h => !h)) throw new Error("Invalid CSV headers");
  if (!headers.includes("session_id")) throw new Error("Missing session_id column");
  return records.map(values => {
    if (values.length !== headers.length) throw new Error("CSV row has wrong field count");
    return Object.fromEntries(headers.map((header,index) => [header, values[index]]));
  });
}
export function summarize(rows) {
  const count = fn => rows.filter(fn).length;
  const ids = rows.map(row => norm(row.session_id));
  const duplicateIds = [...new Set(ids.filter((id,index) => ids.indexOf(id) !== index))];
  const severeSafety = count(row => truthy(row.severe_safety_concern));
  const textConfusionStops = count(row => truthy(row.stopped_text_confusion));
  const clinicalMisread = count(row => truthy(row.interpreted_as_diagnosis_advice_therapy));
  const worseByMethod = new Map();
  for (const row of rows) if (norm(row.after_check_result) === "worse") {
    const method = row.method_id || "unknown"; worseByMethod.set(method, (worseByMethod.get(method) ?? 0) + 1);
  }
  const worstMethodSignals = [...worseByMethod].filter(([,count]) => count >= 2);
  const complete = count(row => norm(row.completed_reset) === "yes");
  const moreChoice = count(row => ["more_choice","more choice"].includes(norm(row.after_check_result)));
  const understandsBoundary = count(row => truthy(row.understands_nonclinical));
  const foundPrivacy = count(row => ["yes","partly"].includes(norm(row.found_privacy_delete_export)));
  const missingSafety = count(row => ["severe_safety_concern","stopped_text_confusion","interpreted_as_diagnosis_advice_therapy"].some(field => !knownBoolean(row[field])));
  const mustPause = severeSafety > 0 || textConfusionStops >= 4 || clinicalMisread >= 3 || worstMethodSignals.length > 0;
  let decision = "INSUFFICIENT_DATA";
  // A pause signal is actionable at user 1; never wait for all 15 people to encounter it.
  if (mustPause) decision = "NO_GO_FIX_PRODUCT";
  else if (duplicateIds.length || ids.some(id => !id)) decision = "INVALID_DATA";
  else if (rows.length >= 15 && !missingSafety) decision = complete >= 8 && moreChoice >= 5 && understandsBoundary >= 10 && foundPrivacy >= 8 ? "GO_BROADER_TESTFLIGHT" : "NO_GO_MORE_ITERATION";
  return { decision, complete, moreChoice, severeSafety, understandsBoundary, foundPrivacy, textConfusionStops,
    clinicalMisread, worstMethodSignals, missingSafety, duplicateIds,
    reuseYesOrMaybe: count(row => ["yes","maybe"].includes(norm(row.would_use_again_week))) };
}
