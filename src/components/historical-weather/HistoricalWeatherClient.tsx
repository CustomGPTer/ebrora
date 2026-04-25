// src/components/historical-weather/HistoricalWeatherClient.tsx
"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import { UK_TOWNS, getWMO, fetchWeather, extractDayData, fetchBaseline, getDateRange, computeSummary, kmhToMph, fmtWind, fmtWindVal, fetchPlanningData, buildWeekSummaries, findBestWindows, computePlanningSummary, getConfidence, getDateRangePlanning, planningToCSV, historicalToCSV, WIND_THRESHOLDS_KMH } from "@/data/historical-weather";
import type { UKTown, ViewMode, WindUnit, DayWeather, WeatherResult, ToolMode, PlanningDay, PlanningResult } from "@/data/historical-weather";
import jsPDF from "jspdf";
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Weather Icons ───────────────────────────────────────────
function WeatherIcon({ code, size = 40 }: { code: number | null; size?: number }) {
  const wmo = getWMO(code); const s = size; const hs = s / 2;
  const Sun = () => (<g><circle cx={hs} cy={hs} r={s*0.22} fill="#FBBF24" />{Array.from({length:8}).map((_,i)=>{const a=(i*45)*Math.PI/180;return<line key={i} x1={hs+Math.cos(a)*s*0.3} y1={hs+Math.sin(a)*s*0.3} x2={hs+Math.cos(a)*s*0.42} y2={hs+Math.sin(a)*s*0.42} stroke="#FBBF24" strokeWidth={s*0.04} strokeLinecap="round"/>})}</g>);
  const Cld = ({x=0,y=0,f="#94A3B8"}:{x?:number;y?:number;f?:string})=>(<g transform={`translate(${x},${y})`}><ellipse cx={s*0.35} cy={s*0.42} rx={s*0.2} ry={s*0.14} fill={f}/><ellipse cx={s*0.55} cy={s*0.38} rx={s*0.22} ry={s*0.18} fill={f}/><ellipse cx={s*0.45} cy={s*0.48} rx={s*0.28} ry={s*0.12} fill={f}/></g>);
  const Rn = ({c=3,h=false}:{c?:number;h?:boolean})=>(<g>{Array.from({length:c}).map((_,i)=>{const x=s*0.25+i*s*0.18;const y2=s*0.62+(i%2)*s*0.06;return<line key={i} x1={x} y1={y2} x2={x-s*0.04} y2={y2+s*0.12} stroke={h?"#2563EB":"#60A5FA"} strokeWidth={s*0.035} strokeLinecap="round"/>})}</g>);
  const Sn = ({c=3}:{c?:number})=>(<g>{Array.from({length:c}).map((_,i)=><circle key={i} cx={s*0.25+i*s*0.2} cy={s*0.65+(i%2)*s*0.08} r={s*0.035} fill="#93C5FD"/>)}</g>);
  const Lt = ()=>(<polygon points={`${s*0.45},${s*0.5} ${s*0.52},${s*0.62} ${s*0.48},${s*0.62} ${s*0.55},${s*0.78}`} fill="#EAB308" stroke="#D97706" strokeWidth={s*0.01}/>);
  const Fg = ()=>(<g>{[0.5,0.58,0.66].map((yf,i)=><line key={i} x1={s*0.15} y1={s*yf} x2={s*0.85} y2={s*yf} stroke="#CBD5E1" strokeWidth={s*0.04} strokeLinecap="round" opacity={0.7-i*0.15}/>)}</g>);
  return(<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
    {wmo.icon==="clear"&&<Sun/>}{wmo.icon==="partly-cloudy"&&<><g transform={`translate(${-s*0.08},${-s*0.1})`}><Sun/></g><Cld x={s*0.08} y={s*0.08}/></>}
    {wmo.icon==="cloudy"&&<><Cld x={-s*0.05} y={-s*0.04} f="#CBD5E1"/><Cld x={s*0.05} y={s*0.04}/></>}
    {wmo.icon==="overcast"&&<><Cld x={-s*0.05} y={-s*0.04} f="#94A3B8"/><Cld x={s*0.05} y={s*0.04} f="#64748B"/></>}
    {wmo.icon==="fog"&&<><Cld x={0} y={-s*0.08} f="#CBD5E1"/><Fg/></>}
    {wmo.icon==="drizzle"&&<><Cld x={0} y={-s*0.06}/><Rn c={2}/></>}
    {wmo.icon==="rain-light"&&<><Cld x={0} y={-s*0.06}/><Rn c={3}/></>}
    {wmo.icon==="rain"&&<><Cld x={0} y={-s*0.06} f="#64748B"/><Rn c={4} h/></>}
    {wmo.icon==="rain-heavy"&&<><Cld x={0} y={-s*0.06} f="#475569"/><Rn c={5} h/></>}
    {wmo.icon==="freezing-rain"&&<><Cld x={0} y={-s*0.06} f="#64748B"/><Rn c={3}/><Sn c={2}/></>}
    {wmo.icon==="snow-light"&&<><Cld x={0} y={-s*0.06}/><Sn c={3}/></>}
    {wmo.icon==="snow"&&<><Cld x={0} y={-s*0.06} f="#64748B"/><Sn c={4}/></>}
    {wmo.icon==="snow-heavy"&&<><Cld x={0} y={-s*0.06} f="#475569"/><Sn c={5}/></>}
    {wmo.icon==="sleet"&&<><Cld x={0} y={-s*0.06} f="#64748B"/><Rn c={2}/><Sn c={2}/></>}
    {wmo.icon==="thunder"&&<><Cld x={0} y={-s*0.06} f="#475569"/><Lt/></>}
    {wmo.icon==="thunder-rain"&&<><Cld x={0} y={-s*0.06} f="#475569"/><Lt/><Rn c={3} h/></>}
  </svg>);
}

