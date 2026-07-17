const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientProfile.jsx', 'utf8');

// 1. Add LinkIcon to lucide-react import
content = content.replace(/import { ArrowRight([^}]+)} from 'lucide-react';/, "import { ArrowRight$1, Link as LinkIcon } from 'lucide-react';");

// 2. Add link to fastEntry state
content = content.replace(/useState\(\{ title: '', campaign: '', date: '', budget: '', notes: '', color: '#3B82F6' \}\)/g, "useState({ title: '', campaign: '', date: '', budget: '', notes: '', link: '', color: '#3B82F6' })");

// 3. Add link to fastEntry clear (spread)
content = content.replace(/\{ \.\.\.fastEntry, title: '', budget: '', notes: '' \}/g, "{ ...fastEntry, title: '', budget: '', notes: '', link: '' }");

// 4. Add link to fastEntry clear (full)
content = content.replace(/\{ title: '', campaign: '', date: '', budget: '', notes: '', color: '#3B82F6' \}/g, "{ title: '', campaign: '', date: '', budget: '', notes: '', link: '', color: '#3B82F6' }");

// 5. handleFastAdd updates
content = content.replace(/description: fastEntry.notes,(\s+)color: finalColor/g, "description: fastEntry.notes,$1link: fastEntry.link,$1color: finalColor");

content = content.replace(/description: fastEntry.notes,(\s+)color: finalColor,(\s+)status: 'Pending',/g, "description: fastEntry.notes,$1link: fastEntry.link,$1color: finalColor,$2status: 'Pending',");

// 6. handleEditClick updates
content = content.replace(/notes: p.description \|\| '',(\s+)color: p.color \|\| '#3B82F6'/g, "notes: p.description || '',$1link: p.link || '',$1color: p.color || '#3B82F6'");

// 7. Render link icon next to p.title
content = content.replace(/<td style=\{\{ padding: '0.75rem 1rem', fontWeight: 600 \}\}>\{p.title\}<\/td>/g, "<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>\n  <div style={{ display: 'flex', alignItems: 'center' }}>\n    <span>{p.title}</span>\n    {p.link && <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target=\"_blank\" rel=\"noreferrer\" style={{ marginLeft: '0.5rem', color: 'var(--primary)', display: 'flex' }} title=\"فتح الرابط\"><LinkIcon size={14} /></a>}\n  </div>\n</td>");

content = content.replace(/<span>\{p.title\}<\/span>/g, "<div style={{ display: 'flex', alignItems: 'center' }}>\n  <span>{p.title}</span>\n  {p.link && <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target=\"_blank\" rel=\"noreferrer\" style={{ marginLeft: '0.5rem', color: 'var(--primary)', display: 'flex' }} title=\"فتح الرابط\"><LinkIcon size={14} /></a>}\n</div>");

// 8. Render input for link in fastEntry forms
content = content.replace(/placeholder="المهمة" autoFocus \/>/g, "placeholder=\"المهمة\" autoFocus />\n                                  <input type=\"text\" value={fastEntry.link} onChange={e => setFastEntry({...fastEntry, link: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '0.2rem', color: 'black' }} placeholder=\"رابط خارجي (اختياري)\" />");

content = content.replace(/placeholder="اسم المهمة \(واضغط Enter\)" autoFocus \/>/g, "placeholder=\"اسم المهمة (واضغط Enter)\" autoFocus />\n                              <input type=\"text\" value={fastEntry.link} onChange={e => setFastEntry({...fastEntry, link: e.target.value})} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginTop: '0.5rem', color: 'black' }} placeholder=\"رابط خارجي (اختياري)\" />");

fs.writeFileSync('src/pages/ClientProfile.jsx', content);
console.log('Successfully updated ClientProfile.jsx');
