import pipeRulesData from '@/assets/export/juxian_pipe_rules.json';
import valveRulesData from '@/assets/export/juxian_valve_rules.json';
import otherRulesData from '@/assets/export/juxian_other_rules.json';
import fittingRulesData from '@/assets/export/juxian_fitting_rules.json';
import { matchRule } from '@/utils/ruleMatcher';

const n = (v = '') => (v == null ? '' : String(v)).trim();

export const unmatchedJuxianPipeRules = pipeRulesData.unmatched ?? [];
export const unmatchedJuxianValveRules = valveRulesData.unmatched ?? [];
export const unmatchedJuxianOtherRules = otherRulesData.unmatched ?? [];
export const unmatchedJuxianFittingRules = fittingRulesData.unmatched ?? [];

// pipeIndex removed in favor of dynamic matchRule

// valveIndex removed in favor of dynamic matchRule

// otherIndex removed in favor of dynamic matchRule

// fittingIndex removed in favor of dynamic matchRule

export function resolveJuxianPipe({ pipelineType, size, material, brand, doubleSize }) {
  if (!pipelineType) return null;

  const result = matchRule({
    pipelineType,
    size,
    material,
    brand,
    doubleSize
  }, pipeRulesData.rules);

  if (result && pipelineType === '雙套管') {
    return {
      inner: result.inner,
      outer: result.outer
    };
  }

  return result || null;
}

export function resolveJuxianValve({ connector, size, valveType, brand }) {
  return matchRule({
    connector,
    size,
    valveType,
    brand
  }, valveRulesData.rules) || null;
}

export function resolveJuxianStopSpacer({ pipelineType, doubleSize, hasBranchPanel, brand }) {
  return matchRule({ pipelineType, doubleSize, hasBranchPanel, brand, section: 'stopSpacer' }, otherRulesData.rules) || null;
}

export function resolveJuxianSpring({ pipelineType, doubleSize, brand }) {
  return matchRule({ pipelineType, doubleSize, brand, section: 'spring' }, otherRulesData.rules) || null;
}

export function resolveJuxianOverTube({ pipelineType, doubleSize, brand }) {
  return matchRule({ pipelineType, doubleSize, brand, section: 'overTube' }, otherRulesData.rules) || null;
}

export function resolveJuxianGauge({ panelSize, panelConnector, material, brand }) {
  let actualBrand = brand;
  let spec = '';
  if (brand && brand.includes('(')) {
    const parts = brand.split('(');
    actualBrand = parts[0];
    spec = parts[1].replace(')', '');
  }

  const payload = { panelSize, panelConnector, material, brand: actualBrand, section: 'gauge' };
  let rules = otherRulesData.rules || [];

  // local filter to enforce the spec string is present in the output name
  const applySpecFilter = (resMap) => {
    if (!spec) return true;
    return resMap?.output?.name?.includes(spec);
  };

  let res = matchRule(payload, rules);
  if (res && applySpecFilter({ output: res })) return res;

  if (panelSize !== '1/4"') {
    let fallbackPayload = { ...payload, panelSize: '1/4"' };
    let fallbackRules = rules.filter(r => r.match?.panelSize?.includes('1/4"'));
    for (const rule of fallbackRules) {
      let matchRes = matchRule(fallbackPayload, [rule]);
      if (matchRes && applySpecFilter({ output: matchRes })) {
        return matchRes;
      }
    }
  }

  // fallback pure match across all gauge rules simulating matchRule manually if it fails
  for (const rule of rules) {
    const isMatch = rule.match?.panelSize?.includes('1/4"') &&
      rule.match?.panelConnector?.includes(panelConnector) &&
      rule.match?.material?.includes(material) &&
      rule.match?.brand?.includes(actualBrand);
    if (isMatch && applySpecFilter(rule)) {
      return rule.output;
    }
  }
  return null;
}

export function resolveJuxianGland({ panelSize, panelConnector, material, brand }) {
  return matchRule({ panelSize, panelConnector, material, brand, section: 'gland' }, otherRulesData.rules) || null;
}

export function resolveJuxianNut({ panelSize, panelConnector, material, brand }) {
  return matchRule({ panelSize, panelConnector, material, brand, section: 'nut' }, otherRulesData.rules) || null;
}

export function resolveJuxianGasket({ panelSize, panelConnector, material, brand }) {
  return matchRule({ panelSize, panelConnector, material, brand, section: 'gasket' }, otherRulesData.rules) || null;
}

export function resolveJuxianReducer({ fromSize, toSize, material, brand }) {
  return matchRule({ fromSize, toSize, material, brand, type: 'reducer' }, fittingRulesData.rules) || null;
}

export function resolveJuxianReducerTee({ mainSize, branchSize, material, brand }) {
  return matchRule({ fromSize: mainSize, toSize: branchSize, material, brand, type: 'reducerTee' }, fittingRulesData.rules) || null;
}

export function resolveJuxianTee({ size, material, brand }) {
  return matchRule({ size, material, brand, type: 'tee' }, fittingRulesData.rules) || null;
}

export function resolveJuxianElbow({ size, material, brand }) {
  return matchRule({ size, material, brand, type: 'elbow' }, fittingRulesData.rules) || null;
}

export function resolveJuxianDoubleTee({ pipelineType, doubleSize, brand }) {
  return matchRule({ pipelineType, doubleSize, brand, type: 'doubleTee' }, fittingRulesData.rules) || null;
}

export function resolveJuxianDoubleElbow({ pipelineType, doubleSize, brand }) {
  return matchRule({ pipelineType, doubleSize, brand, type: 'doubleElbow' }, fittingRulesData.rules) || null;
}
