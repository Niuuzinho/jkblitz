// ============================================================
// EFEITOS DAS CARTAS E DOS OMAMORIS (V4)
//
// Cada efeito de carta é um objeto com funções opcionais, chamadas pelo motor nesta ordem:
//   jogar       na revelação, antes do resultado (efeitos "Jogar")
//   venceEmpate devolve true se a carta faz o lado vencer um empate
//   ganhouEmpate acontece quando o lado venceu um empate
//   vencer / perder / empatar   conforme o resultado
//   sempre      qualquer resultado
// Assinatura: (s, o, c, p, esc, x)
//   s = o lado que jogou a carta, o = o lado do oponente, c = utilidades do motor,
//   p = parâmetros da carta (data/cards.js), esc = decisões do jogador (naipe, cartaUid).
// Devolver false quer dizer "não ativou". Os campos do lado (s) estão em Motor.resolverRodada.
// "Causa N de dano" é dano TOTAL de N: o dano base da vitória (1) já está contado.
// ============================================================

// Bilhete: marca 1 carta aleatória do oponente (normal) ou deixa 1 carta sua à escolha Secreta (Mão aberta)
function bilhete(s, o, c) {
  if (c.aberta()) { s.j.pend.secretaEscolha += 1; c.dizer('Bilhete: no próximo turno, 1 carta de ' + s.j.nome + ' fica Secreta.'); }
  else { o.j.pend.marcarAleatorio += 1; c.dizer('Bilhete: 1 carta da mão de ' + o.j.nome + ' será Marcada no próximo turno.'); }
}
const causa = (s, n, c) => { s.dano += n - c.cfg.danoPadrao; c.dizer(s.carta.nome + ': causa ' + s.dano + ' de dano.'); };
const limitar = (n, min, max) => Math.max(min, Math.min(max, n));
const ordemNaipes = ['pedra', 'papel', 'tesoura'];

