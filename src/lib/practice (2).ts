import type { CourseId } from "@/lib/curriculum";
import type { RunResult } from "@/lib/run";

export type Practice = {
  lessonId: string;
  title: string;
  prompt: string;
  starter: string;
  kind: "out" | "html";
  expect: string[];
};

export const scratch: Record<CourseId, string> = {
  js: 'console.log("olá");\n',
  py: 'print("olá")\n',
  cs: 'Console.WriteLine("olá");\n',
  web: "<h1>A minha página</h1>\n<p>Escreve aqui.</p>\n",
  sql: "SELECT nome, xp\nFROM alunos;\n",
};

export const practices: Practice[] = [
  {
    lessonId: "js-1",
    title: "Guarda um valor",
    prompt: "Cria a constante nome com Ana e mostra-a na consola.",
    starter: 'const nome = "Ana";\n',
    kind: "out",
    expect: ["Ana"],
  },
  {
    lessonId: "js-2",
    title: "Mostra na consola",
    prompt: "Mostra a palavra XP.",
    starter: "",
    kind: "out",
    expect: ["XP"],
  },
  {
    lessonId: "js-3",
    title: "Texto, número, sim ou não",
    prompt: "Guarda a idade 12 e mostra o tipo desse valor.",
    starter: "const idade = 12;\n",
    kind: "out",
    expect: ["number"],
  },
  {
    lessonId: "js-4",
    title: "Comparar sem confundir",
    prompt: "Mostra o resultado de comparar 3 com 3 usando ===.",
    starter: "",
    kind: "out",
    expect: ["true"],
  },
  {
    lessonId: "js-5",
    title: "Se isto, então aquilo",
    prompt: "Se a nota 8 chega a 10, mostra passa. Senão, mostra recupera.",
    starter: "const nota = 8;\n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "js-6",
    title: "E, ou, não",
    prompt: "Mostra o resultado de true && false.",
    starter: "",
    kind: "out",
    expect: ["false"],
  },
  {
    lessonId: "js-7",
    title: "Dá um nome aos passos",
    prompt: "Cria a função ola que mostra olá e chama-a.",
    starter: "function ola() {\n  \n}\n",
    kind: "out",
    expect: ["olá"],
  },
  {
    lessonId: "js-8",
    title: "Listas começam no zero",
    prompt: "Cria a lista letras com a e b. Mostra o primeiro elemento.",
    starter: "",
    kind: "out",
    expect: ["a"],
  },
  {
    lessonId: "js-9",
    title: "Repete com for",
    prompt: "Mostra 0, 1 e 2, um por linha, com um ciclo for.",
    starter: "for (let i = 0; i < 3; i++) {\n  \n}\n",
    kind: "out",
    expect: ["0\n1\n2"],
  },
  {
    lessonId: "js-10",
    title: "A função decide",
    prompt: "Escreve resultado(nota): passa se a nota for pelo menos 10, senão recupera. Mostra resultado(8).",
    starter: "function resultado(nota) {\n  \n}\n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "js-11",
    title: "A lista inteira",
    prompt: "Com a função resultado, percorre [12, 8, 15] e mostra uma palavra por linha.",
    starter: "function resultado(nota) {\n  if (nota >= 10) return \"passa\";\n  return \"recupera\";\n}\nconst notas = [12, 8, 15];\n",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "js-12",
    title: "Do zero",
    prompt: "Do zero: função resultado, a lista [12, 8, 15] e um ciclo. Uma palavra por linha.",
    starter: "",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "py-1",
    title: "O print",
    prompt: "Mostra a palavra Sharp.",
    starter: "",
    kind: "out",
    expect: ["Sharp"],
  },
  {
    lessonId: "py-2",
    title: "Nomes e blocos",
    prompt: "Se a nota for 7, mostra recupera. O corpo do if fica indentado.",
    starter: "nota = 7\nif nota >= 10:\n    print(\"passa\")\nelse:\n    \n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "py-3",
    title: "True com letra grande",
    prompt: "Mostra o resultado de 2 == 2.",
    starter: "",
    kind: "out",
    expect: ["True"],
  },
  {
    lessonId: "py-4",
    title: "If com dois pontos",
    prompt: "nota vale 11. Mostra passa ou recupera com a regra dos 10.",
    starter: "nota = 11\n",
    kind: "out",
    expect: ["passa"],
  },
  {
    lessonId: "py-5",
    title: "Listas e for",
    prompt: "Percorre [1, 2, 3] e mostra cada número.",
    starter: "numeros = [1, 2, 3]\n",
    kind: "out",
    expect: ["1\n2\n3"],
  },
  {
    lessonId: "py-6",
    title: "def e return",
    prompt: "Define dobra(n) que devolve o dobro. Mostra dobra(4).",
    starter: "def dobra(n):\n    \n",
    kind: "out",
    expect: ["8"],
  },
  {
    lessonId: "py-7",
    title: "Devolver a decisão",
    prompt: "Escreve resultado(nota) e mostra resultado(8). A negativa devolve recupera.",
    starter: "def resultado(nota):\n    \n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "py-8",
    title: "Um for com a função",
    prompt: "Classifica [12, 8, 15] com resultado e um for. Uma palavra por linha.",
    starter: "def resultado(nota):\n    if nota >= 10:\n        return \"passa\"\n    return \"recupera\"\nnotas = [12, 8, 15]\n",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "py-9",
    title: "Script do zero",
    prompt: "Do zero, em Python: a função, a lista [12, 8, 15] e o ciclo.",
    starter: "",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "cs-1",
    title: "WriteLine",
    prompt: "Mostra a palavra Sharp.",
    starter: "",
    kind: "out",
    expect: ["Sharp"],
  },
  {
    lessonId: "cs-2",
    title: "int, string, bool",
    prompt: "Cria um int idade com 12 e mostra-o.",
    starter: "",
    kind: "out",
    expect: ["12"],
  },
  {
    lessonId: "cs-3",
    title: "If com chavetas",
    prompt: "nota vale 8. Mostra recupera se não chegar a 10.",
    starter: "int nota = 8;\n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "cs-4",
    title: "O ciclo for",
    prompt: "Mostra 0, 1 e 2 com um for.",
    starter: "for (int i = 0; i < 3; i++) {\n  \n}\n",
    kind: "out",
    expect: ["0\n1\n2"],
  },
  {
    lessonId: "cs-5",
    title: "Métodos",
    prompt: "Escreve o método static string Resultado(int nota) e mostra Resultado(14).",
    starter: "static string Resultado(int nota) {\n  \n}\n",
    kind: "out",
    expect: ["passa"],
  },
  {
    lessonId: "cs-6",
    title: "A primeira classe",
    prompt: "Cria a string nome com Ana e mostra-a. As classes ficam para o passo seguinte; aqui confirma o tipo.",
    starter: "",
    kind: "out",
    expect: ["Ana"],
  },
  {
    lessonId: "cs-7",
    title: "Um método com regra",
    prompt: "Resultado devolve passa ou recupera. Mostra Resultado(8).",
    starter: "static string Resultado(int nota) {\n  \n}\n",
    kind: "out",
    expect: ["recupera"],
  },
  {
    lessonId: "cs-8",
    title: "Ciclo sobre o array",
    prompt: "Classifica o array { 12, 8, 15 } com Resultado. Uma palavra por linha.",
    starter: "static string Resultado(int nota) {\n  if (nota >= 10) return \"passa\";\n  return \"recupera\";\n}\n",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "cs-9",
    title: "Consola do zero",
    prompt: "Do zero: o método, o array { 12, 8, 15 } e o ciclo.",
    starter: "",
    kind: "out",
    expect: ["passa\nrecupera\npassa"],
  },
  {
    lessonId: "web-1",
    title: "Etiquetas",
    prompt: "Faz uma página com um h1 Boletim e um parágrafo.",
    starter: "",
    kind: "html",
    expect: ["<h1", "boletim", "<p"],
  },
  {
    lessonId: "web-2",
    title: "Ligações e imagens",
    prompt: "Inclui uma ligação para https://example.com e uma imagem com alt.",
    starter: '<h1>Recursos</h1>\n',
    kind: "html",
    expect: ["<a", "href=", "<img", "alt="],
  },
  {
    lessonId: "web-3",
    title: "Cor com CSS",
    prompt: "Pinta um título com CSS. A página tem de ter h1 e a propriedade color.",
    starter: "<h1>Sharp</h1>\n<style>\n  h1 { }\n</style>\n",
    kind: "html",
    expect: ["<h1", "color"],
  },
  {
    lessonId: "web-4",
    title: "Classes e flex",
    prompt: "Cria um contentor com a classe cartao e display: flex no CSS.",
    starter: '<main class="cartao">\n  <h1>Boletim</h1>\n</main>\n<style>\n  .cartao { }\n</style>\n',
    kind: "html",
    expect: ["cartao", "display", "flex"],
  },
  {
    lessonId: "web-5",
    title: "Cabeça, corpo, estilo",
    prompt: "Título Boletim, um parágrafo e um bloco style com color.",
    starter: "",
    kind: "html",
    expect: ["<h1", "boletim", "<p", "color"],
  },
  {
    lessonId: "web-6",
    title: "Publica o boletim",
    prompt: "Do zero: main.cartao, um h1, uma lista com três li e display:flex.",
    starter: "",
    kind: "html",
    expect: ["cartao", "<h1", "<ul", "<li", "flex"],
  },
  {
    lessonId: "sql-1",
    title: "Select e from",
    prompt: "Mostra só a coluna nome da tabela alunos.",
    starter: "SELECT \nFROM alunos;\n",
    kind: "out",
    expect: ["Ana\nBruno\nClara"],
  },
  {
    lessonId: "sql-2",
    title: "Filtrar com where",
    prompt: "Nomes dos alunos com xp de pelo menos 25.",
    starter: "SELECT nome\nFROM alunos\n",
    kind: "out",
    expect: ["Ana\nClara"],
  },
  {
    lessonId: "sql-3",
    title: "Ordem e contagem",
    prompt: "Conta quantos alunos existem.",
    starter: "",
    kind: "out",
    expect: ["3"],
  },
  {
    lessonId: "sql-4",
    title: "Juntar tabelas",
    prompt: "Mostra alunos.nome e cursos.titulo, ligando curso_id a cursos.id.",
    starter: "SELECT alunos.nome, cursos.titulo\nFROM alunos\n",
    kind: "out",
    expect: ["Ana | Web\nBruno | Web\nClara | Dados"],
  },
  {
    lessonId: "sql-5",
    title: "A pergunta certa",
    prompt: "Nome e xp de quem tem pelo menos 25, do maior xp para o menor.",
    starter: "",
    kind: "out",
    expect: ["Ana | 40\nClara | 25"],
  },
  {
    lessonId: "sql-6",
    title: "Relatório do zero",
    prompt: "Do zero: nome, título do curso, só xp >= 25, maior xp primeiro.",
    starter: "",
    kind: "out",
    expect: ["Ana | Web\nClara | Dados"],
  },
];

const byId = new Map(practices.map((item) => [item.lessonId, item]));

export function practiceFor(lessonId: string) {
  return byId.get(lessonId) ?? null;
}

export function normalizeOutput(value: string) {
  return value
    .replace(/\r/g, "")
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export function practicePassed(practice: Practice, result: RunResult) {
  if (result.error) return false;
  if (practice.kind === "html") {
    const html = (result.html ?? "").toLowerCase();
    return practice.expect.every((bit) => html.includes(bit.toLowerCase()));
  }
  const got = normalizeOutput(result.output);
  return practice.expect.some((item) => normalizeOutput(item) === got);
}
