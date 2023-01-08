import { URL, URLSearchParams } from "url";
import { Database } from "sqlite";

const opMap = {
  eq: "=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  neq: "<>",
  like: "LIKE",
};

function wrapWithSingleQuotes(s: string): string {
  return `"${s.replaceAll('"', '""')}"`;
}

function wrapWithDoubleQuotes(s: string): string {
  return `"${s.replaceAll('"', '""')}"`;
}

function wrapVal(v: string): string {
  return wrapWithSingleQuotes(v);
}

export default class LiteRest {
  constructor(private db: Database) {}

  fetch<T>(method: string, url: URL): Promise<T> {
    switch (method.toUpperCase()) {
      case "GET":
        return this.get(url);
    }
    throw Error("Unsupported HTTP method: " + method);
  }

  async get<T>(url: URL): Promise<T> {
    const table = wrapWithDoubleQuotes(url.pathname.split("/")[1]);
    const where = this.where(url.searchParams);
    const sql = `SELECT * FROM ${table} WHERE ${where}`;
    console.log(sql);
    return this.db.all(sql);
  }

  where(params: URLSearchParams): string {
    const entries: [string, string][] = [];
    params.forEach((opAndVal, col) => {
      entries.push([col, opAndVal]);
    });

    if (entries.length === 0) return "1 = 1";
    if (entries.length === 1) return this.expression(entries[0]);

    throw new Error("Not implemented yet");
  }

  expression(colOpVal: [string, string]): string {
    const col = colOpVal[0];
    const opAndVal = colOpVal[1];

    const [op, val] = opAndVal.split(".");

    switch (op) {
      case "eq":
      case "neq":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
      case "like":
        return `${wrapWithSingleQuotes(col)} ${opMap[op]} ${wrapVal(val)}`;
    }

    throw new Error("Unknown operator: " + op);
  }
}
