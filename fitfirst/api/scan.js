const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);
const MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-flash-latest';
function extractJson(text){
  const cleaned=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const start=cleaned.indexOf('{'), end=cleaned.lastIndexOf('}');
  if(start<0||end<=start) throw new Error('Model returned no JSON object');
  return JSON.parse(cleaned.slice(start,end+1));
}
module.exports=async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST only'});}
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'Gemini scanning is not configured yet. Add GEMINI_API_KEY in Vercel Project Settings → Environment Variables.'});
 try{
  const {imageBase64,mimeType='image/jpeg',notes=''}=req.body||{};
  if(!imageBase64||typeof imageBase64!=='string'||imageBase64.length>12000000)return res.status(400).json({error:'Image is missing or too large. Please use a compressed photo under about 8 MB.'});
  if(!ALLOWED.has(mimeType))return res.status(400).json({error:'Unsupported image format. Use JPEG, PNG or WebP.'});
  const raw=imageBase64.replace(/^data:[^,]+,/, '').replace(/\s/g,'');
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(raw))return res.status(400).json({error:'Image data is invalid.'});
  const prompt=`You are the food-vision component of FitFirst, a calorie-tracking app. Inspect the photo and identify each distinct visible edible item, including drinks, sauces, sides and toppings when visible. Estimate the edible amount in grams per item. Estimates are uncertain: do not imply scale-level accuracy. For each item, also give an approximate nutrition profile PER 100 GRAMS (kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) as a fallback estimate. For packaged items, do not guess a brand nutrition label. For mixed dishes, use a reasonable typical recipe and state key assumptions in notes. Return ONLY valid JSON (no markdown) in this shape: {"items":[{"name":"string","estimated_grams":150,"confidence":"low|medium|high","notes":"short assumptions","estimated_nutrition":{"kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0}}],"meal_notes":"short meal summary","uncertainty":"main uncertainties"}. If no food is visible, return an empty items array and explain in meal_notes. User notes: ${String(notes).slice(0,400)}`;
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  const upstream=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inline_data:{mime_type:mimeType,data:raw}}]}],generationConfig:{temperature:0.15,maxOutputTokens:8192,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(30000)});
  if(!upstream.ok){const body=await upstream.text();console.error('Gemini scan failed',upstream.status,body.slice(0,1200));return res.status(upstream.status===429?429:502).json({error:upstream.status===429?'Gemini rate limit reached. Please wait and try again.':'Gemini could not analyze this image. Check your API key, model access and billing.'});}
  const result=await upstream.json();
  const cand=result.candidates?.[0];const text=cand?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('')||'';
  if(!text){console.error('Gemini empty response',cand?.finishReason,JSON.stringify(result.promptFeedback||{}));return res.status(502).json({error:cand?.finishReason==='SAFETY'||result.promptFeedback?.blockReason?'Gemini declined to analyze this image. Try a different photo.':'Gemini returned no answer'+(cand?.finishReason?' ('+cand.finishReason+')':'')+'. Please try again.'});}
  const parsed=extractJson(text);
  const items=(Array.isArray(parsed.items)?parsed.items:[]).slice(0,15).map(x=>{
   const n=x.estimated_nutrition||{};const clean=(v,max=5000)=>Math.min(max,Math.max(0,Number(v)||0));
   return {name:String(x.name||'Unidentified food').slice(0,100),estimated_grams:clean(x.estimated_grams,3000)||100,confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'low',notes:String(x.notes||'').slice(0,250),estimated_nutrition:{kcal:clean(n.kcal),protein_g:clean(n.protein_g,300),carbs_g:clean(n.carbs_g,300),fat_g:clean(n.fat_g,300),fiber_g:clean(n.fiber_g,100),sugar_g:clean(n.sugar_g,200),sodium_mg:clean(n.sodium_mg,10000)}};
  });
  return res.status(200).json({items,meal_notes:String(parsed.meal_notes||''),uncertainty:String(parsed.uncertainty||''),model:MODEL,notice:'Food identification, portions and fallback nutrition are AI estimates. Database matches may be more reliable; review before saving.'});
 }catch(e){console.error('Photo scan error',e);return res.status(500).json({error:'Could not process this photo. Try a clearer, well-lit image or a smaller photo.'});}
};
