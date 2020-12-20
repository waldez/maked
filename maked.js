#!/usr/bin/env node
/**
 * @author waldez <tomas.waldauf@gmail.com>
 */
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const [/*node*/,/*cwd*/, ...args] = process.argv;

const argsObj = {};
// extract named parameters
const watchedPaths = args.filter(arg => {
    if (arg[0] === '-') {

        let [key, value] = arg.substr(1).split('=');
        value = typeof value === 'undefined' ? true : value;
        argsObj[key] = value;

        return false;
    } else {
        return true;
    }
});


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
        const makeArgs = argsObj.target ? ` ${argsObj.target}`: '';
        makeInProgress = exec('make' + makeArgs);
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
