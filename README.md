# Bridging · ANTIGONE week 4

The bridging assignment of the ANTIGONE Digital Methods class, as a website: design a bridging mechanism for X's comment threads.

**Open it:** https://edekeulenaar.github.io/antigone-bridging-lab/

| section | page | what students do there |
|---|---|---|
| 1 Instructions | `index.html` | the assignment: goal, steps, what to hand in |
| 2 Posts | `posts.html` | the Datasets' *Disputed posts* (40 by the notes' majority, 174 by any single note); download each thread as a CSV, with the Datasets' statements in a `Statement` column or with that column empty |
| 3 Sample | `sample.html` | upload a thread, choose a sample size and a method (simple random, stratified, weighted by engagement, most engaged), download the sample |
| 4 Code | `code.html` | instructions: write a codebook, code the `Statement` column, read the thread closely |
| 5 Expand with an LLM | `llm.html` | paste a codebook, get one prompt for their own chatbot, and instructions to verify its coding |
| 6 Bridge | `bridge.html` | upload a coded CSV (or use a post as the Datasets coded it), define three bridging metrics (optionally from breadth, cross-cutting, context, majority, minority, length, engagement, or a column of their own), see the thread reordered, and order it by hand; download the result |

Everything runs in the browser. Files students open are never uploaded, and everything they change is kept in their own
browser only: twenty students using the site at once each have their own copy.

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
