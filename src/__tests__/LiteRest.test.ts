import { open, Database } from "sqlite";
import sqlite3 from "sqlite3"; // eslint-disable-line import/no-named-as-default
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import LiteRest from "../LiteRest";

describe("LiteRest", () => {
  let db: Database;
  let liteRest: LiteRest;
  const baseUrl = "https://example.com/people";

  const people = [
    { name: "John", surname: "Smith", age: 83 },
    { name: "Ben", surname: "Jerry", age: 27 },
    { name: "Woody", surname: "Mammoth", age: 34 },
    { name: "Mary", surname: "Watson", age: 44 },
  ];

  beforeEach(async () => {
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database, // eslint-disable-line import/no-named-as-default-member
    });
    liteRest = new LiteRest(db);

    await db.run(
      "CREATE TABLE people (name VARCHAR, surname VARCHAR, age NUMBER)"
    );

    for (const person of people) {
      await db.run(
        "INSERT INTO people (name, surname, age) VALUES (?, ?, ?)",
        person.name,
        person.surname,
        person.age
      );
    }
  });

  afterEach(async () => {
    try {
      await db.close();
    } catch (e) {
      console.error(e);
    }
  });

  describe("Tables and Views Querying", () => {
    it("should return all rows and columns in the 'people' table for the following request: `GET /people`", async () => {
      expect(await liteRest.fetch("GET", new URL(baseUrl))).toStrictEqual(
        people
      );

      expect(await liteRest.fetch("GET", new URL(baseUrl + "/"))).toStrictEqual(
        people
      );
    });

    describe("Horizontal (Rows) Filtering", () => {
      describe("`lt` (less than)", () => {
        it("should return all people with ages less than X for request: `GET /people?lt.X`", async () => {
          // Less than 84
          expect(
            await liteRest.fetch("GET", new URL(`${baseUrl}/people?age=lt.84`))
          ).toStrictEqual(people);

          // Less than 83
          expect(
            await liteRest.fetch("GET", new URL(`${baseUrl}/people?age=lt.83`))
          ).toStrictEqual(people.filter((p) => p.age < 83));

          // Less than 27
          expect(
            await liteRest.fetch("GET", new URL(`${baseUrl}/people?age=lt.27`))
          ).toStrictEqual(people.filter((p) => p.age < 27));
        });

        it("should return all people with names less than 'John': `GET /people?name.John`", async () => {
          expect(
            await liteRest.fetch(
              "GET",
              new URL(`${baseUrl}/people?name=lt.John`)
            )
          ).toStrictEqual(people.filter((p) => p.name < "John"));
        });
      });
    });
  });
});
