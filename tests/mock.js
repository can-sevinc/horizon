// A fake github-script context: records the calls, returns what a test gives it.
module.exports = function mock({ body = "", issues = [], labels = [], workflows = [], graphql = async () => { throw new Error("no board"); },
  headers = {}, repo = { private: true } } = {}) {
  const calls = [];
  const rec = name => async args => { calls.push([name, args]); return { data: {} }; };
  const pat = { graphql, request: async (route, args) => { calls.push([route, args]); return { headers }; } };
  // getOctokit(token): the client of the second token (PROJECT_TOKEN)
  const getOctokit = () => pat;
  const github = {
    paginate: async fn => fn === "listLabelsForRepo" ? labels.map(name => ({ name }))
      : fn === "listRepoWorkflows" ? workflows : issues,
    rest: {
      repos: { get: async () => ({ data: repo }) },
      actions: { listRepoWorkflows: "listRepoWorkflows" },
      issues: {
        get: async () => ({ data: { body } }), listForRepo: "listForRepo", listLabelsForRepo: "listLabelsForRepo",
        update: rec("update"), addLabels: rec("addLabels"), removeLabel: rec("removeLabel"),
        createLabel: rec("createLabel"), createComment: rec("createComment"), updateComment: rec("updateComment"),
        deleteLabel: rec("deleteLabel"),
        create: async args => { calls.push(["create", args]); return { data: { node_id: "N", number: 100 + calls.length, title: args.title } }; },
      },
    },
  };
  const summary = { async write() {} };
  for (const f of ["addRaw", "addHeading", "addList", "addCodeBlock"]) summary[f] = () => summary;
  const core = { info() {}, warning() {}, summary };
  return { github, core, calls, pat, getOctokit };
};
