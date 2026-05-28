# my-xikipedia

A personal fork of [rebane2001/xikipedia](https://github.com/rebane2001/xikipedia): Wikipedia as a social media-style feed, with added Supabase-backed saved article sync.

Deployed app: [my-xikipedia-production.up.railway.app](https://my-xikipedia-production.up.railway.app/)

Original app: [xikipedia.org](https://xikipedia.org/)

## About

Xikipedia is a pseudo social media feed that algorithmically shows content from [Simple Wikipedia](https://simple.wikipedia.org/). It demonstrates how even a basic non-ML algorithm, using no data from other users, can quickly learn what you engage with and suggest more similar content.

This fork keeps the local feed algorithm, but adds:

- saved article records with title, URLs, excerpt, thumbnail, categories, and timestamp
- Markdown/JSON export for saved articles
- Supabase Auth magic-link sign-in
- Supabase-backed saved article sync across devices
- a small Railway-compatible server that serves the compressed Wikipedia dataset with Brotli headers

## Running locally

The repository includes the compressed dataset:

```text
smoldata.json.br
```

For local static testing with Python's simple server, decompress it first:

```bash
brotli -d -k smoldata.json.br
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

For the Railway-style server, run:

```bash
npm start
```

The Node server serves `smoldata.json.br` at `/smoldata.json` with:

```text
Content-Encoding: br
Content-Type: application/json
```

## Supabase saved article sync

The database schema for saved articles lives in:

```text
supabase/saved_articles.sql
```

Run the contents of that file in the Supabase SQL editor. It creates `public.saved_articles` with RLS enabled so signed-in users can only access their own saved articles.

The frontend uses a Supabase publishable key. Do not put service-role keys, Postgres passwords, or other private credentials in this repository or browser code.

## Generating data

To run Xikipedia, you need the JSON file that contains the Wikipedia data. This repo includes a compressed Simple Wikipedia dataset, but you can also make your own by replacing the files in `process_data.py` with your own [Wikimedia data dumps](https://dumps.wikimedia.org/).

## Algorithm

The algorithm used for Xikipedia is simple. Each post has a set of categories, consisting of the post's Wikipedia category tree and pagelinks in the post. These categories have point scores assigned to them.

Actions and their scores:

- Scrolling past a post: -5
- Saving/liking a post: 50 + 4*posts_since_last_like
- Clicking on an article: 75
- Clicking on an image: 100

These scores are applied through the `engagePost` function in the code.

Each post has a base score, which is 0 by default. If a post has an image, it gets +5 on its base score. If you've already seen a post, its base score will be `(3**(post_seen_times)-1) * -5000`.

To get the next post in the feed, 10000 random posts are picked out from the data set. Then one of three things happens randomly:

- 40% chance: weighted random choice by score
- 42% chance: highest-scoring post is shown
- 18% chance: completely random post is shown

The categories `given names` and `surnames` start with a base score of -1000 due to how prevalent they would otherwise be.

## Upstream

This is a modified personal fork of [rebane2001/xikipedia](https://github.com/rebane2001/xikipedia). The original project is by [rebane2001](https://lyra.horse/).

## Licensing

This project remains licensed under AGPLv3. The license applies to the project code, but not the included JSON/Brotli dataset containing data from Wikipedia/Wikimedia sources.
