const core = require('@actions/core')
const github = require('@actions/github')
const {getAllFilesSync} = require("get-all-files")

const git = require('./git');

async function run() {
    try {
        const filter = new RegExp(core.getInput('filter').trim());
        const changes = await getFileChanges();
        const output = getMatches(changes, filter)
        core.setOutput('matrix', 0 < output.length ?
            output : await getDefault(filter));
    } catch (err) {
        core.setFailed(err.message);
    }
}

async function getFileChanges() {
    if (github.context.eventName === 'pull_request') {
        const pr = github.context.payload.pull_request;
        return await getChangedFilesFromGit(pr.base.sha);
    } else if (github.context.eventName === 'push') {
        return getFileChangesFromPush();
    } else {
        throw new Error('This action can be triggered only by pull_request or push event');
    }
}

async function getFileChangesFromPush() {
    const push = github.context.payload;
    if (git.isTagRef(push.ref)) {
        return [];
    }
    const baseInput = git.trimRefs(core.getInput('base', {required: false}));
    const base = git.trimRefsHeads(baseInput) === git.trimRefsHeads(push.ref) ? push.before : baseInput
    if (base === git.NULL_SHA) {
        return [];
    }
    return await getChangedFilesFromGit(base);
}

async function getChangedFilesFromGit(ref) {
    await git.fetchCommit(ref);
    return await git.getChangedFiles(git.FETCH_HEAD);
}

function getDefault(filter) {
    const all = core.getInput('default-to-all') === 'true'
    return all ? getMatches(getAllFilesSync('.').toArray(), filter) : [];
}

function getMatches(files, filter) {
    return files.filter(c => filter.test(c))
        .flatMap(c => c.match(filter).splice(1))
}

run().catch(err => core.setFailed(err.message));