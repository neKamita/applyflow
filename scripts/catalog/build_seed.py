# /// script
# requires-python = ">=3.12"
# dependencies = ["pyarrow==26.0.1"]
# ///
"""Builds the Flyway migration that expands the demo program catalog.

Inputs are two public datasets, downloaded by hand (see README.md):
  - OpenML 43738 "Masters-Degrees--Programs-(mastersportal.eu)" (Parquet): university, country and
    program names. Its tuition and deadline columns are not used.
  - Hipo university-domains-list (JSON): a program is kept only if its university is listed there in
    the same country, which removes scraping noise (for example London universities filed under France).

Fees and deadlines are illustrative, derived from a hash so the output is deterministic.

Usage:
  uv run scripts/catalog/build_seed.py --openml <file.pq> --hipo <file.json> --out <V3__...sql>
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

import pyarrow.parquet as pq

# Country -> (currency, minimum, maximum, step) for the illustrative application fee.
FEES: dict[str, tuple[str, int, int, int]] = {
    "United Kingdom": ("GBP", 20, 100, 5),
    "Germany": ("EUR", 25, 120, 5),
    "Netherlands": ("EUR", 25, 120, 5),
    "France": ("EUR", 25, 120, 5),
    "Italy": ("EUR", 25, 120, 5),
    "Sweden": ("SEK", 300, 1000, 50),
    "Denmark": ("DKK", 300, 900, 50),
    "Switzerland": ("CHF", 50, 150, 10),
    "Canada": ("CAD", 50, 150, 5),
    "Australia": ("AUD", 50, 150, 5),
    "United States": ("USD", 40, 150, 5),
}
PER_COUNTRY = 3
LONG_NAME = 70
# Master's degrees only; certificates, diplomas and pre-master courses are not degrees.
DEGREE_PREFIXES = {"MSc", "MA", "MBA", "MEd", "LLM", "MEng", "MPhil", "MRes", "MFA", "MPH", "MArch", "MSW"}
SUBJECTS = re.compile(
    r"comput|data|software|informatic|artificial intelligence|machine learning|cyber|robot|"
    r"engineering|mathemat|statistic|physics|econom|finance|design|architecture|urban|energy",
    re.IGNORECASE,
)
OPEN_FROM, OPEN_TO = date(2026, 12, 1), date(2027, 9, 30)
CLOSED_FROM, CLOSED_TO = date(2026, 3, 1), date(2026, 10, 31)
CLOSED_COUNT = 3
V2_IDS = {"bham-msc-cs", "tum-msc-informatics", "polimi-bsc-ce", "kaist-msc-ai", "wiut-bsc-se"}


@dataclass(frozen=True)
class Row:
    id: str
    university: str
    name: str
    country: str
    currency: str
    fee: int
    deadline: date


def fold(text: str) -> str:
    """Comparable form of a university name: no accents, punctuation, case or leading 'the'."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
    return re.sub(r"^the ", "", text)


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", fold(text)).strip("-")


def digest(*parts: str) -> int:
    return int(hashlib.sha256("|".join(parts).encode()).hexdigest(), 16)


def clean(text: object) -> str | None:
    if not isinstance(text, str):
        return None
    text = " ".join(text.split())
    if not text or len(text) > 200 or "${" in text or any(unicodedata.category(c) == "Cc" for c in text):
        return None
    return text


def make_id(university: str, name: str, taken: set[str]) -> str:
    words = f"{slug(university)}-{slug(name)}".split("-")
    candidate = ""
    for word in words:
        if len(candidate) + len(word) + 1 > 64:
            break
        candidate = f"{candidate}-{word}" if candidate else word
    base, n = candidate, 2
    while candidate in taken:
        suffix = f"-{n}"
        candidate = base[: 64 - len(suffix)] + suffix
        n += 1
    taken.add(candidate)
    return candidate


def fee_for(country: str, key: str) -> tuple[str, int]:
    currency, low, high, step = FEES[country]
    steps = (high - low) // step
    return currency, low + (digest("fee", key) % (steps + 1)) * step


