# ANTIGONE bridging lab

The website for Assignment 3 (Bridging: From Disagreement to Intervention) of the ANTIGONE Digital Methods class. Students select a disputed X post, design three bridging metrics, test them on a sample of about 20 comments (manually or with an LLM), and compare the result with ranking by likes.

**Address:** https://edekeulenaar.github.io/antigone-bridging-lab/

| task | page | what students do there |
|---|---|---|
| Instructions | `index.html` | the assignment and the submission requirements |
| 1 Select a post | `posts.html` | the 118 disputed posts with statements; details, the shares of the fact-check, notes and replies; download the full thread (CSV) and the fact-check (Markdown) |
| 1 The disagreement | `read.html` | the thread grouped by statement, to identify the main disagreement |
| 2 Design metrics | `metrics.html` | three bridging metrics, each with a name, what it captures and how to identify it (two templates); download them as Word or PDF |
| 3 Code a sample | `prompt.html` | a seeded random sample of about 20 comments (replies, notes or both) as a CSV with empty `metric_A`–`metric_C` columns; a prompt for coding it with an LLM |
| 3 Compare with likes | `order.html` | upload the coded sample (or a saved result file); three rankings side by side, one per metric, with each comment's move compared with ranking by likes; community notes and replies separately; download a report (Word or PDF), the coded comments (CSV) and a result file |

Everything runs in the browser and nothing is uploaded. Each student's work is saved automatically in their own browser, and as a result file (`.json`) that reopens on `order.html` on any computer. The report and the CSV are what students hand in with their methods note.

The order page reads `metric_A`, `metric_B` and `metric_C` (yes/no), columns named after the metrics, other yes/no values (Ja/Nee, TRUE, 1, "yes (…)"), CSVs wrapped in a chatbot's code fence, semicolon-separated files and day-month dates. If `mine_A`… columns are present, it also shows how often they agree with the metric columns.

## The `Statement` column

Each cell lists the statement(s) a comment makes, either as numbers from the student's codebook (`3`, `3 | 7`, `#3; #7`) or as wording (`The video is from 2016 | It needs no note`). Several statements are separated by `|`. An empty cell, `none` or `0` means no statement. The pages also read `LLM_Statement` and an optional `Context` or `LLM_Context` column (yes/no).

## Data

`data/disputed.json` lists the 174 disputed posts. `data/posts/<post_id>/full_thread.csv` holds each thread (the original post, the fact-check(s), every community note and every collected reply) with the statement coding from the Datasets, and `data/posts/<post_id>/fact_check.md` the fact-check as Markdown (for the 118 posts with statements). `statements.csv` lists the statements of the 118 posts whose replies were collected, with the cluster (opinion group) of each. The files were exported from the [Datasets](https://claude.ai/artifact/C2MCv6EvPMsV7Sf9JYqmwA#disputed) with the Datasets' own code and match its downloads.

Sources: fact-checks from ClaimReview via Fact-Check Insights; community notes, ratings and note status from X's public Community Notes exports; replies collected from X.
