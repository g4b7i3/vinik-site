// Roda sozinha a cada 5 minutos e manda as notificações do Microciclo:
// começo de cada bloco da semana, lembrete para registrar o dia, resumo da semana (domingo, 20h) e média do mês (dia 1, 8h).
// Lê o painel guardado pela sincronização (loja "estudio", chave "microciclo"); não altera nada nele.
import { loja, assinaturas, enviarTodos } from "../lib/estudio-push.mjs";

const PADRAO = { blocos: true, lembrete: "21:30", semana: true, mes: true };
// mesmas metas do painel Dia típico (estudo/microciclo/index.html)
const ITENS = [
  { k: "sono", nome: "Sono", min: 480 },
  { k: "escrita", nome: "Escrita", min: 90 },
  { k: "leitura", nome: "Leitura", min: 60 },
  { k: "estudo", nome: "Estudo", min: 60 },
  { k: "trabalho", nome: "Trabalho", min: 300 },
  { k: "treino", nome: "Meu treino" },
  { k: "lazer", nome: "Filmes e séries", min: 120 },
];
const pad = (n) => String(n).padStart(2, "0");
const fmt = (m) => (m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? pad(m % 60) : ""));
const minutos = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + m; };

// São Paulo está em UTC-3 o ano todo (sem horário de verão desde 2019)
const FUSO = -3;
function agoraSP(ms) {
  const d = new Date(ms + FUSO * 3600e3);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), dia: (d.getUTCDay() + 6) % 7 };
}
const momento = (sp, hhmm) => Date.UTC(sp.y, sp.mo - 1, sp.d, 0, minutos(hhmm)) - FUSO * 3600e3;
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function metaDe(S, it, dIso) {
  if (it.k !== "treino") return it.min;
  const wd = (new Date(dIso + "T12:00Z").getUTCDay() + 6) % 7;
  return (S.blocos || []).filter((b) => b.dia === wd && b.area === "proprio").reduce((t, b) => t + Math.max(0, minutos(b.fim) - minutos(b.ini)), 0) || 60;
}
function medias(S, dias) {
  return ITENS.map((it) => {
    const tot = dias.reduce((t, x) => t + ((S.diario || {})[x]?.[it.k] || 0), 0);
    const meta = dias.reduce((t, x) => t + metaDe(S, it, x), 0);
    return { nome: it.nome, media: Math.round(tot / dias.length), pct: meta ? Math.round((tot / meta) * 100) : 0 };
  });
}
const linhaMedias = (ms) => ms.map((m) => `${m.nome} ${m.media ? fmt(m.media) : "0"} (${m.pct}%)`).join(" · ");

export default async () => {
  if (!(await assinaturas()).length) return;
  const l = loja();
  const agora = Date.now();
  const ult = (await l.get("push-ultimo", { type: "json" }))?.t || 0;
  const desde = Math.max(ult, agora - 15 * 60e3);
  await l.setJSON("push-ultimo", { t: agora });

  const dado = await l.get("microciclo", { type: "json" });
  const S = dado && dado.estado;
  if (!S) return;
  const n = { ...PADRAO, ...(S.notif || {}) };
  const sp = agoraSP(agora);
  const hoje = iso(sp.y, sp.mo, sp.d);
  const naJanela = (hhmm) => { const t = momento(sp, hhmm); return t > desde && t <= agora; };
  const avisos = [];

  if (n.blocos) {
    const areas = S.areas || {};
    (S.blocos || []).filter((b) => b.dia === sp.dia && naJanela(b.ini)).sort((a, b) => minutos(a.ini) - minutos(b.ini)).forEach((b) => {
      avisos.push({ titulo: `${b.ini} · ${b.txt}`, corpo: `${areas[b.area]?.nome || ""}${areas[b.area] ? ", " : ""}até ${b.fim}`, tag: "bloco-" + b.id, url: "/estudo/microciclo/" });
    });
  }
  if (n.lembrete && /^\d{2}:\d{2}$/.test(n.lembrete) && naJanela(n.lembrete)) {
    const r = (S.diario || {})[hoje] || {};
    const feitos = ITENS.filter((it) => r[it.k]).map((it) => `${it.nome} ${fmt(r[it.k])}`);
    const faltam = ITENS.filter((it) => !r[it.k]).map((it) => it.nome.toLowerCase());
    avisos.push({
      titulo: "Registre o dia",
      corpo: (feitos.length ? "Hoje: " + feitos.join(" · ") + ". " : "Nada registrado hoje ainda. ") + (faltam.length ? "Sem registro: " + faltam.join(", ") + "." : "Tudo registrado."),
      tag: "lembrete", url: "/estudo/microciclo/",
    });
  }
  if (n.semana && sp.dia === 6 && naJanela("20:00")) {
    const dias = [...Array(7)].map((_, i) => { const d = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d - 6 + i)); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); });
    avisos.push({ titulo: "Sua semana, média por dia", corpo: linhaMedias(medias(S, dias)), tag: "semana", url: "/estudo/microciclo/#historico" });
  }
  if (n.mes && sp.d === 1 && naJanela("08:00")) {
    const ant = new Date(Date.UTC(sp.y, sp.mo - 2, 1));
    const y = ant.getUTCFullYear(), m = ant.getUTCMonth() + 1, nd = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const dias = [...Array(nd)].map((_, i) => iso(y, m, i + 1));
    const nome = ant.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
    avisos.push({ titulo: `Fechamento de ${nome}, média por dia`, corpo: linhaMedias(medias(S, dias)), tag: "mes", url: `/estudo/microciclo/#mes-${y}-${pad(m)}` });
  }
  for (const a of avisos) await enviarTodos(a);
};

export const config = { schedule: "*/5 * * * *" };
