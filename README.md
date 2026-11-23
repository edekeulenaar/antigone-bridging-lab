# Bridging lab · ANTIGONE

Browser tools for the ANTIGONE bridging assignment (Digital Methods class): design a bridging mechanism for X's comment threads.

**Open it:** https://edekeulenaar.github.io/antigone-bridging-lab/

| page | what it does |
|---|---|
| `index.html` | the 118 contested threads: pick one, download its CSVs |
| `sample.html` | draw a representative, reproducible sample of a thread for coding (stratified, random, engagement-weighted or top-engaged), compare it with the whole thread, and download it with a sampling note |
| `code.html` | turn a codebook of statements into prompts for a chat model (no API needed), paste the answers back, and check them against hand coding or the website's coding |
| `reorder.html` | build up to three bridging metrics from features of each comment, label comments by bridging quality, and see the thread reordered next to X's engagement order; download the ranking and the metric definitions |

Everything runs in the browser. Nothing a student uploads or codes leaves their machine.

## Data

`data/posts/<post_id>/` holds, for each of the 118 disputed posts whose replies were collected:

- `full_thread.csv`: the original post, the fact-check(s), every community note and every collected reply, one row each, with the website's statement coding (`statements`, `statement_text`, `opinion_group`);
- `statements.csv`: the statements distilled for the post, the statements each contradicts, and how many fact-checkers, notes and replies make each.

`data/index.json` lists the posts. The files were exported from the
[ANTIGONE website](https://claude.ai/artifact/C2MCv6EvPMsV7Sf9JYqmwA#disputed) with the website's own download code, so they
match its *Download the full thread* and *Download statements* buttons exactly.

Sources: fact-checks from ClaimReview via Fact-Check Insights; community notes, ratings and note status from X's public
Community Notes exports; replies collected from X. The statements were distilled by hand from the fact-check article, the
most-rated notes and the most-liked direct replies; other notes and replies were assigned by text similarity (precision about
58%, recall about 63% against the hand coding).
