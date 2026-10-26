import { html, icone, contar, tempo, semMovimento } from '../ui.js';
import { aguardandoCodigo, semCodigo, codigoPronto, temPendencia, finalizado, faltaAtacado, ativo } from '../regras.js';
import { selo, codigoCopiavel } from '../componentes.js';

const DIA = 864e5;
const semanaDe = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };

function dados(itens) {
  const agora = Date.now();
  const recentes = itens.filter((i) => i.respondidoEm && agora - new Date(i.respondidoEm) < 90 * DIA && i.criadoEm > '1971');
  const dias = recentes.map((i) => (new Date(i.respondidoEm) - new Date(i.criadoEm)) / DIA).filter((d) => d >= 0);
  const media = dias.length ? dias.reduce((a, b) => a + b, 0) / dias.length : null;

  const semanas = [];
  for (let k = 7; k >= 0; k--) semanas.push(semanaDe(agora - k * 7 * DIA));
  const contaSemana = (campo) => semanas.map((s) => itens.filter((i) => i[campo] && semanaDe(i[campo]) === s).length);

  const marcas = new Map();
  for (const i of itens.filter(ativo)) {
    const m = marcas.get(i.marca) || { pend: 0, wait: 0 };
    if (temPendencia(i)) m.pend++; else if (aguardandoCodigo(i)) m.wait++;
    marcas.set(i.marca, m);
  }
  const topo = [...marcas].filter(([, m]) => m.pend + m.wait).sort((a, b) => b[1].pend + b[1].wait - (a[1].pend + a[1].wait)).slice(0, 8);

  return {
    kpis: [
      { rot: 'Códigos para processar', n: itens.filter(codigoPronto).length, rota: 'recebidos', ic: 'sino', destaque: true, sub: 'prontos para finalizar' },
      { rot: 'Aguardando código', n: itens.filter(semCodigo).length, rota: 'aguardando', ic: 'relogio', sub: 'enviados à loja' },
      { rot: 'Pendências de fotos', n: itens.filter(temPendencia).length, rota: 'pendencias', ic: 'alerta', sub: 'precisam de atenção' },
      { rot: 'Finalizados em 30 dias', n: itens.filter((i) => finalizado(i) && agora - new Date(i.feitoEm) < 30 * DIA).length, rota: 'finalizados', ic: 'feito', sub: `${itens.filter(faltaAtacado).length} faltando atacado` },
      { rot: 'Tempo até o código', n: media === null ? null : media, rota: 'aguardando', ic: 'relogio', sub: 'média em dias (90 dias)', dec: true },
    ],
    semanas: semanas.map((s) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
    recebidos: contaSemana('respondidoEm'),
    feitos: contaSemana('feitoEm'),
    topo,
    atividade: [...itens].filter((i) => i.atualizado).sort((a, b) => (b.atualizado > a.atualizado ? 1 : -1)).slice(0, 8),
  };
}

let graficos = [];

export default {
  render(ctx) {
    const d = dados(ctx.itens);
    return html`
      <div class="kpis cascata">${d.kpis.map((k, i) => html`
        <a class="painel kpi ${k.destaque && k.n ? 'destaque' : ''}" href="#/${k.rota}" style="--i:${i}">
          <span>${icone(k.ic)}${k.rot}</span>
          <b data-n="${k.n ?? ''}" data-dec="${k.dec ? 1 : ''}">${k.n === null ? '—' : k.dec ? k.n.toFixed(1).replace('.', ',') : k.n}</b>
          <small>${k.sub}</small>
        </a>`)}</div>
      <div class="graficos cascata">
        <section class="painel" style="--i:5"><div class="painel-cab"><h2>Ritmo semanal</h2><span class="espaco"></span><span class="muted" style="font-size:12px">últimas 8 semanas</span></div>
          <div class="painel-corpo"><div class="grafico"><canvas id="g-semanas" role="img" aria-label="Códigos recebidos e itens finalizados por semana"></canvas></div></div></section>
        <section class="painel" style="--i:6"><div class="painel-cab"><h2>Em aberto por marca</h2></div>
          <div class="painel-corpo"><div class="grafico">${d.topo.length
            ? html`<canvas id="g-marcas" role="img" aria-label="Pendências e itens aguardando código por marca"></canvas>`
            : html`<div class="vazio">${icone('feito')}<h3>Tudo em dia</h3><p>Nenhuma marca com itens em aberto.</p></div>`}</div></div></section>
      </div>
      <section class="painel cascata" style="margin-top:16px"><div class="painel-cab" style="--i:7"><h2>Atividade recente</h2></div>
        <ul class="lista atividade">${d.atividade.map((i) => html`
          <li data-abrir="${i.id}" data-id="${i.id}" class="clicavel" tabindex="0" style="cursor:pointer">
            <b class="mono">${i.marca} · ${i.ref}</b>${selo(i)}
            ${codigoCopiavel(i.codigo)}
            <time datetime="${i.atualizado}">${tempo(i.atualizado)}</time></li>`)}</ul></section>`;
  },

  montar(el, ctx) {
    el.querySelectorAll('[data-n]').forEach((b) => {
      if (b.dataset.n === '' || b.dataset.dec) return;
      contar(b, Number(b.dataset.n));
    });
    graficos.forEach((g) => g.destroy());
    graficos = [];
    if (!window.Chart) return;
    const d = dados(ctx.itens);
    const css = getComputedStyle(document.documentElement);
    const cor = (v) => css.getPropertyValue(v).trim();
    Chart.defaults.font.family = cor('--sans') || 'system-ui';
    Chart.defaults.color = cor('--muted');
    Chart.defaults.borderColor = cor('--line');
    const comum = {
      responsive: true, maintainAspectRatio: false,
      animation: semMovimento() ? false : { duration: 700, easing: 'easeOutQuart' },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } }, tooltip: { backgroundColor: cor('--ink'), titleColor: cor('--bg'), bodyColor: cor('--bg'), padding: 10, cornerRadius: 6 } },
    };
    const s = el.querySelector('#g-semanas');
    if (s) graficos.push(new Chart(s, {
      type: 'bar',
      data: { labels: d.semanas, datasets: [
        { label: 'Códigos recebidos', data: d.recebidos, backgroundColor: cor('--recv'), borderRadius: 4, maxBarThickness: 22 },
        { label: 'Finalizados', data: d.feitos, backgroundColor: cor('--done'), borderRadius: 4, maxBarThickness: 22 },
      ] },
      options: { ...comum, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } },
    }));
    const m = el.querySelector('#g-marcas');
    if (m) graficos.push(new Chart(m, {
      type: 'bar',
      data: { labels: d.topo.map(([n]) => n), datasets: [
        { label: 'Pendências', data: d.topo.map(([, v]) => v.pend), backgroundColor: cor('--pend'), borderRadius: 4, maxBarThickness: 18 },
        { label: 'Aguardando código', data: d.topo.map(([, v]) => v.wait), backgroundColor: cor('--wait'), borderRadius: 4, maxBarThickness: 18 },
      ] },
      options: { ...comum, indexAxis: 'y', scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true, grid: { display: false } } } },
    }));
  },
};
