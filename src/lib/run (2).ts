import type { CourseId } from "@/lib/curriculum";

export type RunResult = {
  output: string;
  error: string | null;
  html: string | null;
};

type Val = string | number;
type Row = Record<string, Val>;

const TABLES: Record<string, Row[]> = {
  alunos: [
    { id: 1, nome: "Ana", xp: 40, curso_id: 1 },
    { id: 2, nome: "Bruno", xp: 10, curso_id: 1 },
    { id: 3, nome: "Clara", xp: 25, curso_id: 2 },
  ],
  cursos: [
    { id: 1, titulo: "Web" },
    { id: 2, titulo: "Dados" },
  ],
};

export function runSql(code: string): RunResult {
  const text = code
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;+\s*$/, "")
    .split(";")[0]
    .trim();
  if (!text) return { output: "", error: "Escreve um SELECT.", html: null };
  if (!/^select\b/i.test(text)) {
    return { output: "", error: "Nesta consola só podes correr SELECT.", html: null };
  }
  const from = text.match(/\bfrom\s+([a-z_][a-z0-9_]*)/i);
  if (!from) return { output: "", error: "Falta o FROM.", html: null };
  const table = from[1].toLowerCase();
  if (!TABLES[table]) return { output: "", error: "Tabela desconhecida. Usa alunos ou cursos.", html: null };

  let rows = TABLES[table].map((row) => label(row, table));
  const join = text.match(/\bjoin\s+([a-z_][a-z0-9_]*)\s+on\s+([a-z0-9_.]+)\s*=\s*([a-z0-9_.]+)/i);
  if (join) {
    const other = join[1].toLowerCase();
    if (!TABLES[other]) return { output: "", error: "A segunda tabela não existe.", html: null };
    const next: Row[] = [];
    for (const row of rows) {
      for (const extra of TABLES[other]) {
        const right = label(extra, other);
        const leftValue = field(row, join[2]);
        const rightValue = field(right, join[3]);
        if (leftValue !== undefined && String(leftValue) === String(rightValue)) {
          next.push({ ...row, ...right });
        }
      }
    }
    rows = next;
  }

  const where = text.match(/\bwhere\s+(.+?)(?:\border\s+by\b|$)/i);
  if (where) {
    const check = parseWhere(where[1]);
    if (!check) return { output: "", error: "Não percebi o WHERE. Usa uma comparação só.", html: null };
    rows = rows.filter((row) => check(row));
  }

  const order = text.match(/\border\s+by\s+([a-z0-9_.]+)(?:\s+(asc|desc))?/i);
  if (order) {
    const dir = (order[2] || "asc").toLowerCase() === "desc" ? -1 : 1;
    rows = rows.slice().sort((a, b) => compare(field(a, order[1]), field(b, order[1])) * dir);
  }

  const select = text.match(/^select\s+(.+?)\s+from\b/i);
  if (!select) return { output: "", error: "Não percebi o SELECT.", html: null };
  const spec = select[1].trim();
  if (/^count\s*\(\s*(?:\*|1)\s*\)$/i.test(spec)) {
    return { output: String(rows.length), error: null, html: null };
  }
  const cols =
    spec === "*"
      ? Object.keys(rows[0] ?? {}).filter((key) => !key.includes("."))
      : spec.split(",").map((part) => part.trim());
  const lines = rows.map((row) => cols.map((col) => String(field(row, col) ?? "")).join(" | "));
  return { output: lines.join("\n"), error: null, html: null };
}

function label(row: Row, table: string): Row {
  const next: Row = {};
  for (const [key, value] of Object.entries(row)) {
    next[key] = value;
    next[`${table}.${key}`] = value;
  }
  return next;
}

function field(row: Row, ref: string): Val | undefined {
  if (ref in row) return row[ref];
  const short = ref.split(".").pop() ?? ref;
  return row[short];
}

function parseWhere(expr: string): ((row: Row) => boolean) | null {
  const match = expr.trim().match(/^([a-z0-9_.]+)\s*(=|<>|!=|>=|<=|>|<)\s*(.+)$/i);
  if (!match) return null;
  const [, column, op, rawValue] = match;
  const value = literal(rawValue.trim());
  return (row) => compareOp(field(row, column), op, value);
}

function literal(raw: string): Val {
  const clean = raw.replace(/;+\s*$/, "");
  if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
    return clean.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean);
  return clean;
}

function compare(left: Val | undefined, right: Val | undefined) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function compareOp(left: Val | undefined, op: string, right: Val) {
  if (op === "=") return String(left) === String(right);
  if (op === "!=" || op === "<>") return String(left) !== String(right);
  const delta = compare(left, right);
  if (op === ">") return delta > 0;
  if (op === "<") return delta < 0;
  if (op === ">=") return delta >= 0;
  if (op === "<=") return delta <= 0;
  return false;
}

function protect(input: string, visit: (plain: string) => string) {
  const parts: string[] = [];
  let plain = "";
  let index = 0;
  while (index < input.length) {
    const mark = input[index];
    if (mark === '"' || mark === "'") {
      let end = index + 1;
      while (end < input.length && input[end] !== mark) {
        end += input[end] === "\\" ? 2 : 1;
      }
      parts.push(input.slice(index, Math.min(end + 1, input.length)));
      plain += `\u0000${parts.length - 1}\u0000`;
      index = end + 1;
      continue;
    }
    plain += mark;
    index += 1;
  }
  const rewritten = visit(plain);
  return rewritten.replace(/\u0000(\d+)\u0000/g, (_, id: string) => parts[Number(id)] ?? "");
}