def day_between(start: date, end: date, key: str) -> date:
    return start + timedelta(days=digest("deadline", key) % ((end - start).days + 1))


def select(openml_path: Path, hipo_path: Path) -> list[Row]:
    hipo = {(fold(u["name"]), u["country"]) for u in json.loads(hipo_path.read_text(encoding="utf-8"))}
    table = pq.read_table(openml_path, columns=["country_name", "university_name", "program_name", "program_type"])

    candidates: dict[str, list[tuple[int, str, str]]] = {country: [] for country in FEES}
    for record in table.to_pylist():
        country = record["country_name"]
        university = clean(record["university_name"])
        program = clean(record["program_name"])
        prefix = record["program_type"]
        if country not in FEES or not university or not program or prefix not in DEGREE_PREFIXES:
            continue
        if (fold(university), country) not in hipo or not SUBJECTS.search(program):
            continue
        name = clean(f"{prefix} {program}")
        if name:
            candidates[country].append((digest(university, name), university, name))

    rows: list[Row] = []
    taken = set(V2_IDS)
    for country in FEES:
        chosen: list[tuple[str, str]] = []
        universities: set[str] = set()
        ordered = sorted(set(candidates[country]))
        # One long name per country where available, so the layout is tested with real data.
        long_first = [c for c in ordered if len(c[2]) >= LONG_NAME][:1] + ordered
        for _, university, name in long_first:
            if university in universities:
                continue
            universities.add(university)
            chosen.append((university, name))
            if len(chosen) == PER_COUNTRY:
                break
        for university, name in chosen:
            key = f"{university}|{name}"
            currency, fee = fee_for(country, key)
            rows.append(Row(make_id(university, name, taken), university, name, country, currency, fee,
                            day_between(OPEN_FROM, OPEN_TO, key)))

    # A few programs whose deadline has passed, so the closed state shows up in the demo.
    for index in sorted(range(len(rows)), key=lambda i: digest("closed", rows[i].id))[:CLOSED_COUNT]:
        row = rows[index]
        rows[index] = Row(row.id, row.university, row.name, row.country, row.currency, row.fee,
                          day_between(CLOSED_FROM, CLOSED_TO, row.id))
    return rows


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def render(rows: list[Row]) -> str:
    lines = [
        "-- Expands the demo catalog. Generated by scripts/catalog/build_seed.py; do not edit by hand and",
        "-- never regenerate after it has been applied anywhere (Flyway checksums).",
        "--",
        "-- University, country and program names: OpenML dataset 43738, 'Masters-Degrees--Programs-",
        "-- (mastersportal.eu)', published as CC0, scraped in 2017; kept only when the university appears in",
        "-- the Hipo university-domains-list (MIT) for the same country.",
        "-- Application fees and deadlines are ILLUSTRATIVE demo values, not real university data.",
        "INSERT INTO programs (id, university, name, country, degree, fee_amount, currency, deadline) VALUES",
    ]
    values = [
        f"    ({sql_text(r.id)}, {sql_text(r.university)}, {sql_text(r.name)}, {sql_text(r.country)}, "
        f"'MASTER', {r.fee}.00, '{r.currency}', DATE '{r.deadline.isoformat()}')"
        for r in rows
    ]
    return "\n".join(lines) + "\n" + ",\n".join(values) + ";\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--openml", type=Path, required=True)
    parser.add_argument("--hipo", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    rows = select(args.openml, args.hipo)
    ids = [r.id for r in rows]
    assert len(ids) == len(set(ids)) and not set(ids) & V2_IDS, "duplicate program ids"
    args.out.write_text(render(rows), encoding="utf-8")
    countries = sorted({r.country for r in rows})
    print(f"{len(rows)} programs, {len(countries)} countries, "
          f"{sum(r.deadline < OPEN_FROM for r in rows)} closed, "
          f"{sum(len(r.name) >= LONG_NAME for r in rows)} names >= {LONG_NAME} chars -> {args.out}")


if __name__ == "__main__":
    main()
