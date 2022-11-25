const {exec} = require('@actions/exec')

const NULL_SHA = '0000000000000000000000000000000000000000';
const FETCH_HEAD = 'FETCH_HEAD';

function isTagRef(ref) {
    return ref.startsWith('refs/tags/');
}

function trimRefs(ref) {
    return trimStart(ref, 'refs/')
}

function trimRefsHeads(ref) {
    const trimRef = trimStart(ref, 'refs/')
    return trimStart(trimRef, 'heads/')
}

function trimStart(ref, start) {
    return ref.startsWith(start) ? ref.substr(start.length) : ref
}

async function fetchCommit(ref) {
    if (await exec('git', ['fetch', '--depth=1', '--no-tags', 'origin', ref]) !== 0) {
        throw new Error(`Fetching ${ref} failed`);
    }
}

async function getChangedFiles(ref) {
    let buffer = '';

    const code = await exec('git', ['diff-index', '--name-only', ref], {
        listeners: {
            stdout: (data => buffer += data.toString())
        }
    });
    if (code !== 0) {
        throw new Error(`Couldn't determine changed files`);
    }

    return buffer
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

module.exports = {
    NULL_SHA, FETCH_HEAD, isTagRef, trimRefs, trimRefsHeads, fetchCommit, getChangedFiles
}