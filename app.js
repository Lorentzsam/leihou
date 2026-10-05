const $ = (s) => document.querySelector(s);
const yuan = (n) => "¥" + n.toLocaleString("zh-CN");

const ITEMS = new Map();
for (const shop of SHOPS) {
  shop.items.forEach((it, i) => {
    it.id = `${shop.id}-${i}`;
    it.shop = shop;
    ITEMS.set(it.id, it);
  });
}

// ---------- 购物袋（存在浏览器本地） ----------
const KEY = "leihou-bag";
let bag = {};
try {
  bag = JSON.parse(localStorage.getItem(KEY)) || {};
} catch {}
for (const id of Object.keys(bag)) {
  const it = ITEMS.get(id);
  if (!it || it.stock < 1) delete bag[id];
  else bag[id] = Math.min(bag[id], it.stock);
}

function saveBag() {
  try {
    localStorage.setItem(KEY, JSON.stringify(bag));
  } catch {}
  const n = Object.values(bag).reduce((a, b) => a + b, 0);
  $("#bagCount").textContent = n;
}

function setQty(id, q) {
  const it = ITEMS.get(id);
  q = Math.max(0, Math.min(q, it.stock));
  if (q) bag[id] = q;
  else delete bag[id];
  saveBag();
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 1600);
}

// ---------- 橱窗街 ----------
let cat = "全部";

function renderChips() {
  const cats = ["全部", ...new Set(SHOPS.map((s) => s.cat))];
  $("#chips").innerHTML = cats
    .map((c) => `<button class="chip" aria-pressed="${c === cat}" data-cat="${c}">${c}</button>`)
    .join("");
}

function goodHTML(it) {
  return `<span class="good${it.stock ? "" : " out"}"><i>${it.e}</i><small>${it.stock ? yuan(it.p) : "已售出"}</small></span>`;
}

function renderStreet() {
  const list = SHOPS.filter((s) => cat === "全部" || s.cat === cat);
  $("#street").innerHTML = list
    .map((s) => {
      const half = Math.ceil(s.items.length / 2);
      const from = Math.min(...s.items.map((it) => it.p));
      return `
      <button class="shop" style="--c:${s.color}" data-shop="${s.id}" aria-label="${s.name}，${s.tag}，点击进店">
        <div class="awning"></div>
        <div class="glass">
          <div class="shelf">${s.items.slice(0, half).map(goodHTML).join("")}</div>
          <div class="shelf">${s.items.slice(half).map(goodHTML).join("")}</div>
        </div>
        <div class="plate">
          <h2>${s.name}</h2><span class="from">${yuan(from)} 起</span>
          <p>${s.tag}</p>
        </div>
      </button>`;
    })
    .join("");
}

// ---------- 单个橱窗 ----------
function rowHTML(it) {
  const inBag = bag[it.id] || 0;
  const full = inBag >= it.stock;
  const hint = !it.stock ? "" : it.stock <= 2 ? `<span class="left">仅剩 ${it.stock} 件</span>` : "";
  return `
  <li class="row${it.stock ? "" : " out"}">
    <span class="pic" aria-hidden="true">${it.e}</span>
    <div><h3>${it.n}</h3><p class="d">${it.d}</p>${hint}</div>
    <div class="buy">
      <span class="price">${yuan(it.p)}</span>
      <button class="btn" data-add="${it.id}" ${!it.stock || full ? "disabled" : ""}>
        ${!it.stock ? "已售出" : full ? "已全部加入" : inBag ? `再来一件（${inBag}）` : "放进购物袋"}
      </button>
    </div>
  </li>`;
}

function openShop(id, push = true) {
  const s = SHOPS.find((x) => x.id === id);
  if (!s) return;
  const dlg = $("#shopDlg");
  dlg.dataset.shop = id;
  dlg.innerHTML = `
    <div class="sheet-head" style="--c:${s.color}">
      <button class="x" data-close aria-label="关闭">✕</button>
      <h2 id="shopTitle">${s.name}</h2>
      <p>${s.tag} · 营业 ${s.hours}</p>
    </div>
    <p class="story">${s.story}</p>
    <ul class="rows">${s.items.map(rowHTML).join("")}</ul>`;
  if (!dlg.open) dlg.showModal();
  if (push) history.replaceState(null, "", "#" + id);
}

// ---------- 购物袋弹层 ----------
function bagEntries() {
  return Object.entries(bag).map(([id, q]) => [ITEMS.get(id), q]);
}