const EFEITOS = {
  // Comuns com upgrade: o dano extra vem de params.bonusDano (tratado pelo motor)
  bonus: {},
  causa: { vencer(s, o, c, p) { causa(s, p.dano, c); } },

  // ---------------- Raras ----------------
  pedrada: {
    vencer(s, o, c, p) { causa(s, p.dano, c); },
    empatar(s, o, c) { s.causaDireta += 1; c.dizer('Pedrada: o oponente sofre 1.'); }
  },
  multa: {
    vencer(s, o, c, p) {
      causa(s, p.agora, c);
      o.j.sangrias.push({ restam: p.ticks, dano: 1, nova: true });
      c.dizer('Multa: ' + o.j.nome + ' sofrerá 1 no fim de cada uma das ' + p.ticks + ' próximas rodadas.');
    }
  },
  estilete: {
    vencer(s, o, c, p) { causa(s, s.j.jogadas === 0 ? p.primeira : p.dano, c); }
  },
  seixo: {
    venceEmpate: () => true,
    ganhouEmpate(s, o, c, p) { if (p.cura) { s.cura += p.cura; c.dizer('Seixo: cura ' + p.cura + '.'); } }
  },
  papelao: {
    perder(s, o, c, p) { s.evitar = true; c.dizer('Papelão: ' + s.j.nome + ' não sofre dano.'); if (p.guarda) s.guardarN += p.guarda; }
  },
  bainha: {
    empatar(s, o, c, p) { s.fica = true; if (p.semDano && c.blitzAtiva()) s.semDanoEmpate = true; c.dizer('Bainha: fica na mão.'); }
  },
  cascalho: {
    perder(s, o, c, p) { s.guardarTudo = true; if (p.maisUm) s.j.maisUm = true; c.dizer('Cascalho: guarda as outras cartas da mão.'); }
  },
  rascunho: {
    jogar(s, o, c, p, esc) {
      const n = esc && esc.naipe && ordemNaipes.indexOf(esc.naipe) >= 0 ? esc.naipe : ordemNaipes[Math.floor(c.rng() * 3)];
      for (let i = 0; i < p.n; i++) s.j.pend.compraNaipe.push(n);
      c.dizer('Rascunho: no próximo turno, ' + p.n + ' carta(s) de ' + NAIPES[n].nome + ' (se houver no deck).');
    }
  },
  recorte: {
    vencer(s, o, c, p) {
      s.guardarN += 1;
      if (c.aberta()) { s.guardarSecreta = !p.marca; c.dizer('Recorte: guarda 1 carta da mão' + (p.marca ? '.' : ', que fica Secreta.')); }
      else { s.guardarMarca = !!p.marca; c.dizer('Recorte: guarda 1 carta da mão' + (p.marca ? ', que fica Marcada.' : '.')); }
    }
  },
  cristal: {
    jogar(s, o, c, p) {
      if (c.aberta()) { const n = c.revelarSecretas(o.j, p.n); if (n) c.dizer('Cristal: ' + n + ' carta(s) de ' + o.j.nome + ' foram reveladas.'); return; }
      const n = c.marcarTopo(o.j, p.n); if (n) c.dizer('Cristal: ' + n + ' carta(s) do topo do deck de ' + o.j.nome + ' ficaram Marcadas.');
    }
  },
  bilhete: {
    jogar(s, o, c, p) { if (!p.aoJogar) return false; bilhete(s, o, c); },
    vencer(s, o, c, p) { if (p.aoJogar) return false; bilhete(s, o, c); }
  },
  abridor: {
    vencer(s, o, c, p) { if (!c.aberta() && (!o.carta || !o.carta.vinhaMarcada)) return false; causa(s, p.dano, c); }
  },

  // ---------------- Lendárias ----------------
  monolito: {
    venceEmpate: () => true,
    ganhouEmpate(s, o, c, p) { s.fica = true; if (p.cura) s.cura += p.cura; c.dizer('Monólito: ganhou o empate e fica na mão.'); }
  },
  fossil: {
    vencer(s, o, c, p) {
      const n = s.j.cemiterio.filter(x => x.def.naipe === 'pedra').length;
      causa(s, limitar(n, p.min, p.max), c);
    }
  },
  geodo: {
    vencer(s, o, c, p) { causa(s, limitar(s.carta.turnos, 1, p.max), c); }
  },
  testamento: {
    jogar(s, o, c, p, esc) {
      const lista = s.j.cemiterio.concat(p.cortadas ? s.j.cortadas : []).filter(x => x.efeito && x.efeito !== 'testamento');
      const alvo = esc && esc.cartaUid != null ? lista.find(x => x.uid === esc.cartaUid) : null;
      if (!alvo) return false;
      s.j.testamento = { efeito: alvo.efeito, params: alvo.params, nome: alvo.nome, usado: false };
      c.dizer('Testamento: a próxima carta de ' + s.j.nome + ' ganha o efeito de ' + alvo.nome + '.');
    }
  },
  mapa: {
    jogar(s, o, c) {
      if (c.aberta()) { s.j.pend.secretaTodas = true; c.dizer('Mapa: todas as cartas de ' + s.j.nome + ' ficam Secretas no próximo turno.'); return; }
      o.j.pend.marcarTodas = true; c.dizer('Mapa: a mão de ' + o.j.nome + ' será toda Marcada no próximo turno.');
    }
  },
  nota: {
    vencer(s, o, c, p) {
      if ((s.j.notaGanhas || 0) >= p.max) return false;
      s.j.notaGanhas = (s.j.notaGanhas || 0) + 1; s.j.moedas++;
      c.dizer('Nota de cem: +1 moeda (' + s.j.notaGanhas + ' de ' + p.max + ').');
    }
  },
  bisturi: {
    vencer(s, o, c, p) {
      if (!c.aberta() && (!o.carta || !o.carta.vinhaMarcada)) return false;
      causa(s, p.dano, c); s.cortaOp = true;
    }
  },
  cutelo: {
    vencer(s, o, c) { if (!c.blitzAtiva()) return false; s.dobro = true; },
    empatar(s, o, c, p) { if (p.semDano && c.blitzAtiva()) s.semDanoEmpate = true; else return false; }
  },

  // ---------------- Prismáticas ----------------
  meteoro: {
    sempre(s, o, c, p) {
      s.causaDireta += p.dano; s.danoPropio += p.auto;
      c.dizer('Meteoro: ' + o.j.nome + ' sofre ' + p.dano + (p.auto ? ' e ' + s.j.nome + ' sofre ' + p.auto : '') + '.');
    }
  },
  origami: {
    jogar(s, o, c) {
      const u = s.j.ultimaCarta;
      if (!u || !u.efeito || !EFEITOS[u.efeito] || u.efeito === 'origami') return false;
      const x = { ef: EFEITOS[u.efeito], p: u.params, fonte: s.carta, extra: true, copia: true };
      s.efs.push(x);
      c.dizer('Origami: copia o efeito de ' + u.nome + '.');
      if (x.ef.jogar) x.ef.jogar(s, o, c, x.p, s.escolhas, x);
    }
  },
  excalisoura: {
    vencer(s, o, c, p) {
      causa(s, p.inicio + s.carta.vitorias, c);
      s.carta.vitorias++; s.fica = true;
    },
    perder(s) { s.carta.vitorias = 0; s.cortarSelf = true; },
    empatar(s) { s.carta.vitorias = 0; s.cortarSelf = true; }
  },

  // ---------------- Especiais ----------------
  dinamite: { vencer(s, o, c, p) { causa(s, p.dano, c); } },
  curinga: {},

  // ---------------- Troféus ----------------
  pedraangular: {
    venceEmpate: () => true,
    vencer(s, o, c, p) { if (!c.blitzAtiva()) return false; causa(s, p.dano, c); }
  },
  fichario: {
    jogar(s, o, c) { s.guardarTudo = true; c.dizer('Fichário: guarda as outras cartas da mão.'); },
    vencer(s, o, c, p) { causa(s, p.dano, c); }
  },
  ponteiro: {
    vencer(s, o, c, p) { if (!c.blitzAtiva()) return false; causa(s, p.dano, c); }
  },
  florete: {
    vencer(s, o, c, p) {
      causa(s, p.dano, c);
      if (s.carta.usos < p.max) { s.carta.usos++; s.fica = true; }
    }
  }
};

