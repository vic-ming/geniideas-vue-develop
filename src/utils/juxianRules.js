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

  if (pipelineType === '雙套管') {
    const inner = matchRule({
      pipelineType: '單套管',
      size,
      material,
      brand
    }, pipeRulesData.rules);

    const outerSizeMatch = doubleSize ? doubleSize.split('*')[0] : '';
    const outerSize = outerSizeMatch || size;
    let outerMaterial = material;
    if (material.includes('316L EP')) outerMaterial = material.replace('316L EP', '304L AP');
    else if (material.includes('316L BA')) outerMaterial = material.replace('316L BA', '304L AP');

    const outer = matchRule({
      pipelineType: '單套管',
      size: outerSize,
      material: outerMaterial,
      brand
    }, pipeRulesData.rules);

    if (inner && outer) {
      return { inner, outer };
    }
  }

  return matchRule({
    pipelineType,
    size,
    material,
    brand,
    doubleSize
  }, pipeRulesData.rules) || null;
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
  return matchRule({ panelSize, panelConnector, material, brand, section: 'gauge' }, otherRulesData.rules) || null;
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