// ─── Location Search ─────────────────────────────────────────
function LocationSearch({value,onChange}:{value:UKTown|null;onChange:(t:UKTown)=>void}){
  const[query,setQuery]=useState(value?.name||"");const[open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
  const filtered=useMemo(()=>{if(!query||query.length<1)return[];const q=query.toLowerCase();return UK_TOWNS.filter(t=>t.name.toLowerCase().includes(q)||t.region.toLowerCase().includes(q)).slice(0,12)},[query]);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
  return(<div ref={ref} className="relative"><input type="text" value={query} placeholder="Search UK town or city..." onChange={e=>{setQuery(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none"/>
    {open&&filtered.length>0&&<div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">{filtered.map(t=><button key={`${t.name}-${t.region}`} onClick={()=>{onChange(t);setQuery(t.name);setOpen(false)}} className="w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light/40 flex justify-between items-center"><span className="font-medium text-gray-900">{t.name}</span><span className="text-[10px] text-gray-400">{t.region}</span></button>)}</div>}</div>);
}

// ─── Combined Chart ──────────────────────────────────────────
function CombinedChart({days,windUnit,isPlanning=false}:{days:(DayWeather|PlanningDay)[];windUnit:WindUnit;isPlanning?:boolean}){
  if(!days.length)return null;const W=700,H=280,P={l:45,r:50,t:20,b:40};const cw=W-P.l-P.r,ch=H-P.t-P.b;
  const temps=days.map(d=>isPlanning?(d as PlanningDay).avgHighC:((d as DayWeather).tempC??0));
  const avgs=isPlanning?[]as(number|null)[]:(days as DayWeather[]).map(d=>d.avgTempC??null);
  const rains=days.map(d=>isPlanning?(d as PlanningDay).avgRainMm:((d as DayWeather).precipMm??0));
  const winds=days.map(d=>fmtWindVal(isPlanning?(d as PlanningDay).avgWindKmh:(d as DayWeather).windKmh,windUnit));
  const tMn=Math.floor(Math.min(...temps,...(avgs.filter(a=>a!==null)as number[]))-2);
  const tMx=Math.ceil(Math.max(...temps,...(avgs.filter(a=>a!==null)as number[]))+2);
  const rMx=Math.max(Math.max(...rains)*1.3,2);const wMx=Math.max(Math.max(...winds)*1.2,10);const n=days.length;
  const bW=Math.min(cw/n*0.5,20);const xP=(i:number)=>P.l+(i+0.5)*(cw/n);
  const yT=(v:number)=>P.t+ch-((v-tMn)/(tMx-tMn))*ch;const yR=(v:number)=>P.t+ch-(v/rMx)*ch*0.4;const yW=(v:number)=>P.t+ch-(v/wMx)*ch;
  const ds=(d:DayWeather|PlanningDay)=>isPlanning?(d as PlanningDay).date:(d as DayWeather).date;
  return(<svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{maxHeight:300}}>
    {Array.from({length:6}).map((_,i)=>{const v=tMn+(i/5)*(tMx-tMn);const y=yT(v);return<g key={i}><line x1={P.l} y1={y} x2={W-P.r} y2={y} stroke="#F1F5F9" strokeWidth={1}/><text x={P.l-5} y={y+3} textAnchor="end" fontSize={8} fill="#94A3B8">{v.toFixed(0)}°</text></g>})}
    {rains.map((r,i)=>r>0&&<rect key={`r${i}`} x={xP(i)-bW/2} y={yR(r)} width={bW} height={P.t+ch-yR(r)} fill="#93C5FD" opacity={0.6} rx={2}/>)}
    {!isPlanning&&avgs.some(a=>a!==null)&&<polyline fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3" points={avgs.map((a,i)=>a!==null?`${xP(i)},${yT(a)}`:"").filter(Boolean).join(" ")}/>}
    <polyline fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinejoin="round" points={temps.map((t,i)=>`${xP(i)},${yT(t)}`).join(" ")}/>
    {temps.map((t,i)=><circle key={`t${i}`} cx={xP(i)} cy={yT(t)} r={3} fill="#EF4444" stroke="#fff" strokeWidth={1.5}/>)}
    <polyline fill="none" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2,2" strokeLinejoin="round" points={winds.map((w,i)=>`${xP(i)},${yW(w)}`).join(" ")}/>
    {days.map((d,i)=>{const show=n<=7||i%Math.ceil(n/12)===0;const s2=ds(d);return show&&<text key={`xl${i}`} x={xP(i)} y={H-P.b+15} textAnchor="middle" fontSize={8} fill="#64748B">{s2.slice(8,10)}/{s2.slice(5,7)}</text>})}
    {Array.from({length:4}).map((_,i)=>{const v=(i/3)*wMx;return<text key={`wa${i}`} x={W-P.r+5} y={yW(v)+3} fontSize={8} fill="#8B5CF6">{v.toFixed(0)}</text>})}
    <circle cx={P.l+5} cy={H-8} r={4} fill="#EF4444"/><text x={P.l+14} y={H-5} fontSize={9} fill="#374151">{isPlanning?"Avg High":"High"} (°C)</text>
    <rect x={P.l+100} y={H-12} width={10} height={8} fill="#93C5FD" rx={1} opacity={0.6}/><text x={P.l+115} y={H-5} fontSize={9} fill="#374151">Rain (mm)</text>
    <line x1={P.l+185} y1={H-8} x2={P.l+200} y2={H-8} stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2,2"/><text x={P.l+205} y={H-5} fontSize={9} fill="#374151">Wind ({windUnit})</text>
  </svg>);
}

function downloadCSV(csv:string,filename:string){const b=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u)}

// ─── PDF Export ──────────────────────────────────────────────
function exportPDF(mode:ToolMode,results:WeatherResult[],planResults:PlanningResult[],header:{company:string;site:string;manager:string;assessedBy:string;date:string},windUnit:WindUnit,rainThreshold:number){
  const doc=new jsPDF("p","mm","a4");const W2=210,M=14,CW=W2-2*M;let y=0;
  const docRef=`HWR-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const title=mode==="planning"?"Weather Planning Report":"Historical Weather Report";
  function checkPage(need:number){if(y+need>278){doc.addPage();doc.setFillColor(30,30,30);doc.rect(0,0,W2,10,"F");doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text(`${title.toUpperCase()} (continued)`,M,7);doc.setTextColor(0,0,0);y=14}}
  const drawFld=(l:string,v:string,x:number,fy:number,lw2:number)=>{doc.setFont("helvetica","bold");doc.text(l,x,fy);const w=doc.getTextWidth(l)+2;if(v){doc.setFont("helvetica","normal");doc.text(v,x+w,fy)}else{doc.setDrawColor(180,180,180);doc.line(x+w,fy,x+w+lw2,fy);doc.setDrawColor(220,220,220)}};
  doc.setFillColor(30,30,30);doc.rect(0,0,W2,28,"F");doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont("helvetica","bold");doc.text(title,M,10);
  doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(`Ref: ${docRef} | Rev 0 | ${header.date||todayISO()}`,M,15);
  if(mode==="planning"){doc.setFontSize(6);doc.text("Planning estimates based on historical averages -- not a weather forecast",M,20)}
  doc.setTextColor(0,0,0);y=32;
  doc.setFillColor(248,248,248);doc.setDrawColor(220,220,220);doc.roundedRect(M,y-3,CW,17,1,1,"FD");doc.setFontSize(7);
  drawFld("Company:",header.company,M+3,y+2,40);drawFld("Site:",header.site,M+CW/2,y+2,40);
  drawFld("Site Manager:",header.manager,M+3,y+8,30);drawFld("Assessed By:",header.assessedBy,M+CW/2,y+8,30);
  drawFld("Date:",header.date||todayISO(),M+3,y+14,30);y+=22;

  const wv=(kmh:number)=>windUnit==="mph"?kmhToMph(kmh).toFixed(1)+" mph":kmh.toFixed(1)+" km/h";

  if(mode==="planning"){
    for(const pr of planResults){
      checkPage(50);doc.setFillColor(30,30,30);doc.roundedRect(M,y,CW,12,2,2,"F");doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont("helvetica","bold");
      doc.text(`${pr.location.name}, ${pr.location.region}`,M+4,y+5);doc.setFontSize(7);doc.setFont("helvetica","normal");
      doc.text(`${pr.startDate} to ${pr.endDate} | ${pr.view} view | Baseline: ${pr.avgPeriod[0]}-${pr.avgPeriod[1]} | ${pr.confidence.label}`,M+4,y+10);doc.setTextColor(0,0,0);y+=16;
      const ps=pr.summary;
      const items:[string,string][]=[["Avg Daily High",`${ps.avgHighC.toFixed(1)} C`],["Avg Daily Low",`${ps.avgLowC.toFixed(1)} C`],["Avg Daily Rain",`${ps.avgRainMm.toFixed(1)} mm`],["Rain Probability",`${ps.rainProbability.toFixed(0)}%`],["Frost Probability",`${ps.frostProbability.toFixed(0)}%`],["Avg Wind Speed",wv(ps.avgWindKmh)],...ps.windExceedance.filter(w=>w.percent>0).map(w=>[`Wind > ${w.mph}mph (${w.label})`,`${w.percent.toFixed(0)}% of days`] as [string,string])];
      const pH=4+items.length*3.8+2;doc.setFillColor(248,250,252);doc.setDrawColor(200,210,220);doc.roundedRect(M,y-2,CW,pH,1.5,1.5,"FD");
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("Planning Summary",M+4,y+2);y+=6;
      items.forEach(([l,v])=>{doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(55,65,81);doc.text(l+":",M+4,y);doc.setTextColor(17,24,39);doc.setFont("helvetica","normal");doc.text(v,M+60,y);doc.setTextColor(0,0,0);y+=3.8});y+=6;
      if(pr.bestWindows.length>0){checkPage(20);doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("Best Working Windows",M,y);y+=5;
        pr.bestWindows.forEach((bw,i)=>{checkPage(6);doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(`${i+1}. ${bw.startDate} to ${bw.endDate} -- High: ${bw.avgHighC.toFixed(1)}°C, Rain: ${bw.rainProbability.toFixed(0)}%, Frost: ${bw.frostProbability.toFixed(0)}%, Wind: ${wv(bw.avgWindKmh)}`,M+2,y);y+=4});y+=4}
      checkPage(15);doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("Daily Planning Data",M,y);y+=5;
      const cols=[22,18,18,20,20,18,18,18,18,12];let cx=M;
      ["Date","High °C","Low °C","Rain mm","Rain %","Wind","Crane% (>25mph)","Frost%","Cloud%",""].forEach((h,i)=>{doc.setFillColor(30,30,30);doc.rect(cx,y,cols[i],6,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(5);doc.text(h,cx+1,y+4);cx+=cols[i]});
      doc.setTextColor(0,0,0);y+=6;doc.setDrawColor(200,200,200);
      pr.days.forEach((day,ri)=>{checkPage(5.5);cx=M;const crane=day.windExceedance.find(w=>w.mph===25)?.percent??0;
        const cells=[day.date.slice(5),day.avgHighC.toFixed(1),day.avgLowC.toFixed(1),day.avgRainMm.toFixed(1),day.rainProbability.toFixed(0),fmtWind(day.avgWindKmh,windUnit).replace(/ (mph|km\/h)/,""),crane.toFixed(0),day.frostProbability.toFixed(0),day.avgCloudCover.toFixed(0),""];
        cells.forEach((t,i)=>{if(ri%2===0){doc.setFillColor(250,250,250);doc.rect(cx,y,cols[i],5.5,"FD")}else{doc.rect(cx,y,cols[i],5.5,"D")}doc.setTextColor(0,0,0);doc.setFont("helvetica",i===0?"bold":"normal");doc.setFontSize(5);doc.text(t,cx+1,y+3.8);cx+=cols[i]});y+=5.5});
      // ── Temperature & Rain Chart
      y+=3;checkPage(40);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text("Temperature & Rain Overview",M,y);y+=5;
      {const cX=M+8,cW2=CW-16,cH=30,cY=y;
      doc.setFillColor(248,250,252);doc.rect(cX,cY,cW2,cH,"F");
      const days=pr.days;const n=days.length;if(n>1){
        const tMin=Math.min(...days.map(d=>d.avgLowC));const tMax=Math.max(...days.map(d=>d.avgHighC));const tRange=Math.max(tMax-tMin,1);
        const rMax=Math.max(...days.map(d=>d.avgRainMm),1);
        const barW2=cW2/n;
        days.forEach((d,di)=>{const bx=cX+di*barW2;
          // Rain bar (blue, from bottom)
          const rH=(d.avgRainMm/rMax)*cH*0.4;
          if(rH>0.5){doc.setFillColor(147,197,253);doc.rect(bx+barW2*0.2,cY+cH-rH,barW2*0.6,rH,"F")}
          // Temperature band (red line for high, blue line for low)
          if(di>0){const px=(di-1)*barW2+barW2/2;const nx=di*barW2+barW2/2;
            const ph=cY+cH*0.55-((days[di-1].avgHighC-tMin)/tRange)*cH*0.5;
            const nh=cY+cH*0.55-((d.avgHighC-tMin)/tRange)*cH*0.5;
            doc.setDrawColor(239,68,68);doc.setLineWidth(0.6);doc.line(cX+px,ph,cX+nx,nh);
            const pl=cY+cH*0.55-((days[di-1].avgLowC-tMin)/tRange)*cH*0.5;
            const nl=cY+cH*0.55-((d.avgLowC-tMin)/tRange)*cH*0.5;
            doc.setDrawColor(59,130,246);doc.setLineWidth(0.4);doc.line(cX+px,pl,cX+nx,nl)}
        });
        // Legend
        doc.setFontSize(4.5);doc.setDrawColor(239,68,68);doc.setLineWidth(0.6);doc.line(cX+2,cY-1.5,cX+8,cY-1.5);doc.setTextColor(239,68,68);doc.text("High °C",cX+10,cY-0.5);
        doc.setDrawColor(59,130,246);doc.setLineWidth(0.4);doc.line(cX+30,cY-1.5,cX+36,cY-1.5);doc.setTextColor(59,130,246);doc.text("Low °C",cX+38,cY-0.5);
        doc.setFillColor(147,197,253);doc.rect(cX+56,cY-2.5,4,2,"F");doc.setTextColor(147,197,253);doc.text("Rain mm",cX+62,cY-0.5);
        doc.setTextColor(0,0,0);doc.setLineWidth(0.2);doc.setDrawColor(220,220,220);
      }y=cY+cH+5}
      y+=5}
  }else{
    for(const res of results){
      checkPage(50);doc.setFillColor(30,30,30);doc.roundedRect(M,y,CW,12,2,2,"F");doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont("helvetica","bold");
      doc.text(`${res.location.name}, ${res.location.region}`,M+4,y+5);doc.setFontSize(7);doc.setFont("helvetica","normal");
      doc.text(`${res.startDate} to ${res.endDate} | ${res.view} view | Baseline: ${res.avgPeriod[0]}-${res.avgPeriod[1]}`,M+4,y+10);doc.setTextColor(0,0,0);y+=16;
      const s=res.summary;
      const items:[string,string][]=[["Average High",`${s.avgTemp.toFixed(1)} C (baseline: ${s.baselineAvgTemp.toFixed(1)} C, delta: ${s.tempDelta>=0?"+":""}${s.tempDelta.toFixed(1)} C)`],["Max / Min",`${s.maxTemp.toFixed(1)} C / ${s.minTemp.toFixed(1)} C`],["Total Rainfall",`${s.totalRainMm.toFixed(1)} mm`],["Rain Days",`${s.rainDays} days`],["Average Wind",fmtWind(s.avgWind,windUnit)],["Max Wind",fmtWind(s.maxWind,windUnit)],["Humidity",`${s.avgHumidity.toFixed(0)}%`],["Cloud",`${s.avgCloud.toFixed(0)}%`],["Conditions",getWMO(s.dominantCode).description]];
      const pH=4+items.length*3.8+2;doc.setFillColor(248,250,252);doc.setDrawColor(200,210,220);doc.roundedRect(M,y-2,CW,pH,1.5,1.5,"FD");
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("Weather Summary",M+4,y+2);y+=6;
      items.forEach(([l,v])=>{doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(55,65,81);doc.text(l+":",M+4,y);doc.setTextColor(17,24,39);doc.setFont("helvetica","normal");doc.text(v,M+60,y);doc.setTextColor(0,0,0);y+=3.8});y+=6;
      checkPage(15);doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("Daily Weather Data",M,y);y+=5;
      const cols=[22,20,20,22,22,22,22,22,10];let cx=M;
      ["Date","High °C","Low °C","Wind","Rain mm","Humid %","Cloud %","Conditions",""].forEach((h,i)=>{doc.setFillColor(30,30,30);doc.rect(cx,y,cols[i],6,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(5.5);doc.text(h,cx+1.5,y+4);cx+=cols[i]});
      doc.setTextColor(0,0,0);y+=6;doc.setDrawColor(200,200,200);
      res.days.forEach((day,ri)=>{checkPage(5.5);cx=M;const wmo2=getWMO(day.weatherCode);
        const cells=[day.date.slice(5),day.tempC!==null?day.tempC.toFixed(1):"--",day.tempMinC!==null?day.tempMinC.toFixed(1):"--",day.windKmh!==null?fmtWind(day.windKmh,windUnit).replace(/ (mph|km\/h)/,""):"--",day.precipMm!==null?day.precipMm.toFixed(1):"--",day.humidity!==null?String(Math.round(day.humidity)):"--",day.cloudCover!==null?String(Math.round(day.cloudCover)):"--",wmo2.description.slice(0,14),""];
        cells.forEach((t,i)=>{if(ri%2===0){doc.setFillColor(250,250,250);doc.rect(cx,y,cols[i],5.5,"FD")}else{doc.rect(cx,y,cols[i],5.5,"D")}doc.setTextColor(0,0,0);doc.setFont("helvetica",i===0?"bold":"normal");doc.setFontSize(5);doc.text(t,cx+1.5,y+3.8);cx+=cols[i]});y+=5.5});y+=8}
  }
  checkPage(50);y+=4;doc.setDrawColor(30,30,30);doc.line(M,y,W2-M,y);y+=6;doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text("SIGN-OFF",M,y);y+=6;
  const soW=CW/2-2,soH=8;doc.setDrawColor(200,200,200);doc.setFontSize(7.5);doc.setFillColor(245,245,245);
  doc.rect(M,y,soW,soH,"FD");doc.rect(M+soW+4,y,soW,soH,"FD");doc.setFont("helvetica","bold");doc.text("Prepared By",M+3,y+5.5);doc.text("Site Manager",M+soW+7,y+5.5);y+=soH;
  (["Name:","Position:","Signature:","Date:"] as const).forEach(l=>{doc.rect(M,y,soW,soH,"D");doc.rect(M+soW+4,y,soW,soH,"D");doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.text(l,M+3,y+5.5);doc.text(l,M+soW+7,y+5.5);doc.setFont("helvetica","normal");y+=soH});
  const pc=doc.getNumberOfPages();for(let p=1;p<=pc;p++){doc.setPage(p);doc.setFontSize(5.5);doc.setTextColor(130,130,130);
    doc.text(mode==="planning"?"Planning estimates based on historical averages from Open-Meteo Archive API. NOT a weather forecast. Verify with Met Office for contractual purposes.":"Historical weather data from Open-Meteo Archive API. Daily highs, lows, and 24hr totals. Europe/London timezone.",M,287);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pc}`,W2-M-50,291)}
  doc.save(`${mode==="planning"?"weather-planning":"weather-report"}-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function HistoricalWeatherClient(){
  const[company,setCompany]=useState("");const[site,setSite]=useState("");const[manager,setManager]=useState("");
  const[assessedBy,setAssessedBy]=useState("");const[assessDate,setAssessDate]=useState(todayISO());const[showSettings,setShowSettings]=useState(false);
  const[toolMode,setToolMode]=useState<ToolMode>("historical");const[locations,setLocations]=useState<(UKTown|null)[]>([null]);
  const[selectedDate,setSelectedDate]=useState(todayISO());const[view,setView]=useState<ViewMode>("day");
  const[windUnit,setWindUnit]=useState<WindUnit>("mph");const[avgStart,setAvgStart]=useState(2005);const[avgEnd,setAvgEnd]=useState(2025);
  const[rainThreshold,setRainThreshold]=useState(1);const[workingDaysOnly,setWorkingDaysOnly]=useState(false);const[windowSize,setWindowSize]=useState(5);
  const[results,setResults]=useState<WeatherResult[]>([]);const[planResults,setPlanResults]=useState<PlanningResult[]>([]);
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");
  const addLoc=()=>{if(locations.length<3)setLocations([...locations,null])};
  const rmLoc=(i:number)=>{if(locations.length>1)setLocations(locations.filter((_,j)=>j!==i))};
  const updLoc=(i:number,t:UKTown)=>{const n=[...locations];n[i]=t;setLocations(n)};
  const hasResults=toolMode==="planning"?planResults.length>0:results.length>0;

  const handleFetch=useCallback(async()=>{
    const validLocs=locations.filter((l):l is UKTown=>l!==null);
    if(!validLocs.length){setError("Please select at least one location");return}
    setLoading(true);setError("");setResults([]);setPlanResults([]);
    try{
      if(toolMode==="planning"){
        const[startDate,endDate]=getDateRangePlanning(selectedDate,view);const allPlan:PlanningResult[]=[];
        for(const loc of validLocs){
          const d=new Date(startDate+"T12:00:00");const end=new Date(endDate+"T12:00:00");const tds:string[]=[];
          while(d<=end){tds.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
          const cs=Math.max(avgStart,avgEnd-20);const dayMap=await fetchPlanningData(loc.lat,loc.lon,tds,cs,avgEnd,rainThreshold);
          const days=tds.map(td=>dayMap.get(td)!).filter(Boolean);const ws=buildWeekSummaries(days);
          const bw=view==="month"?findBestWindows(days,windowSize,workingDaysOnly):[];const yc=days[0]?.yearsOfData??0;
          allPlan.push({location:loc,view,startDate,endDate,avgPeriod:[cs,avgEnd],days,weekSummaries:ws,bestWindows:bw,confidence:getConfidence(yc),summary:computePlanningSummary(days)})}
        setPlanResults(allPlan);
      }else{
        const[startDate,endDate]=getDateRange(selectedDate,view);const allRes:WeatherResult[]=[];
        for(const loc of validLocs){
          const data=await fetchWeather(loc.lat,loc.lon,startDate,endDate);const dayMap=extractDayData(data);
          const days:DayWeather[]=[];const d=new Date(startDate+"T12:00:00");const end=new Date(endDate+"T12:00:00");const tds:string[]=[];
          while(d<=end){tds.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
          let bm=new Map<string,{avgTempC:number;avgPrecipMm:number;avgWindKmh:number}>();
          try{bm=await fetchBaseline(loc.lat,loc.lon,tds,Math.max(avgStart,avgEnd-20),avgEnd)}catch{}
          for(const ds of tds){const e=dayMap.get(ds);const bl=bm.get(ds);
            days.push({date:ds,tempC:e?.tempHighC??null,tempMinC:e?.tempLowC??null,windKmh:(e?.values?.windKmh as number)??null,windDir:null,humidity:(e?.values?.humidity as number)??null,precipMm:e?.totalPrecipMm??null,cloudCover:(e?.values?.cloudCover as number)??null,weatherCode:(e?.values?.weatherCode as number)??null,avgTempC:bl?.avgTempC??null,avgPrecipMm:bl?.avgPrecipMm??null,avgWindKmh:bl?.avgWindKmh??null})}
          allRes.push({location:loc,view,startDate,endDate,days,avgPeriod:[avgStart,avgEnd],summary:computeSummary(days)})}
        setResults(allRes)}
    }catch(e2){setError(e2 instanceof Error?e2.message:"Failed to fetch weather data")}finally{setLoading(false)}
  },[locations,selectedDate,view,avgStart,avgEnd,toolMode,rainThreshold,workingDaysOnly,windowSize]);

  const clearAll=()=>{setLocations([null]);setSelectedDate(todayISO());setView("day");setResults([]);setPlanResults([]);setError("")};
  const handleExport=()=>{exportPDF(toolMode,results,planResults,{company,site,manager,assessedBy,date:assessDate},windUnit,rainThreshold)};
  const handleCSV=()=>{if(toolMode==="planning"&&planResults.length>0)downloadCSV(planningToCSV(planResults[0].days,windUnit),`weather-planning-${todayISO()}.csv`);else if(results.length>0)downloadCSV(historicalToCSV(results[0].days,windUnit),`weather-data-${todayISO()}.csv`)};

  const firstRes=results[0];const firstPlan=planResults[0];
  const cards=useMemo(()=>{
    if(toolMode==="planning"&&firstPlan){const ps=firstPlan.summary;return[
      {label:"Avg High",value:`${ps.avgHighC.toFixed(1)}°C`,sub:`Low: ${ps.avgLowC.toFixed(1)}°C`,bgClass:"bg-red-50",textClass:"text-red-800",borderClass:"border-red-200",dotClass:"bg-red-500"},
      {label:"Rain Probability",value:`${ps.rainProbability.toFixed(0)}%`,sub:`Avg ${ps.avgRainMm.toFixed(1)}mm/day`,bgClass:"bg-blue-50",textClass:"text-blue-800",borderClass:"border-blue-200",dotClass:"bg-blue-500"},
      {label:"Frost Risk",value:`${ps.frostProbability.toFixed(0)}%`,sub:ps.frostProbability>20?"Plan for frost protection":"Low frost risk",bgClass:ps.frostProbability>20?"bg-cyan-50":"bg-emerald-50",textClass:ps.frostProbability>20?"text-cyan-800":"text-emerald-800",borderClass:ps.frostProbability>20?"border-cyan-200":"border-emerald-200",dotClass:ps.frostProbability>20?"bg-cyan-500":"bg-emerald-500"},
      {label:"Wind",value:fmtWind(ps.avgWindKmh,windUnit),sub:ps.windExceedance.find(w=>w.mph===25)?.percent?`Crane risk: ${ps.windExceedance.find(w=>w.mph===25)!.percent.toFixed(0)}%`:"Low crane risk",bgClass:"bg-purple-50",textClass:"text-purple-800",borderClass:"border-purple-200",dotClass:"bg-purple-500"}]}
    if(firstRes){const s=firstRes.summary;const delta=s.tempDelta>=0?`+${s.tempDelta.toFixed(1)}`:s.tempDelta.toFixed(1);return[
      {label:"Temperature",value:`${s.avgTemp.toFixed(1)}°C`,sub:`${delta}°C vs baseline`,bgClass:s.tempDelta>2?"bg-orange-50":s.tempDelta<-2?"bg-cyan-50":"bg-red-50",textClass:s.tempDelta>2?"text-orange-800":s.tempDelta<-2?"text-cyan-800":"text-red-800",borderClass:s.tempDelta>2?"border-orange-200":s.tempDelta<-2?"border-cyan-200":"border-red-200",dotClass:s.tempDelta>2?"bg-orange-500":s.tempDelta<-2?"bg-cyan-500":"bg-red-500"},
      {label:"Rainfall",value:`${s.totalRainMm.toFixed(1)} mm`,sub:`${s.rainDays} rain day${s.rainDays!==1?"s":""}`,bgClass:"bg-blue-50",textClass:"text-blue-800",borderClass:"border-blue-200",dotClass:"bg-blue-500"},
      {label:"Wind Speed",value:fmtWind(s.avgWind,windUnit),sub:`Max: ${fmtWind(s.maxWind,windUnit)}`,bgClass:"bg-purple-50",textClass:"text-purple-800",borderClass:"border-purple-200",dotClass:"bg-purple-500"},
      {label:"Conditions",value:getWMO(s.dominantCode).description,sub:`Cloud: ${s.avgCloud.toFixed(0)}% | Humidity: ${s.avgHumidity.toFixed(0)}%`,bgClass:"bg-emerald-50",textClass:"text-emerald-800",borderClass:"border-emerald-200",dotClass:"bg-emerald-500"}]}
    return[{label:"Temperature",value:"--",sub:"Daily high",bgClass:"bg-red-50",textClass:"text-red-800",borderClass:"border-red-200",dotClass:"bg-red-500"},{label:"Rainfall",value:"--",sub:"Total precipitation",bgClass:"bg-blue-50",textClass:"text-blue-800",borderClass:"border-blue-200",dotClass:"bg-blue-500"},{label:"Wind Speed",value:"--",sub:windUnit==="mph"?"miles per hour":"km per hour",bgClass:"bg-purple-50",textClass:"text-purple-800",borderClass:"border-purple-200",dotClass:"bg-purple-500"},{label:"Conditions",value:"--",sub:"Dominant weather",bgClass:"bg-emerald-50",textClass:"text-emerald-800",borderClass:"border-emerald-200",dotClass:"bg-emerald-500"}]
  },[firstRes,firstPlan,windUnit,toolMode]);

  return(<div className="space-y-4">
    {/* Summary Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(c=><div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}><div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`}/><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div><div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div><div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div></div>)}</div>

    {/* Toolbar */}
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={()=>setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>Settings</button>
      <div className="flex gap-1">{(["mph","kmh"] as const).map(u=><button key={u} onClick={()=>setWindUnit(u)} className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${windUnit===u?"border-ebrora/30 bg-ebrora-light/40 text-ebrora":"text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>{u==="mph"?"MPH":"KM/H"}</button>)}</div>
      <div className="flex-1"/>
      {hasResults&&<button onClick={handleCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>CSV</button>}
      <PaidDownloadButton hasData={hasResults}><button onClick={handleExport} disabled={!hasResults} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>PDF</button></PaidDownloadButton>
      <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>Clear</button>
    </div>

    {/* Settings */}
    {showSettings&&<div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[{l:"Company",v:company,s:setCompany},{l:"Site",v:site,s:setSite},{l:"Site Manager",v:manager,s:setManager},{l:"Assessed By",v:assessedBy,s:setAssessedBy}].map(f=><div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label><input type="text" value={f.v} onChange={e=>f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none"/></div>)}
      <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label><input type="date" value={assessDate} onChange={e=>setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none"/></div>
    </div>}

    {/* Input */}
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mode</span>
        <div className="flex gap-1">{(["historical","planning"] as const).map(m=><button key={m} onClick={()=>{setToolMode(m);setResults([]);setPlanResults([])}} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${toolMode===m?"border-ebrora/30 bg-ebrora-light/40 text-ebrora":"text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>{m==="historical"?"Historical Data":"Works Planning"}</button>)}</div>
      </div>
      {toolMode==="planning"&&<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start"><span className="text-amber-600 text-sm font-bold mt-0.5">!</span><div className="text-xs text-amber-800"><strong>Planning Mode</strong> — Shows expected weather based on historical averages. This is not a weather forecast. Use for programme planning, not safety-critical decisions.</div></div>}

      {locations.map((loc,i)=><div key={i} className="flex gap-2 items-end"><div className="flex-1"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Location {locations.length>1?i+1:""}</label><LocationSearch value={loc} onChange={t=>updLoc(i,t)}/></div>{locations.length>1&&<button onClick={()=>rmLoc(i)} className="px-2 py-2.5 text-xs text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}</div>)}
      {locations.length<3&&<button onClick={addLoc} className="text-xs text-ebrora hover:text-ebrora-dark font-medium">+ Add comparison location</button>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{toolMode==="planning"?"Target Date":"Date"}</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none"/></div>
        <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">View</label><div className="flex gap-1">{(["day","week","month"] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors capitalize ${view===v?"border-ebrora/30 bg-ebrora-light/40 text-ebrora":"text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>{v}</button>)}</div></div>
        <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Baseline Period</label><div className="flex gap-2 items-center"><input type="number" value={avgStart} onChange={e=>{const v=parseInt(e.target.value)||2005;setAvgStart(v);if(avgEnd-v>20)setAvgEnd(v+20)}} min={1940} max={2025} className="w-20 border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:border-ebrora outline-none text-center"/><span className="text-xs text-gray-400">to</span><input type="number" value={avgEnd} onChange={e=>{const v=parseInt(e.target.value)||2025;setAvgEnd(v);if(v-avgStart>20)setAvgStart(v-20)}} min={1940} max={2025} className="w-20 border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:border-ebrora outline-none text-center"/><span className="text-[10px] text-gray-400">(max 20 yrs)</span></div></div>
      </div>

      {toolMode==="planning"&&view==="month"&&<div className="flex flex-wrap gap-4 items-end">
        <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Rain Threshold (mm)</label><input type="number" value={rainThreshold} onChange={e=>setRainThreshold(parseFloat(e.target.value)||1)} min={0.1} step={0.5} className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none"/></div>
        <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Best Window (days)</label><input type="number" value={windowSize} onChange={e=>setWindowSize(parseInt(e.target.value)||5)} min={2} max={14} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none"/></div>
        <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={workingDaysOnly} onChange={e=>setWorkingDaysOnly(e.target.checked)} className="rounded border-gray-300 text-ebrora focus:ring-ebrora"/><span className="text-xs text-gray-600">Working days only (Mon-Fri)</span></label>
      </div>}
      {view==="month"&&toolMode==="historical"&&<div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Rain Day Threshold (mm)</label><input type="number" value={rainThreshold} onChange={e=>setRainThreshold(parseFloat(e.target.value)||1)} min={0.1} step={0.5} className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none"/></div>}

      <button onClick={handleFetch} disabled={loading} className="w-full py-2.5 text-sm font-semibold text-white bg-ebrora rounded-lg hover:bg-ebrora-dark transition-colors disabled:opacity-50">{loading?"Fetching weather data...":toolMode==="planning"?"Get Planning Data":"Get Weather Data"}</button>
      {error&&<div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start"><span className="text-lg font-bold text-red-600">!</span><div><div className="text-sm font-bold text-red-900">Error</div><div className="text-xs text-red-800 mt-1">{error}</div></div></div>}
    </div>

    {/* Result Heading */}
    {hasResults&&(()=>{const r=toolMode==="planning"?planResults[0]:results[0];const locNames=(toolMode==="planning"?planResults:results).map(r2=>r2.location.name).join(" vs ");
      const startD=new Date(r.startDate+"T12:00:00");const endD=new Date(r.endDate+"T12:00:00");
      const fD=(d:Date)=>d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});const fM=(d:Date)=>d.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
      let period="";if(view==="day")period=`${toolMode==="planning"?"Expected Weather":"Historical Weather"}, ${startD.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`;
      else if(view==="week")period=`${toolMode==="planning"?"7-Day Planning Summary":"7-Day Weather Summary"}, ${fD(startD)} – ${fD(endD)}`;
      else period=`${toolMode==="planning"?"Monthly Planning Summary":"Monthly Weather Summary"}, ${fM(startD)}`;
      const conf=toolMode==="planning"?(planResults[0] as PlanningResult).confidence:null;
      return<div className="border-b border-gray-200 pb-3"><div className="flex items-center gap-2 flex-wrap"><h2 className="text-base font-bold text-gray-900">{locNames}, UK</h2>
        {conf&&<span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${conf.level==="high"?"bg-emerald-50 text-emerald-700 border border-emerald-200":conf.level==="moderate"?"bg-amber-50 text-amber-700 border border-amber-200":"bg-red-50 text-red-700 border border-red-200"}`}>{conf.level} confidence</span>}</div>
        <p className="text-sm text-gray-500 mt-0.5">{period}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{toolMode==="planning"?`Planning estimate based on ${r.avgPeriod[0]}–${r.avgPeriod[1]} historical data`:`Compared against ${r.avgPeriod[0]}–${r.avgPeriod[1]} historical average`} · Source: Open-Meteo ERA5</p></div>})()}

    {/* PLANNING RESULTS */}
    {toolMode==="planning"&&planResults.map((pr,ri)=><div key={ri} className="space-y-4">
      {planResults.length>1&&<div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:["#EF4444","#3B82F6","#10B981"][ri]}}/><span className="text-sm font-bold text-gray-900">{pr.location.name}</span></div>}
      {pr.summary.windExceedance.filter(w=>w.percent>5).map(w=><div key={w.mph} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start"><span className="text-amber-600 text-sm">💨</span><div className="text-xs text-amber-800"><strong>Wind &gt; {w.mph}mph ({w.label})</strong> — occurred on {w.percent.toFixed(0)}% of days historically. {w.mph>=45?"Consider contingency days in programme.":w.mph>=35?"MEWP work may be restricted.":"Plan crane lifts for calm windows."}</div></div>)}
      {pr.bestWindows.length>0&&view==="month"&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-2">Best {windowSize}-Day Working Windows</div><div className="space-y-2">{pr.bestWindows.map((bw,i)=><div key={i} className="flex items-center gap-3 text-xs"><span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">{i+1}</span><span className="font-semibold text-emerald-900">{new Date(bw.startDate+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(bw.endDate+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span><span className="text-emerald-700">High: {bw.avgHighC.toFixed(1)}°C · Rain: {bw.rainProbability.toFixed(0)}% · Frost: {bw.frostProbability.toFixed(0)}% · Wind: {fmtWind(bw.avgWindKmh,windUnit)}</span></div>)}</div></div>}

      {view==="day"&&pr.days[0]&&(()=>{const d=pr.days[0];return<div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4"><div><div className="text-lg font-bold text-gray-900">{pr.location.name}</div><div className="text-xs text-gray-500">{new Date(d.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div><WeatherIcon code={d.dominantWeatherCode} size={64}/></div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{d.avgHighC.toFixed(1)}°C <span className="text-sm font-medium text-gray-400">(range: {d.rangeHighC[0].toFixed(0)}–{d.rangeHighC[1].toFixed(0)}°C)</span></div>
        <div className="text-sm text-gray-600 mb-4">{getWMO(d.dominantWeatherCode).description}</div>
        {d.frostProbability>0&&<div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg mb-4 bg-cyan-50 text-cyan-700 border border-cyan-200">Frost probability: {d.frostProbability.toFixed(0)}%</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{icon:"🌡",label:"Daily Low",value:`${d.avgLowC.toFixed(1)}°C`,sub:`${d.rangeLowC[0].toFixed(0)}–${d.rangeLowC[1].toFixed(0)}°C`},{icon:"🌧",label:"Rain Prob",value:`${d.rainProbability.toFixed(0)}%`,sub:`Avg ${d.avgRainMm.toFixed(1)}mm`},{icon:"💨",label:"Wind",value:fmtWind(d.avgWindKmh,windUnit),sub:`Max: ${fmtWind(d.maxWindKmh,windUnit)}`},{icon:"☁",label:"Cloud",value:`${d.avgCloudCover.toFixed(0)}%`,sub:`Humid: ${d.avgHumidity.toFixed(0)}%`}].map(item=><div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-lg">{item.icon}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">{item.label}</div><div className="text-sm font-bold text-gray-900">{item.value}</div><div className="text-[10px] text-gray-400">{item.sub}</div></div>)}</div></div>})()}

      {(view==="week"||view==="month")&&pr.days.length>0&&<>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">{view==="week"?"7-Day":"Monthly"} Planning Overview</div><CombinedChart days={pr.days} windUnit={windUnit} isPlanning/></div>
        {view==="month"&&pr.weekSummaries.length>0&&<div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Weekly Summary</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{pr.weekSummaries.map(ws=><div key={ws.weekNum} className="bg-gray-50 rounded-lg p-3"><div className="text-xs font-bold text-gray-700 mb-1">Week {ws.weekNum}: {new Date(ws.startDate+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(ws.endDate+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div><div className="text-[10px] text-gray-600 space-y-0.5"><div>High: {ws.avgHighC.toFixed(1)}°C · Low: {ws.avgLowC.toFixed(1)}°C</div><div>Rain: {ws.rainProbability.toFixed(0)}% · ~{ws.rainDaysAvg.toFixed(1)} rain days</div>{ws.frostProbability>0&&<div className="text-cyan-600">Frost: {ws.frostProbability.toFixed(0)}%</div>}<div>Wind: {fmtWind(ws.avgWindKmh,windUnit)}</div></div></div>)}</div></div>}
        <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-900 text-white"><th className="px-2 py-1.5 text-left font-semibold rounded-tl-lg">Date</th><th className="px-2 py-1.5 text-center font-semibold"></th><th className="px-2 py-1.5 text-right font-semibold">High</th><th className="px-2 py-1.5 text-right font-semibold">Low</th><th className="px-2 py-1.5 text-right font-semibold">Rain %</th><th className="px-2 py-1.5 text-right font-semibold">Rain mm</th><th className="px-2 py-1.5 text-right font-semibold">Wind</th><th className="px-2 py-1.5 text-right font-semibold">Crane %</th><th className="px-2 py-1.5 text-right font-semibold">Frost %</th><th className="px-2 py-1.5 text-right font-semibold rounded-tr-lg">Cloud</th></tr></thead>
          <tbody>{pr.days.filter(d=>!workingDaysOnly||d.isWorkingDay).map((day,di)=>{const crane=day.windExceedance.find(w=>w.mph===25)?.percent??0;return<tr key={di} className={`${di%2===0?"bg-gray-50":"bg-white"} ${!day.isWorkingDay?"opacity-50":""}`}><td className="px-2 py-1.5 font-semibold text-gray-700">{new Date(day.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</td><td className="px-1 py-1"><WeatherIcon code={day.dominantWeatherCode} size={22}/></td><td className="px-2 py-1.5 text-right font-mono font-semibold">{day.avgHighC.toFixed(1)}°</td><td className={`px-2 py-1.5 text-right font-mono ${day.frostProbability>30?"text-cyan-600 font-bold":""}`}>{day.avgLowC.toFixed(1)}°</td><td className={`px-2 py-1.5 text-right font-mono ${day.rainProbability>60?"text-blue-600 font-bold":""}`}>{day.rainProbability.toFixed(0)}%</td><td className={`px-2 py-1.5 text-right font-mono font-bold ${day.avgRainMm>=10?"text-red-900":day.avgRainMm>=5?"text-red-600":day.avgRainMm>=1.6?"text-amber-600":"text-green-600"}`}>{day.avgRainMm.toFixed(1)}</td><td className="px-2 py-1.5 text-right font-mono">{fmtWind(day.avgWindKmh,windUnit).replace(/ (mph|km\/h)/,"")}</td><td className={`px-2 py-1.5 text-right font-mono ${crane>10?"text-amber-600 font-bold":""}`}>{crane.toFixed(0)}%</td><td className={`px-2 py-1.5 text-right font-mono ${day.frostProbability>30?"text-cyan-600 font-bold":""}`}>{day.frostProbability.toFixed(0)}%</td><td className="px-2 py-1.5 text-right font-mono">{day.avgCloudCover.toFixed(0)}%</td></tr>})}</tbody></table></div>
      </>}
    </div>)}

    {/* HISTORICAL RESULTS */}
    {toolMode==="historical"&&results.map((res,ri)=><div key={ri} className="space-y-4">
      {results.length>1&&<div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:["#EF4444","#3B82F6","#10B981"][ri]}}/><span className="text-sm font-bold text-gray-900">{res.location.name}, {res.location.region}</span></div>}
      {view==="day"&&res.days[0]&&<div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4"><div><div className="text-lg font-bold text-gray-900">{res.location.name}</div><div className="text-xs text-gray-500">{new Date(res.days[0].date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div><WeatherIcon code={res.days[0].weatherCode} size={64}/></div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{res.days[0].tempC!==null?`${res.days[0].tempC.toFixed(1)}°C`:"--"}{res.days[0].avgTempC!==null&&<span className={`ml-2 text-sm font-medium ${(res.days[0].tempC??0)>res.days[0].avgTempC?"text-orange-600":"text-cyan-600"}`}>({((res.days[0].tempC??0)-res.days[0].avgTempC)>=0?"+":""}{((res.days[0].tempC??0)-res.days[0].avgTempC).toFixed(1)}° vs avg)</span>}</div>
        <div className="text-sm text-gray-600 mb-4">{getWMO(res.days[0].weatherCode).description}</div>
        {res.days[0].tempMinC!==null&&<div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg mb-4 ${res.days[0].tempMinC<=0?"bg-cyan-50 text-cyan-700 border border-cyan-200":"bg-gray-50 text-gray-600 border border-gray-200"}`}>Daily low: {res.days[0].tempMinC.toFixed(1)}°C{res.days[0].tempMinC<=0&&<span className="text-cyan-600 font-bold ml-1">Frost</span>}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{icon:"💨",label:"Wind",value:fmtWind(res.days[0].windKmh,windUnit)},{icon:"🌧",label:"Rain",value:res.days[0].precipMm!==null?`${res.days[0].precipMm.toFixed(1)} mm`:"--"},{icon:"💧",label:"Humidity",value:res.days[0].humidity!==null?`${Math.round(res.days[0].humidity)}%`:"--"},{icon:"☁",label:"Cloud",value:res.days[0].cloudCover!==null?`${Math.round(res.days[0].cloudCover)}%`:"--"}].map(item=><div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-lg">{item.icon}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">{item.label}</div><div className="text-sm font-bold text-gray-900">{item.value}</div></div>)}</div></div>}

      {(view==="week"||view==="month")&&res.days.length>0&&<>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">{view==="week"?"7-Day":"Monthly"} Overview — {res.location.name}</div><CombinedChart days={res.days} windUnit={windUnit}/></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-900 text-white"><th className="px-2 py-1.5 text-left font-semibold rounded-tl-lg">Date</th><th className="px-2 py-1.5 text-center font-semibold"></th><th className="px-2 py-1.5 text-left font-semibold">Conditions</th><th className="px-2 py-1.5 text-right font-semibold">High</th><th className="px-2 py-1.5 text-right font-semibold">Low</th><th className="px-2 py-1.5 text-right font-semibold">Wind</th><th className="px-2 py-1.5 text-right font-semibold">Rain</th><th className="px-2 py-1.5 text-right font-semibold">Humid</th><th className="px-2 py-1.5 text-right font-semibold rounded-tr-lg">Cloud</th></tr></thead>
          <tbody>{res.days.map((day,di)=>{const wmo=getWMO(day.weatherCode);const frost=day.tempMinC!==null&&day.tempMinC<=0;return<tr key={di} className={`${di%2===0?"bg-gray-50":"bg-white"} ${frost?"border-l-2 border-l-cyan-400":""}`}><td className="px-2 py-1.5 font-semibold text-gray-700">{new Date(day.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</td><td className="px-1 py-1"><WeatherIcon code={day.weatherCode} size={22}/></td><td className="px-2 py-1.5 text-gray-600">{wmo.description}</td><td className="px-2 py-1.5 text-right font-mono font-semibold">{day.tempC!==null?`${day.tempC.toFixed(1)}°`:"--"}{day.avgTempC!==null&&<span className={`ml-1 text-[10px] ${(day.tempC??0)>day.avgTempC?"text-orange-500":"text-cyan-500"}`}>({((day.tempC??0)-day.avgTempC)>=0?"+":""}{((day.tempC??0)-day.avgTempC).toFixed(1)})</span>}</td><td className={`px-2 py-1.5 text-right font-mono ${frost?"text-cyan-600 font-bold":""}`}>{day.tempMinC!==null?`${day.tempMinC.toFixed(1)}°`:"--"}{frost&&<span className="ml-0.5 text-[9px]">*</span>}</td><td className="px-2 py-1.5 text-right font-mono">{day.windKmh!==null?fmtWind(day.windKmh,windUnit).replace(/ (mph|km\/h)/,""):"--"}</td><td className="px-2 py-1.5 text-right font-mono">{day.precipMm!==null?`${day.precipMm.toFixed(1)}`:"--"}</td><td className="px-2 py-1.5 text-right font-mono">{day.humidity!==null?`${Math.round(day.humidity)}%`:"--"}</td><td className="px-2 py-1.5 text-right font-mono">{day.cloudCover!==null?`${Math.round(day.cloudCover)}%`:"--"}</td></tr>})}</tbody></table>
          {view==="month"&&<div className="mt-2 text-[10px] text-gray-400">* = frost (daily low at or below 0{"°"}C) | Rain days ({">="}{ rainThreshold}mm): {firstRes?.summary.rainDays??0}</div>}</div></>}
    </div>)}

    {/* Info */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Data Source</div><div className="text-xs text-gray-600 space-y-1">
      <p>Weather data from the <strong>Open-Meteo Archive API</strong> (ERA5 reanalysis, 1940-present). Temperature shows daily high (max) and daily low (min) across all 24 hours. Rainfall is the 24-hour total. Wind, humidity, cloud cover, and conditions are <strong>12:00 PM snapshots</strong>.</p>
      {toolMode==="planning"&&<p><strong>Planning mode</strong> averages the same calendar dates across your baseline period to estimate expected conditions. This is not a weather forecast. Wind thresholds: 25mph (crane), 28mph (MEWP, BS EN 280), 45mph (site closure).</p>}
      {toolMode==="historical"&&<p>The baseline comparison averages the same calendar date(s) across your selected averaging period (default 2005-2025).</p>}
    </div></div>
  </div>);
}
