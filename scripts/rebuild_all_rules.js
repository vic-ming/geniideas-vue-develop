const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../src/assets/export');

console.log("1. Running raw Python extraction scripts...");
try {
    execSync('python3 scripts/extract_tsmc_rules.py', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    execSync('python3 scripts/extract_tsmc_rules_all.py', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    execSync('python3 scripts/extract_tsmc_fittings_rules.py', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

    execSync('python3 scripts/extract_juxian_pipe_rules.py', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    execSync('python3 scripts/extract_juxian_rules_all.py', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (e) {
    console.error("Failed to run extraction scripts:", e.message);
}

// 2. Converters
const outputKeys = ['name', 'partNo', 'partName', 'unit', 'divisor', 'round', 'inner', 'outer', 'qtyHint', 'lengthHint', 'quantityHint', 'note'];

function toMatchOutputFormat(flatRule, extras = {}) {
    const match = {};
    for (const [k, v] of Object.entries(extras)) {
        if (!k.startsWith('_')) match[k] = v;
    }
    const output = {};
    for (const [k, v] of Object.entries(flatRule)) {
        let val = v;
        if (outputKeys.includes(k)) {
            output[k] = val;
        } else {
            if (v !== '' && v !== null && v !== undefined) {
                let matchKey = k;
                if (extras._isTsmcPipe) {
                    if (k === 'category') matchKey = 'pipelineType';
                    if (k === 'panelSize') matchKey = 'size';
                }

                if (matchKey !== '_isTsmcPipe') {
                    match[matchKey] = [String(val)];
                }
            }
        }
    }
    return { match, output };
}

function convertFile(filename, tsmcFittingsConv = false) {
    const file = path.join(ROOT, filename);
    if (!fs.existsSync(file)) return;

    let data;
    try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { return; }

    const processArray = (arr, extras) => arr.map(rule => toMatchOutputFormat(rule, extras));

    if (tsmcFittingsConv) {
        // TSMC fitting structure
        const newRules = [];
        if (data.elbow) newRules.push(...data.elbow.map(r => toMatchOutputFormat(r, { fittingType: ['90 DI ELBOW', 'ELBOW'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.reducerTee) newRules.push(...data.reducerTee.map(r => toMatchOutputFormat({ size: `${r.mainSize}x${r.branchSize}`, material: r.material, partName: r.partName, unit: r.unit }, { fittingType: ['REDUCING TEE'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.reducer) newRules.push(...data.reducer.map(r => toMatchOutputFormat({ size: `${r.fromSize}x${r.toSize}`, material: r.material, partName: r.partName, unit: r.unit }, { fittingType: ['REDUCER'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.cap) newRules.push(...data.cap.map(r => toMatchOutputFormat(r, { fittingType: ['CAP'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.cross) newRules.push(...data.cross.map(r => toMatchOutputFormat(r, { fittingType: ['CROSS'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.tee) newRules.push(...data.tee.map(r => toMatchOutputFormat(r, { fittingType: ['TEE'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));
        if (data.elbow45) newRules.push(...data.elbow45.map(r => toMatchOutputFormat(r, { fittingType: ['45 DI ELBOW'], connector: ['WELD'], pipelineType: ['單套管', '單線管', '盤面'] })));

        data.rules = newRules;
        delete data.elbow; delete data.reducerTee; delete data.reducer; delete data.cap; delete data.cross; delete data.tee; delete data.elbow45;
    } else if (data.rules) {
        if (data.rules.length > 0 && data.rules[0].match) return; // already in match/output format
        let ext = {};
        if (filename === 'tsmc_pipe_rules.json') ext._isTsmcPipe = true;
        if (filename === 'tsmc_valve_rules.json') ext._isTsmcValve = true;
        data.rules = processArray(data.rules, ext);
    } else if (data.sections) { // Juxian other or fittings
        for (const [sec, arr] of Object.entries(data.sections)) {
            if (arr.length > 0 && arr[0].match) continue;
            data.sections[sec] = processArray(arr, {});
        }
        if (filename === 'juxian_other_rules.json' || filename === 'juxian_fitting_rules.json') {
            let allRules = [];
            for (const [sec, arr] of Object.entries(data.sections)) {
                allRules.push(...arr.map(r => {
                    let matchKey = filename === 'juxian_other_rules.json' ? 'section' : 'type';
                    if (!r.match) r = toMatchOutputFormat(r);
                    r.match[matchKey] = [sec];
                    return r;
                }));
            }
            data.rules = allRules;
            delete data.sections;
        }
    } else {
        // Other structures like TSMC other: { stopSpacer: [], spring: [], gauge: [] }
        for (const [sec, arr] of Object.entries(data)) {
            if (Array.isArray(arr) && arr.length > 0) {
                if (!arr[0].match) {
                    data[sec] = processArray(arr, {});
                }
            }
        }
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

console.log("2. Converting extracted flat data to Match/Output structure...");
convertFile('tsmc_pipe_rules.json');
convertFile('tsmc_valve_rules.json');
convertFile('tsmc_fitting_rules.json', true);
convertFile('tsmc_other_rules.json');

convertFile('juxian_pipe_rules.json');
convertFile('juxian_valve_rules.json');
convertFile('juxian_other_rules.json');
convertFile('juxian_fitting_rules.json');

console.log("Done! Run complete.");
