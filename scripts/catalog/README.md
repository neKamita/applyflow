# Catalog seed

`build_seed.py` produced `application-service/src/main/resources/db/migration/V3__expand_program_catalog.sql`.
The migration is committed; the script is kept so the selection can be read and reproduced. Do not
regenerate V3 after it has been applied anywhere: Flyway would reject the changed checksum. A future
change to the catalog belongs in a new migration.

## Sources

| Data | Source | Licence | Used for |
|---|---|---|---|
| Master's programs | [OpenML 43738](https://www.openml.org/d/43738), scraped from mastersportal.eu in 2017 | CC0 (as published) | university, country, program name |
| Universities | [Hipo university-domains-list](https://github.com/Hipo/university-domains-list) | MIT | keeping only universities listed in the same country |

Application fees and deadlines are illustrative: they are derived from a hash of the program, not taken
from the dataset (its tuition is not an application fee, and its deadlines are from 2017).

## Reproduce

Download both files outside the repository, then run the script with [uv](https://docs.astral.sh/uv/),
which installs the pinned `pyarrow` into an isolated environment:

```bash
curl -fL -o /tmp/openml-43738.pq https://data.openml.org/datasets/0004/43738/dataset_43738.pq
curl -fL -o /tmp/hipo.json https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json
uv run scripts/catalog/build_seed.py --openml /tmp/openml-43738.pq --hipo /tmp/hipo.json --out /tmp/V3.sql
```

The output is deterministic for the same input files.
