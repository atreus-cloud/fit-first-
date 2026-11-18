// Converts Katori's licensed CSV dataset into FitFirst's importable JSON.
// Usage: node scripts/import-katori.js ./katori-indian-food-dataset.csv
// Data credit/license: https://getkatori.com/data (CC BY 4.0)
const fs=require('fs');
const path=require('path');
const projectRoot=path.resolve(__dirname,'..');
const input=process.argv[2];
if(!input){console.error('Usage: node scripts/import-katori.js <Katori CSV path>');process.exit(1);}
function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);cell='';if(row.some(v=>v!==''))rows.push(row);row=[];}else if(c!=='\r')cell+=c;}if(cell.length||row.length){row.push(cell);rows.push(row);}const headers=rows.shift().map(h=>h.trim());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));}
const data=parseCsv(fs.readFileSync(input,'utf8')).map(r=>({id:'katori-'+(r.slug||r.dish||'food')+'-'+(r.preparation||'standard'),name:[r.dish,r.preparation&&r.preparation!=='standard'?`(${r.preparation})`:null].filter(Boolean).join(' '),category:r.family||'Indian dish',source:'Katori Indian food nutrition dataset (CC BY 4.0)',basis:'per 100 g',grams:100,kcal:Number(r.kcal_per_100g||0),protein:Number(r.protein_g_per_100g||0),carbs:Number(r.carbs_g_per_100g||0),fat:Number(r.fat_g_per_100g||0),fiber:0,sugar:0,sodium:0,confidence:r.confidence||'recipe estimate',serving_label:r.serving||'',serving_grams:Number(r.serving_g||0),url:r.url||'https://getkatori.com/data'})).filter(f=>f.name&&f.kcal>=0);
fs.mkdirSync(path.join(projectRoot,'data'),{recursive:true});fs.writeFileSync(path.join(projectRoot,'data/katori-foods.json'),JSON.stringify(data,null,2));console.log(`Imported ${data.length} Katori preparation rows into data/katori-foods.json. Nutrients not present in this source are left as zero.`);
