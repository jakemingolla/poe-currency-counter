# poe-stash-currency-crawler

Author(s):
- Jake Mingolla

Last Updated: January, 2021

## Introduction

[Path of Exile][PathOfExile] is an Action-RPG multiplayer
game with an extremely interesting in-game economy system.
Rather than using a centralized currency like coins, gold,
or points, the value of any item is determined on a per-player
basis using many distinct currencies. These currency items
can be used to enhance weapons and armor significantly and
exchange hands between players frequently.

In order to have some sembelence of a stable economy, external
tools such as [poe.ninja][PoENinja] periodically scrape
the [public API][PathOfExileTradeAPI] published for ALL in-game
player stashes to determine which currency has traded hands.
By establishing a (relatively) accurate ledger of currency transactions,
players can more accurately buy and sell goods in the decentralized
market and with greater confidence than before these tools existed.

However, third-party tools like [poe.ninja][PoENinja] have an inherent
problem of trust. Because Grinding Gear Games, the publisher of
Path of Exile, does not provide any verification of currency values
or confirm trades between players, the in-game markets are vulnerable
to manipulation. This potential for exploitation of players tied
to the [long-standing problem][RMTForumDiscussion] of "real-money trading"
(using real-life currency like USD or Euros to buy in-game items) is
a recipe for disaster.

In short, this tool was a way to become more familiar with the
[Public Stash Tabs API][PathOfExileAPIReference] and be able to generate
reports on the number of currency items in use in comparison to their
expected 'value'. I hope this is just a start to verification of
third-party tools so vital to the [Path of Exile][PathOfExile] community.

## Usage
```
npm run cli
```
Provides a CLI for generating reports on the number of currencies
available in each league with public stash tabs.

For example:
```
? Select league Standard
? Select currency base type Chaos Orb
┌────────────────────────┬──────────────────────────────────────────┐
│        (index)         │                  Values                  │
├────────────────────────┼──────────────────────────────────────────┤
│    Chaos Orb Total     │                 1640047                  │
│ Public Stashes Counted │                   3123                   │
│       Start Date       │ 'Saturday, January 1st 2022, 8:35:08 pm' │
│        End Date        │  'Monday, January 3rd 2022, 3:36:48 pm'  │
└────────────────────────┴──────────────────────────────────────────┘
```

## Local Development
```
npm run dev
```
Uses [docker-compose][docker] to set up the local API server,
ingest runner, and [MongoDB][MongoDB] instances necessary to poll
the [Path of Exile Public Stash Tabs API][PathOfExileAPIReference].

## TO-DOs
- [x] Add unit tests
- [ ] Add _more_ unit tests :smile:
- [ ] Limit leagues to just 'traditional' leagues and ignore private ones
- [ ] Public API for querying snapshots
- [ ] Web UI for viewing snapshots

## Third-Party Notice
This app isn't affiliated with Grinding Gear Games in any way.

<!-- REFERENCES -->
[PathOfExile]: http://www.pathofexile.com
[PathOfExileTradeAPI]: https://www.pathofexile.com/trade
[PathOfExileAPIReference]: https://www.pathofexile.com/developer/docs/reference
[PoENinja]: https://poe.ninja/challenge/currency
[RMTForumDiscussion]: https://www.pathofexile.com/forum/view-thread/1805649/page/1
[docker]: https://docs.docker.com/
[MongoDB]: https://docs.mongodb.com/