// ============================================================
// OMAMORIS: gatilhos
//   inicioCombate, inicioRodada, aposMao, inicioBlitz, fimCombate: (estado, j, op, c)
//   vitoria, derrota, empate, vitoriaFinal: (s, o, c)   (vitoriaFinal vê o dano já completo)
//   venceEmpate: (estado, j) => bool
// Os omamoris de loja e de run (Cofre, Cupom, Seguro) ficam em js/run.js.
// ============================================================
const OMAMORIS_EFEITOS = {
  rochamae: { vitoria(s, o, c) { if (s.naipe === 'pedra' && !s.j.usos.rochamae) { s.j.usos.rochamae = true; s.cura += 1; c.dizer('Rocha-Mãe: cura 1.'); } } },
  grampeador: { vitoria(s, o, c) { if (s.naipe === 'papel' && !s.j.usos.grampeador) { s.j.usos.grampeador = true; s.j.maisUm = true; c.dizer('Grampeador: Mão +1 no próximo turno.'); } } },
  amolar: { vitoria(s, o, c) { if (s.naipe === 'tesoura' && !s.j.usos.amolar) { s.j.usos.amolar = true; s.dano += 1; c.dizer('Pedra de Amolar: +1 de dano.'); } } },
  lente: {
    inicioCombate(estado, j, op) { if (estado.modo !== 'aberta') op.pend.marcarAleatorio += 1; },
    aposMao(estado, j) { if (estado.modo === 'aberta' && estado.rodada === 1) Motor.secretar(estado, j, 1); }   // Mão aberta: 1 carta sua fica Secreta
  },
  veu: { aposMao(estado, j) { if (estado.modo === 'aberta') Motor.secretar(estado, j, 1); } },   // sem Marcada no modo normal (ver Motor.imuneMarca)
  relogiobolso: { venceEmpate(estado) { return Motor.blitzAtiva(estado); } },
  navalha: { vitoriaFinal(s, o, c) { if (s.dano >= 3) { s.cura += 1; c.dizer('Fio de Navalha: cura 1.'); } } },
  alicerce: { derrota(s, o, c) { if (!s.j.usos.alicerce && o.dano > 0) { s.j.usos.alicerce = true; s.evitar = true; c.dizer('Alicerce: a derrota não causa dano.'); } } },
  lupa: { vitoria(s, o, c) { if (c.aberta() ? s.carta.vinhaSecreta : (o.carta && o.carta.vinhaMarcada)) { s.cura += 1; c.dizer('Lupa: cura 1.'); } } },
  estopim: { inicioBlitz(estado, j) { j.vida = Math.min(j.vidaMax, j.vida + 1); estado.log.push('Estopim: ' + j.nome + ' cura 1.'); } },
  fusivel: { inicioBlitz(estado, j, op) { op.vida -= 1; estado.log.push('Fusível: ' + op.nome + ' sofre 1.'); Motor.checarFim(estado); } },
  coroa: { venceEmpate(estado) { return estado.rodada === 1; } },
  luva: { vitoria(s, o, c) { if (!s.j.usos.luva) { s.j.usos.luva = true; s.dano += 1; c.dizer('Luva de Duelo: +1 de dano.'); } } }
};
