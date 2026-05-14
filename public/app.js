const tableBody = document.getElementById("tableBody");
const search = document.getElementById("search");
const count = document.getElementById("count");

async function loadData(query=""){

const res = await fetch(
"/api/results?search=" +
encodeURIComponent(query)
);

const data = await res.json();

count.innerText =
data.length + " record";

tableBody.innerHTML = data.map(r => `

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
<a class="link-btn"
href="${r.url || '#'}"
target="_blank">
Apri
</a>
</td>

</tr>

`).join("");

}

search.addEventListener("input", () => {
loadData(search.value);
});

loadData();