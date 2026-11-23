# ANTIGONE bridging lab

The website for the bridging assignment (week 4) of the ANTIGONE Digital Methods class. Students design bridging metrics for a disputed X thread, code the thread by them with a chatbot, and reorder it.

**Address:** https://edekeulenaar.github.io/antigone-bridging-lab/

| step | page | what students do there |
|---|---|---|
| Instructions | `index.html` | the assignment, and how their work is saved |
| 1 Pick a post | `posts.html` | the disputed posts from the Datasets; choose one and download its thread (with a `Statement` column) |
| 2 Close read | `read.html` | the thread grouped by statement, with close-reading questions |
| 3 Define metrics | `metrics.html` | three bridging metrics, each with a name, what it captures and a coding rule (two templates); download the codebook as Word or PDF |
| 4 Code with a chatbot | `prompt.html` | one prompt built from the post and the metrics; splitting long threads into parts; checking the chatbot's coding |
| 5–6 Upload & order | `order.html` | upload the coded CSV (several parts at once, or a saved result file); order community notes and replies separately by engagement, date and the three metrics, with a three-metric side-by-side view; agreement with the student's own coding; download a report (Word or PDF), a result file and a presentation page |

Everything runs in the browser and nothing is uploaded. Each student's work is saved in four ways:

- automatically in their own browser, as a list of saved results;
- as a result file (`.json`) that reopens on `order.html` on any computer;
- as a presentation page (`.html`, no scripts) to show in class;
- as a report to hand in (Word `.docx`, or PDF through the browser's print dialog) with the post, the codebook, the order and the ranked comments.

The chatbot adds `metric_A`, `metric_B` and `metric_C` (yes/no). Students add `mine_A`, `mine_B` and `mine_C` for 20 comments to check its coding. The order page also reads columns named after the metrics, other yes/no values (Ja/Nee, TRUE, 1, "yes (…)"), CSVs wrapped in a chatbot's code fence, semicolon-separated files and day-month dates.

## The `Statement` column

Each cell lists the statement(s) a comment makes, either as numbers from the student's codebook (`3`, `3 | 7`, `#3; #7`) or as wording (`The video is from 2016 | It needs no note`). Several statements are separated by `|`. An empty cell, `none` or `0` means no statement. The pages also read `LLM_Statement` and an optional `Context` or `LLM_Context` column (yes/no).

## Data

`data/disputed.json` lists the 174 disputed posts. `data/posts/<post_id>/full_thread.csv` holds each thread (the original post, the fact-check(s), every community note and every collected reply) with the statement coding from the Datasets. `statements.csv` lists the statements of the 118 posts whose replies were collected, with the cluster (opinion group) of each. The files were exported from the [Datasets](https://claude.ai/artifact/C2MCv6EvPMsV7Sf9JYqmwA#disputed) with the Datasets' own code and match its downloads.

Sources: fact-checks from ClaimReview via Fact-Check Insights; community notes, ratings and note status from X's public Community Notes exports; replies collected from X.
