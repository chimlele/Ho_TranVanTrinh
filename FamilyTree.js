const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIq7-JrJBxlOp6e-brAHGaWLE2pzNKeNUkaDoLaF8BaEQH0iD-D5KcwopMONrgc0qfj08KNWKfIvo4/pub?gid=0&single=true&output=csv";

let PEOPLE = {};

// ========= LOAD CSV =========
Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete(results) {
    if (!results.data || results.data.length === 0) {
      showError("CSV không có dữ liệu");
      return;
    }

    results.data.forEach(p => {
      if (!p.ID) return;
      p.PIDS = p.PIDS ? p.PIDS.split(";") : [];
      PEOPLE[p.ID] = p;
    });

    const firstId = Object.keys(PEOPLE)[0];
    if (!firstId) {
      showError("Không tìm thấy ID hợp lệ");
      return;
    }

    renderTree(firstId);
  },
  error(err) {
    showError("Lỗi tải CSV: " + err.message);
    console.error(err);
  }
});

// ========= HELPERS =========
function showError(msg) {
  document.getElementById("tree").innerHTML =
    "<div class='error'>" + msg + "</div>";
}

function getChildrenByFather(fid) {
  return Object.values(PEOPLE).filter(p => p.FID === fid);
}

function getSpouses(person) {
  return person.PIDS
    .map(id => PEOPLE[id])
    .filter(Boolean);
}

// ========= RENDER =========
function renderTree(centerId) {
  const center = PEOPLE[centerId];
  if (!center) return;

  const tree = document.getElementById("tree");
  tree.innerHTML = "";

  const spouses = getSpouses(center);

  const children = getChildrenByFather(centerId);
  const inLaws1 = children.flatMap(c => getSpouses(c));

  const grandchildren = children.flatMap(c => getChildrenByFather(c.ID));
  const greatGrandchildren =
    grandchildren.flatMap(g => getChildrenByFather(g.ID));

  tree.append(
    renderLevel("Trung tâm", [center, ...spouses], true),
    renderLevel("Đời 1 – Con & Dâu/Rể", [...children, ...inLaws1]),
    renderLevel("Đời 2 – Cháu", grandchildren),
    renderLevel("Đời 3 – Chắt", greatGrandchildren)
  );
}

function renderLevel(title, list) {
  const wrap = document.createElement("div");

  const h = document.createElement("h4");
  h.textContent = title;
  wrap.appendChild(h);

  const level = document.createElement("div");
  level.className = "level";

  list.forEach(p => level.appendChild(renderNode(p)));

  wrap.appendChild(level);
  return wrap;
}

function renderNode(p) {
  const g = p["Giới tính"] === "Nam" ? "male" : "female";

  const div = document.createElement("div");
  div.className = "node " + g;

  div.innerHTML = `
    <img src="${p.Photo || "https://via.placeholder.com/64"}">
    <div class="name">${p["Họ Và Tên"] || ""}</div>
    <div class="year">${p["Năm sinh - Mất"] || ""}</div>
  `;

  div.onclick = () => renderTree(p.ID);
  return div;
}
