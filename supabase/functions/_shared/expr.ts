// Petit évaluateur d'expressions SÛR (pas d'eval) pour les formules de catalogue.
// Valeurs : number | null | boolean. Fonctions : sum, abs, min, max, present, coalesce.
// Opérateurs : + - * /  ==  != < <= > >=  && ||  !  ternaire ?: ; littéral null.
// Sémantique : arithmétique propage null ; division par 0 → null ; comparaison avec null → false.

type Val = number | null | boolean;
type Node = any;

function tokenize(s: string): { t: string; v?: string }[] {
  const toks: { t: string; v?: string }[] = [];
  const two = ['||', '&&', '==', '!=', '<=', '>='];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; toks.push({ t: 'num', v: s.slice(i, j) }); i = j; continue; }
    if (/[a-zA-Z_]/.test(c)) { let j = i; while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++; toks.push({ t: 'id', v: s.slice(i, j) }); i = j; continue; }
    const pair = s.slice(i, i + 2);
    if (two.includes(pair)) { toks.push({ t: pair }); i += 2; continue; }
    if ('+-*/()!<>?:,'.includes(c)) { toks.push({ t: c }); i++; continue; }
    throw new Error('caractère inattendu: ' + c);
  }
  toks.push({ t: 'eof' });
  return toks;
}

class Parser {
  toks: { t: string; v?: string }[]; i = 0;
  constructor(toks: { t: string; v?: string }[]) { this.toks = toks; }
  peek() { return this.toks[this.i]; }
  next() { return this.toks[this.i++]; }
  expect(t: string) { if (this.peek().t !== t) throw new Error('attendu ' + t); return this.next(); }
  parse(): Node { const e = this.ternary(); if (this.peek().t !== 'eof') throw new Error('tokens en trop'); return e; }
  ternary(): Node { const c = this.or(); if (this.peek().t === '?') { this.next(); const a = this.ternary(); this.expect(':'); const b = this.ternary(); return { k: 'cond', c, a, b }; } return c; }
  or(): Node { let l = this.and(); while (this.peek().t === '||') { this.next(); l = { k: 'bin', op: '||', l, r: this.and() }; } return l; }
  and(): Node { let l = this.cmp(); while (this.peek().t === '&&') { this.next(); l = { k: 'bin', op: '&&', l, r: this.cmp() }; } return l; }
  cmp(): Node { let l = this.add(); while (['==', '!=', '<', '<=', '>', '>='].includes(this.peek().t)) { const op = this.next().t; l = { k: 'bin', op, l, r: this.add() }; } return l; }
  add(): Node { let l = this.mul(); while (['+', '-'].includes(this.peek().t)) { const op = this.next().t; l = { k: 'bin', op, l, r: this.mul() }; } return l; }
  mul(): Node { let l = this.unary(); while (['*', '/'].includes(this.peek().t)) { const op = this.next().t; l = { k: 'bin', op, l, r: this.unary() }; } return l; }
  unary(): Node { if (this.peek().t === '-') { this.next(); return { k: 'neg', e: this.unary() }; } if (this.peek().t === '!') { this.next(); return { k: 'not', e: this.unary() }; } return this.atom(); }
  atom(): Node {
    const tk = this.peek();
    if (tk.t === 'num') { this.next(); return { k: 'num', v: parseFloat(tk.v!) }; }
    if (tk.t === '(') { this.next(); const e = this.ternary(); this.expect(')'); return e; }
    if (tk.t === 'id') {
      this.next();
      if (tk.v === 'null') return { k: 'nul' };
      if (this.peek().t === '(') {
        this.next(); const args: Node[] = [];
        if (this.peek().t !== ')') { args.push(this.ternary()); while (this.peek().t === ',') { this.next(); args.push(this.ternary()); } }
        this.expect(')'); return { k: 'call', name: tk.v, args };
      }
      return { k: 'var', name: tk.v };
    }
    throw new Error('token inattendu: ' + tk.t);
  }
}

export function parseExpr(s: string): Node { return new Parser(tokenize(s)).parse(); }

const asNum = (x: Val): number | null => (typeof x === 'number' && isFinite(x) ? x : null);
const truthy = (x: Val): boolean => x === true || (typeof x === 'number' && x !== 0);

function callFn(name: string | undefined, args: Val[]): Val {
  switch (name) {
    case 'present': return args[0] !== null && args[0] !== undefined && !(typeof args[0] === 'number' && !isFinite(args[0] as number));
    case 'coalesce': for (const a of args) if (a !== null && a !== undefined && !(typeof a === 'number' && !isFinite(a))) return a; return null;
    case 'sum': { const ns = args.filter((a) => typeof a === 'number' && isFinite(a)) as number[]; return ns.length ? ns.reduce((x, y) => x + y, 0) : null; }
    case 'abs': { const x = asNum(args[0]); return x == null ? null : Math.abs(x); }
    case 'min': { const ns = args.filter((a) => typeof a === 'number') as number[]; return ns.length ? Math.min(...ns) : null; }
    case 'max': { const ns = args.filter((a) => typeof a === 'number') as number[]; return ns.length ? Math.max(...ns) : null; }
    default: throw new Error('fonction inconnue: ' + name);
  }
}

export function evalExpr(node: Node, vars: Record<string, number>): Val {
  const ev = (n: Node): Val => {
    switch (n.k) {
      case 'num': return n.v;
      case 'nul': return null;
      case 'var': { const v = vars[n.name]; return typeof v === 'number' && isFinite(v) ? v : null; }
      case 'neg': { const e = asNum(ev(n.e)); return e == null ? null : -e; }
      case 'not': return !truthy(ev(n.e));
      case 'cond': return truthy(ev(n.c)) ? ev(n.a) : ev(n.b);
      case 'call': return callFn(n.name, n.args.map(ev));
      case 'bin': {
        const op = n.op;
        if (op === '||') return truthy(ev(n.l)) || truthy(ev(n.r));
        if (op === '&&') return truthy(ev(n.l)) && truthy(ev(n.r));
        const a = ev(n.l), b = ev(n.r), an = asNum(a), bn = asNum(b);
        if (['==', '!=', '<', '<=', '>', '>='].includes(op)) {
          if (an == null || bn == null) return false;
          switch (op) { case '==': return an === bn; case '!=': return an !== bn; case '<': return an < bn; case '<=': return an <= bn; case '>': return an > bn; case '>=': return an >= bn; }
        }
        if (an == null || bn == null) return null;
        switch (op) { case '+': return an + bn; case '-': return an - bn; case '*': return an * bn; case '/': return bn === 0 ? null : an / bn; }
        return null;
      }
    }
    return null;
  };
  return ev(node);
}
