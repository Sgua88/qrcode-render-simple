const tableBody = document.getElementById("tableBody");
const search = document.getElementById("search");
const count = document.getElementById("count");
const pageInfo = document.getElementById("pageInfo");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const syncBtn = document.getElementById("syncBtn");
const syncText = document.getElementById("syncText");
const timer = document.getElementById("timer");

let page = 1;
let totalPages = 1;

let timerInterval = null;
let seconds = 0;

async function loadData(){

const res = await fetch(
`/api/results?page=${page}&search=${encodeURIComponent(search.value)}`
);

const data = await res.json();

totalPages = data.totalPages;

count.innerText =
data.total + " record";

pageInfo.innerText =
`Pagina ${data.page} / ${data.totalPages}`;

tableBody.innerHTML = data.rows.map(r => `

<tr>

<td>${r.matricola || ""}</td>
<td>${r.stato || ""}</td>
<td>${r.ultima_vp || ""}</td>
<td>${r.risultato_vp || ""}</td>
<td>${r.partita_iva_vp || ""}</td>
<td>${r.ultima_trasmissione || ""}</td>
<td>${r.versione_fw || ""}</td>
<td>${r.partita_iva || ""}</td>
<td>${r.last_checked || ""}</td>

<td>
<a
class="link-btn"
href="${r.url || '#'}"
target="_blank">
Apri
</a>
</td>

</tr>

`).join("");

}

search.addEventListener("input", ()=>{
page = 1;
loadData();
});

prevBtn.addEventListener("click", ()=>{

if(page > 1){
page--;
loadData();
}

});

nextBtn.addEventListener("click", ()=>{

if(page < totalPages){
page++;
loadData();
}

});

syncBtn.addEventListener("click", async ()=>{

seconds = 0;

syncText.innerText =
"Aggiornamento controlli in corso...";

clearInterval(timerInterval);

timerInterval = setInterval(()=>{

seconds++;

timer.innerText =
seconds + "s";

},1000);

await fetch("/api/manual-sync", {
method:"POST"
});

checkSync();

});

async function checkSync(){

const res = await fetch("/api/sync-status");
const data = await res.json();

if(data.running){

syncText.innerText =
`Aggiornati ${data.updated} record`;

setTimeout(checkSync,1000);

} else {

clearInterval(timerInterval);

syncText.innerText =
`Ultimo aggiornamento: ${data.lastRun || 'completato'}`;

loadData();

}

}

loadData();