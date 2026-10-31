# Signal

A personal, proactive agent that reads tech news and news about its owner's investments every morning, filters out hype and noise, and publishes what matters on a private web page.

## Language

**Signal**:
The agent this repo builds; it runs on a daily schedule without being asked.
_Avoid_: bot, assistant

**Daily Run**:
One day's work: fetch the Feeds, score, read, write and publish the Digest.
_Avoid_: job, execution, cycle

**Digest**:
The day's page, with its two Sections.
_Avoid_: newsletter, report, summary

**Section**:
One half of the Digest: Tech or Markets.
_Avoid_: tab, category

**Feed**:
A place Signal reads from (HN, Lobsters, Finnhub, EDGAR…).
_Avoid_: source, provider

**Story**:
One piece of news. A candidate until it gets into the Digest.
_Avoid_: article, item, post

**Position**:
A company the owner holds, shown in Markets as one card.
_Avoid_: holding, stock

**Signal Score**:
How much a Story matters to the owner, computed in code from Clef's answers.
_Avoid_: rank, relevance, rating

**Subject**:
The short tag on a Tech Story ("Claude", "Anthropic"); in Markets the Position's ticker.
_Avoid_: label, topic

**Headline**:
The line that says what happened, written by the orchestrator.
_Avoid_: title

**Summary**:
The few lines under the Headline carrying the significant facts.
_Avoid_: description, abstract

**Why It Matters**:
One line on why the Story is relevant to the owner.
_Avoid_: insight, takeaway

**Upvote**:
The owner's 👍 on a Story.
_Avoid_: like, accept

**Downvote**:
The owner's 👎 on a Story.
_Avoid_: dislike, dismiss, reject
