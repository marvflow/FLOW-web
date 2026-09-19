# Eventy sheet — co přepsat (14. 9. 2026)

Spreadsheet `16pAu_5uEk0bnS49V5fzu7S6tNQ6P7kXgQEo6rikAilY`, karta **Eventy**.
Sloupce: `type | title | date | time | active`

## 1) Staré řádky → active = FALSE (nemazat, ať zůstane historie)

| type | title | date | active |
|---|---|---|---|
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-09-17 | **FALSE** |
| ms-od | Den otevřených dveří Little FLOW (MŠ) | 2026-06-04 | **FALSE** |

## 2) Přepsat řádek „kafe" (web už mluví o prohlídkách s vedením)

| type | title | date | time | active |
|---|---|---|---|---|
| kafe | Prohlídka školy s vedením | *(prázdné)* | út a čt, 9:00–9:45 nebo 10:45–11:30 | TRUE |

## 2b) Přepsat řádek „online"

| type | title | date | time | active |
|---|---|---|---|---|
| online | Online schůzka s vedením | *(prázdné)* | út a čt, 10:00–10:30 | TRUE |

## 3) Přidat dny otevřených dveří — jen nový kampus, start 16:00

| type | title | date | time | active |
|---|---|---|---|---|
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-10-07 | 16:00 | TRUE |
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-10-21 | 16:00 | TRUE |
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-11-04 | 16:00 | TRUE |
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-11-18 | 16:00 | TRUE |
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-12-02 | 16:00 | TRUE |
| zs-od | Den otevřených dveří ZŠ FLOW | 2026-12-09 | 16:00 | **FALSE** |

Devátý prosinec je připravený vypnutý. Až se rozhodneš podle naplněnosti, přepneš na TRUE a je na webu.

## 4) Volitelně: anglické názvy

Web od 14. 9. umí sloupce **`title_en`** a **`time_en`**. Dokud v tabulce nejsou, anglická verze ukazuje české názvy.

| type | title_en | time_en |
|---|---|---|
| zs-od | Open Day at FLOW Elementary | 16:00 |
| kafe | School tour with the leadership team | Tue and Thu, 9:00–9:45 or 10:45–11:30 |
| online | Online meeting with the leadership team | Tue and Thu, 10:00–10:30 |

## Poznámky

- Datum vždy `YYYY-MM-DD`, čas `HH:MM`.
- Propadlé termíny se od 14. 9. z nabídky **filtrují samy** na všech stránkách, takže starý termín už v nabídce neuvízne.
- Web má cache ~5 minut, změna je vidět skoro hned.
