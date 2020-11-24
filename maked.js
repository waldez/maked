#!/usr/bin/env node
/**
 * @author waldez <tomas.waldauf@gmail.com>
 */
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const [/*node*/,/*cwd*/, ...watchedPaths] = process.argv;

// const DEBOUNCE = 5 * 1000;
const DEBOUNCE = 100;

let timer = null;
let makeInProgress = null;

async function runMake() {
    if (makeInProgress) {
        await makeInProgress;
    }

    let result;
    let errors;
    try {
        makeInProgress = exec('make');
        const { stdout, stderr } = await makeInProgress;
        result = stdout;
        errors = stderr;
    } catch (error) {
        errors = error;
    }

    if (errors) {
        console.error('ERRORS:\n', errors);
        await exec(`notify-send "Compilation with errors:\\n${errors}"`);
    } else {
        await exec('notify-send "Compilation OK"');
    }

    console.log('=== ', new Date());
    console.log(result);

    makeInProgress = null;
    timer = null;
}

function processDirChange(event, filename) {
    if (filename) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(runMake, DEBOUNCE);
    }
}

const watchers = watchedPaths.map(watchedPath => fs.watch(watchedPath, processDirChange))
