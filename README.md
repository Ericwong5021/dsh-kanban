# dsh-taskboard

Task board plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI.

It adds a compact task board to the Harness sidebar. Sessions are grouped into inbox, ready, running, blocked, and done columns. Cards open the real Harness session, and new tasks create a session, set its title, and send the prompt through the Harness runtime.

## Install

From a local checkout:

```sh
dsh plugin --profile <profile> add https://github.com/Ericwong5021/dsh-taskboard
```

From a release archive:

```sh
dsh plugin --profile <profile> add https://github.com/Ericwong5021/dsh-taskboard/releases/latest/download/dsh-taskboard-0.1.0.tgz
```

Start the profile and open `任务看板` in the Harness sidebar footer.

## Package shape

The package follows the Harness plugin bundle layout:

- `dsh.bundle.patch` points to `cordis.patch.yml`.
- `dsh.client` declares the Web client entry and its runtime injection edges.
- `lib/client.js` is the loader-compatible browser bundle.
- `lib/index.js` is the Node plugin half.

## Development

The build expects a sibling DeepSeek Harness checkout at `../deepseek-harness` for local workspace packages.

```sh
npm install
npm run build
npm run pack:check
```

