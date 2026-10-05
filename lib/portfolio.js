import { randomUUID } from 'node:crypto';
export const categories = { cilandak: ['Cilandak Estate', 'Cilandak, South Jakarta'], dharmawangsa: ['Dharmawangsa Apartment', 'Dharmawangsa Apartment'], dharmawangsa_residence: ['Dharmawangsa Residence', 'Dharmawangsa, South Jakarta'], enhancement: ['Enhancement', 'Studio Grade'] };
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('Teks tidak valid atau terlalu panjang.');
  return value.trim();
}
export function metadata(body) {
  if (!Object.hasOwn(categories, body.category)) fail('Kategori tidak valid.');
  return { title: text(body.title, 160, true), category: body.category, desc: text(body.desc ?? '', 2000), badge: text(body.badge ?? categories[body.category][0], 100), location: text(body.location ?? categories[body.category][1], 180, true) };
}
export function imagePath(value) { return typeof value === 'string' && /^assets\/(?:porto\/)?[a-zA-Z0-9_().-]+\.(?:webp|jpg|jpeg|png)$/i.test(value) && !value.includes('..'); }
export function validateBackup(items) {
  if (!Array.isArray(items) || items.length > 1000) fail('Backup harus berupa daftar dengan maksimal 1.000 foto.');
  const ids = new Set();
  return items.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) || ids.has(item.id) || !imagePath(item.img)) fail('ID duplikat atau lokasi foto backup tidak valid.');
    ids.add(item.id);
    return { id: item.id, ...metadata(item), img: item.img, ...(item.uploadedAt && !Number.isNaN(Date.parse(item.uploadedAt)) ? { uploadedAt: new Date(item.uploadedAt).toISOString() } : {}), ...(item.aspect && /^\d{1,4}:\d{1,4}$/.test(item.aspect) ? { aspect: item.aspect } : {}) };
  });
}
export function newPhoto(body) {
  const meta = metadata(body);
  if (typeof body.imageBase64 !== 'string' || !/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(body.imageBase64)) fail('Foto harus berupa WebP hasil pratinjau.');
  const content = body.imageBase64.split(',')[1];
  if (content.length > 3800000) fail('Foto terlalu besar. Batas hasil kompresi 2,8 MB.', 413);
  const bytes = Buffer.from(content, 'base64');
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') fail('Isi file WebP tidak valid.');
  const id = `porto-${randomUUID()}`;
  return { item: { id, ...meta, img: `assets/porto/${id}.webp`, aspect: /^\d{1,4}:\d{1,4}$/.test(body.aspect || '') ? body.aspect : '3:4', uploadedAt: new Date().toISOString() }, content };
}