function rewritePythonWords(input: string) {
  return protect(input, (plain) =>
    plain
      .replace(/\brange\s*\(\s*([^)]+?)\s*\)/g, "[...Array($1).keys()]")
      .replace(/\blen\s*\(\s*([^)]+?)\s*\)/g, "($1).length")
      .replace(/\bprint\s*\(/g, "console.log(")
      .replace(/\b(and|or|not|True|False|None)\b/g, (word) => {
        if (word === "and") return "&&";
        if (word === "or") return "||";
        if (word === "not") return "!";
        if (word === "True") return "true";
        if (word === "False") return "false";
        return "null";
      }),
  );
}

export function transpilePython(source: string) {
  const declared = new Set<string>();
  const items = source
    .replace(/\t/g, "    ")
    .split("\n")
    .map((line) => {
      const comment = line.split("#")[0] ?? "";
      if (!comment.trim()) return null;
      return { indent: comment.match(/^ */)?.[0].length ?? 0, text: comment.trim() };
    })
    .filter((item): item is { indent: number; text: string } => Boolean(item));

  const out: string[] = [];
  const stack: number[] = [];
  for (const item of items) {
    const opens = /:\s*$/.test(item.text);
    while (stack.length > 0 && item.indent <= stack[stack.length - 1]) {
      stack.pop();
      out.push("}");
    }
    out.push(rewritePythonStatement(item.text, declared));
    if (opens) stack.push(item.indent);
  }
  while (stack.length > 0) {
    stack.pop();
    out.push("}");
  }
  return out.join("\n");
}

function rewritePythonStatement(text: string, declared: Set<string>) {
  const body = rewritePythonWords(text.replace(/:\s*$/, ""));
  const def = body.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/);
  if (def) return `function ${def[1]}(${def[2]}) {`;
  const elif = body.match(/^elif\s+(.+)$/);
  if (elif) return `else if (${elif[1]}) {`;
  if (body === "else") return "else {";
  const condition = body.match(/^if\s+(.+)$/);
  if (condition) return `if (${condition[1]}) {`;
  const loop = body.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+)$/);
  if (loop) return `for (const ${loop[1]} of ${loop[2]}) {`;
  const wh = body.match(/^while\s+(.+)$/);
  if (wh) return `while (${wh[1]}) {`;
  const assign = body.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (assign && !declared.has(assign[1])) {
    declared.add(assign[1]);
    return `let ${assign[1]} = ${assign[2]};`;
  }
  if (assign) return `${assign[1]} = ${assign[2]};`;
  return body.endsWith(";") || body.endsWith("{") || body.startsWith("}") ? body : `${body};`;
}

export function transpileCSharp(source: string) {
  return source
    .replace(/Console\.WriteLine/g, "console.log")
    .replace(/Console\.Write/g, "console.log")
    .replace(
      /static\s+string\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*int\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)/g,
      "function $1($2)",
    )
    .replace(/int\[\]\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{([^}]+)\}\s*;?/g, "let $1 = [$2];")
    .replace(/\.Length\b/g, ".length")
    .replace(/\b(int|string|bool|double|float|var)\s+([A-Za-z_][A-Za-z0-9_]*)/g, "let $2");
}

function prelude(language: CourseId) {
  if (language === "py") {
    return `console.log = (...args) => logs.push(args.map((value) => value === true ? "True" : value === false ? "False" : value === null ? "None" : format(value)).join(" "));`;
  }
  if (language === "cs") {
    return `console.log = (...args) => logs.push(args.map((value) => value === true ? "True" : value === false ? "False" : format(value)).join(" "));`;
  }
  return "";
}

export function prepareSource(language: CourseId, code: string) {
  if (language === "py") return { source: transpilePython(code), prelude: prelude(language), html: null as string | null };
  if (language === "cs") return { source: transpileCSharp(code), prelude: prelude(language), html: null as string | null };
  if (language === "web") {
    const html = /<html[\s>]/i.test(code)
      ? code
      : `<!doctype html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
    return { source: "", prelude: "", html };
  }
  if (language === "sql") return { source: "", prelude: "", html: null as string | null };
  return { source: code, prelude: "", html: null as string | null };
}

export async function runUserCode(language: CourseId, code: string): Promise<RunResult> {
  if (language === "sql") return runSql(code);
  const prepared = prepareSource(language, code);
  if (language === "web") return { output: "Pré-visualização pronta.", error: null, html: prepared.html };
  return runScript(`${prepared.prelude}\n${prepared.source}`);
}

function runScript(source: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("title", "Consola SharpTech");
    iframe.style.display = "none";
    const safe = source.replace(/<\/script/gi, "<\\/script");
    const page = `<!doctype html><meta charset="utf-8"><script>
const logs = [];
function format(value) {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  try { return JSON.stringify(value); } catch (error) { return String(value); }
}
console.log = (...args) => { logs.push(args.map(format).join(" ")); };
window.onerror = (message) => {
  parent.postMessage({ src: "sharp", token: "${token}", error: String(message), output: logs.join("\\n") }, "*");
};
try {
${safe}
parent.postMessage({ src: "sharp", token: "${token}", error: null, output: logs.join("\\n") }, "*");
} catch (error) {
parent.postMessage({ src: "sharp", token: "${token}", error: String(error && error.message || error), output: logs.join("\\n") }, "*");
}
<\/script>`;
    const finish = (result: RunResult) => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { src?: string; token?: string; error?: string | null; output?: string };
      // Accept results only from the sandboxed execution frame that received
      // this run's nonce; other windows cannot spoof console output.
      if (event.source !== iframe.contentWindow || !data || data.src !== "sharp" || data.token !== token) return;
      finish({ output: data.output ?? "", error: data.error ?? null, html: null });
    };
    const timer = window.setTimeout(() => {
      finish({ output: "", error: "O programa demorou demais. Vê se há um ciclo sem fim.", html: null });
    }, 1200);
    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
    iframe.srcdoc = page;
  });
}
