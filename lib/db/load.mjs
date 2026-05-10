import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const SBURL = "postgresql://postgres.avgopoifluvtnyimhiio:MoulinRouge2@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
const PROD = JSON.parse(fs.readFileSync('/tmp/prod_backup.json','utf8'));

const c = new Client({ connectionString: SBURL });
await c.connect();

async function ins(table, cols, rows) {
  if (!rows.length) { console.log(`${table}: 0 rows`); return; }
  // Build VALUES as parameterized
  const placeholders = [];
  const params = [];
  let p = 1;
  for (const r of rows) {
    placeholders.push(`(${cols.map(() => `$${p++}`).join(',')})`);
    for (const col of cols) params.push(r[col]);
  }
  const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES ${placeholders.join(',')}`;
  const res = await c.query(sql, params);
  console.log(`${table}: inserted ${res.rowCount}`);
}

// 1) Users — preserve prod ids
const userRows = PROD.users.map(u => ({
  id: u.id,
  email: u.email,
  password_hash: u.password_hash,
  name: u.name,
  role: u.role,
  jurisdictions: u.jurisdictions,
  login_count: u.login_count || 0,
  created_at: u.created_at,
  reset_token: u.reset_token,
  reset_token_expiry: u.reset_token_expiry,
}));
await ins('users', ['id','email','password_hash','name','role','jurisdictions','login_count','created_at','reset_token','reset_token_expiry'], userRows);

// 2) Employers — preserve prod ids
const empRows = PROD.emps.map(e => ({
  id: e.id, employer_id: e.employer_id, name: e.name,
  address: e.address, jurisdiction: e.jurisdiction, created_at: e.created_at,
}));
await ins('employers', ['id','employer_id','name','address','jurisdiction','created_at'], empRows);

// 3) Jurisdictions
const jurRows = PROD.jurs.map(j => ({
  id: j.id, name: j.name, category: j.category, created_at: j.created_at,
}));
await ins('jurisdictions', ['id','name','category','created_at'], jurRows);

// 4) Documents
const docRows = PROD.docs.map(d => ({
  id: d.id, form_name: d.form_name, form_type: d.form_type,
  employer_id: d.employer_id, jurisdiction: d.jurisdiction,
  file_url: d.file_url, file_name: d.file_name || d.form_name,
  status: d.status || 'pending', uploaded_by: d.uploaded_by,
  created_at: d.created_at,
}));
await ins('documents', ['id','form_name','form_type','employer_id','jurisdiction','file_url','file_name','status','uploaded_by','created_at'], docRows);

// 5) Login history
const lhRows = PROD.lh.map(l => ({
  id: l.id, user_id: l.user_id, browser: l.browser || 'Unknown', login_at: l.login_at,
}));
await ins('login_history', ['id','user_id','browser','login_at'], lhRows);

// 6) Bump sequences so future inserts use unique ids
for (const t of ['users','employers','jurisdictions','documents','login_history','document_types']) {
  await c.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT MAX(id) FROM ${t}), 1), true)`);
}
console.log('sequences bumped');

// Final counts
console.log('\n=== FINAL ===');
for (const t of ['users','employers','jurisdictions','documents','login_history','document_types']) {
  const r = await c.query(`SELECT COUNT(*) FROM ${t}`);
  console.log(`${t}: ${r.rows[0].count}`);
}

await c.end();