function renderBag() {
  const dlg = $("#bagDlg");
  const rows = bagEntries();
  const total = rows.reduce((a, [it, q]) => a + it.p * q, 0);
  const head = `
    <div class="sheet-head">
      <button class="x" data-close aria-label="关闭">✕</button>
      <h2 id="bagTitle">购物袋</h2>
      <p>${rows.length ? `共 ${rows.reduce((a, [, q]) => a + q, 0)} 件` : "还是空的"}</p>
    </div>`;
  if (!rows.length) {
    dlg.innerHTML = head + `<p class="blank">袋子里还没有东西。<br>去街上逛逛，哪扇窗亮就看哪扇。</p>`;
    return;
  }
  dlg.innerHTML =
    head +
    `<ul class="rows">${rows
      .map(
        ([it, q]) => `
      <li class="row">
        <span class="pic" aria-hidden="true">${it.e}</span>
        <div><h3>${it.n}</h3><p class="d">${it.shop.name} · ${yuan(it.p)}</p></div>
        <div class="buy">
          <span class="price">${yuan(it.p * q)}</span>
          <span class="qty">
            <button data-qty="${it.id}" data-d="-1" aria-label="减少一件">−</button>
            ${q}
            <button data-qty="${it.id}" data-d="1" aria-label="增加一件" ${q >= it.stock ? "disabled" : ""}>＋</button>
          </span>
        </div>
      </li>`
      )
      .join("")}</ul>
    <div class="sum">
      <span class="total">合计 ${yuan(total)}</span>
      <span class="acts">
        <button class="btn ghost" data-clear>清空</button>
        <button class="btn big" data-checkout>去下单</button>
      </span>
    </div>`;
}

function orderText() {
  const rows = bagEntries();
  const total = rows.reduce((a, [it, q]) => a + it.p * q, 0);
  const no = "LH" + Date.now().toString(36).toUpperCase();
  const lines = rows.map(([it, q]) => `${it.shop.name}｜${it.n} × ${q}　${yuan(it.p * q)}`);
  return [`雷猴橱窗 订单 ${no}`, new Date().toLocaleString("zh-CN"), "────────────", ...lines, "────────────", `合计 ${yuan(total)}`].join("\n");
}

function renderOrder() {
  const text = orderText();
  $("#bagDlg").innerHTML = `
    <div class="sheet-head">
      <button class="x" data-close aria-label="关闭">✕</button>
      <h2 id="bagTitle">订单已生成</h2>
      <p>把这张单子发给店主即可</p>
    </div>
    <pre class="order" id="orderText">${text}</pre>
    <p class="note">本站是演示橱窗，暂未接入在线支付，不会产生真实扣款。</p>
    <div class="sum">
      <button class="btn ghost" data-back>返回购物袋</button>
      <button class="btn big" data-copy>复制订单</button>
    </div>`;
}

// ---------- 事件 ----------
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  // 点弹层外的遮罩关闭
  if (!t) {
    if (e.target.matches("dialog")) e.target.close();
    return;
  }
  if (t.dataset.cat) {
    cat = t.dataset.cat;
    renderChips();
    renderStreet();
  } else if (t.dataset.shop) {
    openShop(t.dataset.shop);
  } else if (t.dataset.add) {
    const id = t.dataset.add;
    setQty(id, (bag[id] || 0) + 1);
    openShop($("#shopDlg").dataset.shop, false);
    toast(`已放进购物袋：${ITEMS.get(id).n}`);
    const b = $("#bagBtn");
    b.classList.remove("bump");
    void b.offsetWidth;
    b.classList.add("bump");
  } else if (t.id === "bagBtn") {
    renderBag();
    if ($("#shopDlg").open) $("#shopDlg").close();
    $("#bagDlg").showModal();
  } else if (t.dataset.qty) {
    setQty(t.dataset.qty, (bag[t.dataset.qty] || 0) + Number(t.dataset.d));
    renderBag();
  } else if ("clear" in t.dataset) {
    bag = {};
    saveBag();
    renderBag();
  } else if ("checkout" in t.dataset) {
    renderOrder();
  } else if ("back" in t.dataset) {
    renderBag();
  } else if ("copy" in t.dataset) {
    try {
      await navigator.clipboard.writeText($("#orderText").textContent);
      toast("订单已复制");
    } catch {
      toast("复制失败，请手动选中文字复制");
    }
  } else if ("close" in t.dataset) {
    t.closest("dialog").close();
  }
});

$("#shopDlg").addEventListener("close", () => {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});

window.addEventListener("hashchange", () => openShop(location.hash.slice(1), false));

renderChips();
renderStreet();
saveBag();
if (location.hash) openShop(location.hash.slice(1), false);
