import { searchLocation } from "../api.js";
export function initSearch(onSelect) {
  const form=document.getElementById("searchForm"), input=document.getElementById("searchInput"), list=document.getElementById("suggestions"), status=document.getElementById("searchStatus"); let results=[], timer;
  const hide=()=>{ list.hidden=true; list.innerHTML=""; input.setAttribute("aria-expanded","false"); };
  const message=(text="")=>{ status.textContent=text; status.hidden=!text; };
  async function find(){ const query=input.value.trim(); if(query.length<2){hide();message();return [];} try { results=await searchLocation(query); if(!results.length){hide();message("No matching locations found.");return [];} list.innerHTML=results.map((p,i)=>`<li role="option"><button type="button" class="search__suggestion-btn" data-index="${i}"><strong>${p.name}</strong><small>${[p.admin1,p.country].filter(Boolean).join(", ")}</small></button></li>`).join(""); list.hidden=false; input.setAttribute("aria-expanded","true"); message("Choose a location from the list."); return results; } catch { hide(); message("Location search is unavailable. Please try again."); return []; } }
  input.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(find,300);});
  async function choose(place) { input.value=[place.name,place.admin1].filter(Boolean).join(", ");hide();message();document.getElementById("pages").hidden=true;document.getElementById("emptyState").hidden=true;document.getElementById("loadingState").hidden=false;try { await onSelect(place); } catch { message("Weather is unavailable for this location. Please try again.");document.getElementById("emptyState").hidden=false; } finally { document.getElementById("loadingState").hidden=true; } }
  list.addEventListener("click",async e=>{const b=e.target.closest("button[data-index]");if(!b)return;await choose(results[Number(b.dataset.index)]);});
  form.addEventListener("submit",async e=>{e.preventDefault();const found=await find();if(found[0]) await choose(found[0]);});
  document.addEventListener("click",e=>{if(!form.contains(e.target))hide();});
}
