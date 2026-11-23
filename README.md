# Bridging · ANTIGONE week 4

The bridging assignment of the ANTIGONE Digital Methods class, as a website: design a bridging mechanism for X's comment threads.

**Open it:** https://edekeulenaar.github.io/antigone-bridging-lab/

| step | page | what students do there |
|---|---|---|
| Instructions | `index.html` | the assignment, and how their work is saved |
| 1 Pick a post | `posts.html` | the Datasets' disputed posts; choose one, download its thread (with a `Statement` column) |
| 2 Close read | `read.html` | the thread laid out by statement, with close-reading questions |
| 3 Define metrics | `metrics.html` | three bridging metrics: name, what it captures, coding rule (templates included) |
| 4 Code with a chatbot | `prompt.html` | one prompt built from the post and the metrics; split long threads into parts; how to check the chatbot |
| 5–6 Upload & order | `order.html` | upload the coded CSV (several parts at once, or a saved result file); order by engagement, time and the three metrics; agreement with the student's own coding; download a result file and a presentation page |

Everything runs in the browser and nothing is uploaded. Each student's work is saved three ways: automatically in their own
browser (a list of saved results), as a result file (`.json`) that reopens on `order.html` on any computer, and as a
stand-alone presentation page (`.html`, no scripts) to show in class.

The chatbot adds `metric_A`, `metric_B`, `metric_C` (yes/no); students add `mine_A`… for 20 comments to check it. The order
page also reads columns named after the metrics, any yes/no-like values (Ja/Nee, TRUE, 1, "yes (…)"), CSVs wrapped in a
chatbot's code fence, semicolon files and day-month dates.

## The `Statement` column

One cell per comment: the statement(s) it makes, as numbers from the student's codebook (`3`, `3 | 7`, `#3; #7`) or as
wording (`The video is from 2016 | It needs no note`). Several statements are separated by `|`. Empty, `none` or `0` = no
statement. Bridge also reads `LLM_Statement` (the column the LLM prompt asks for) and an optional `Context` / `LLM_Context`
column (yes/no).

## Data

`data/disputed.json` lists the 174 disputed posts; `data/posts/<post_id>/full_thread.csv` holds each thread (the original
post, the fact-check(s), every community note and every collected reply) with the Datasets' statement coding, and
`statements.csv` the statements of the 118 posts whose replies were collected, with the cluster (opinion group) of each.
They were exported from the [Datasets](https://claude.ai/artifact/C2MCv6EvPMsV7Sf9JYqmwA#disputed) with the Datasets'
own code, so they match its downloads.

Sources: fact-checks from ClaimReview via Fact-Check Insights; community notes, ratings and note status from X's public
Community Notes exports; replies collected from X.
