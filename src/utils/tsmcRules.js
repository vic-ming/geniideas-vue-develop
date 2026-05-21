import pipeRulesData from '@/assets/export/tsmc_pipe_rules.json';
import { matchRule } from '@/utils/ruleMatcher';
import valveRulesData from '@/assets/export/tsmc_valve_rules.json';
import otherRulesData from '@/assets/export/tsmc_other_rules.json';
import fittingRulesData from '@/assets/export/tsmc_fitting_rules.json';

export const PIPELINE_TYPE = {
  SINGLE: '單套管',
  DOUBLE: '雙套管',
  FLEX: '軟管'
};

export const unmatchedPipeRules = pipeRulesData.unmatched ?? [];

const normalizeMaterial = (material = '') => material.trim();
const normalizeSize = (size = '') => size.trim();

export function resolvePipePart({ pipelineType, size, material, doubleSize }) {
  if (!pipelineType) return null;

  const result = matchRule({
    pipelineType,
    size,
    material,
    doubleSize
  }, pipeRulesData.rules);

  if (result && pipelineType === PIPELINE_TYPE.DOUBLE) {
    return {
      inner: result.inner,
      outer: result.outer
    };
  }

  return result ? result.partName : null;
}

export function hasPipeRule({ pipelineType, size, material, doubleSize }) {
  const result = resolvePipePart({ pipelineType, size, material, doubleSize });
  if (!result) return false;
  if (pipelineType === PIPELINE_TYPE.DOUBLE) {
    return Boolean(result.inner && result.outer);
  }
  return Boolean(result);
}

// ==================== Valve rules ====================

export function resolveValvePart({ connector, size, valveType }) {
  return matchRule({
    connector,
    size,
    valveType
  }, valveRulesData.rules) || null;
}

// ==================== Other rules ====================

export function resolveStopSpacerPart({ doubleSize }) {
  return matchRule({ doubleSize }, otherRulesData.stopSpacer) || null;
}

export function resolveSpringPart({ doubleSize }) {
  return matchRule({ doubleSize }, otherRulesData.spring) || null;
}

export function resolveOverTubePart({ doubleSize }) {
  return matchRule({ doubleSize }, otherRulesData.overTube) || null;
}

export function resolveGaugePart({ panelSize, panelConnector, material }) {
  return matchRule({ panelSize, panelConnector, material }, otherRulesData.gauge) || null;
}

export function resolveGlandPart({ panelSize, panelConnector, material }) {
  return matchRule({ panelSize, panelConnector, material }, otherRulesData.gland) || null;
}

export function resolveNutPart({ panelSize, panelConnector, material }) {
  return matchRule({ panelSize, panelConnector, material }, otherRulesData.nut) || null;
}

export function resolveGasketPart({ panelSize, panelConnector, material }) {
  return matchRule({ panelSize, panelConnector, material }, otherRulesData.gasket) || null;
}

// ==================== Fitting rules ====================
export const unmatchedFittingRules = fittingRulesData.unmatched ?? [];

export function resolveFittingPart({ connector, fittingType, size, material, doubleSize, pipelineType }) {
  if (!fittingType) return null;

  const result = matchRule({
    pipelineType,
    connector,
    fittingType,
    size,
    material,
    doubleSize
  }, fittingRulesData.rules);

  if (result && pipelineType === PIPELINE_TYPE.DOUBLE) {
    return {
      inner: result.inner,
      outer: result.outer
    };
  }

  return result ? result.partName : null;
}

export function hasFittingRule({ connector, fittingType, size, material, doubleSize, pipelineType }) {
  const result = resolveFittingPart({ connector, fittingType, size, material, doubleSize, pipelineType });
  if (!result) return false;

  if (pipelineType === PIPELINE_TYPE.DOUBLE) {
    return Boolean(result.inner && result.outer);
  }

  return Boolean(result);
}

// Helper wrappers for App.vue legacy calls
export function resolveElbowPart({ size, material }) {
  const result = resolveFittingPart({
    connector: 'WELD',
    fittingType: '90 DI ELBOW',
    size,
    material,
    pipelineType: PIPELINE_TYPE.SINGLE
  });
  if (!result) return null;
  return {
    partName: typeof result === 'string' ? result : (result.partName || null),
    unit: 'EA',
    divisor: 3,
    round: 'ceil'
  };
}

export function resolveReducerTeePart({ mainSize, branchSize, material }) {
  const size = `${mainSize}x${branchSize}`;
  const result = resolveFittingPart({
    connector: 'WELD',
    fittingType: 'REDUCING TEE',
    size,
    material,
    pipelineType: PIPELINE_TYPE.SINGLE
  });
  return result ? { partName: typeof result === 'string' ? result : result.partName, unit: 'EA' } : null;
}

export function resolveReducerPart({ fromSize, toSize, material }) {
  const size = `${fromSize}x${toSize}`;
  const result = resolveFittingPart({
    connector: 'WELD',
    fittingType: 'REDUCER',
    size,
    material,
    pipelineType: PIPELINE_TYPE.SINGLE
  });
  return result ? { partName: typeof result === 'string' ? result : result.partName, unit: 'EA' } : null;
}

export function resolveTsmcDoubleElbowPart({ doubleSize }) {
  const result = resolveFittingPart({
    fittingType: '90 DI ELBOW',
    doubleSize,
    pipelineType: PIPELINE_TYPE.DOUBLE
  });
  return result ? { inner: result.inner, outer: result.outer, unit: 'EA' } : null;
}

export function resolveTsmcDoubleTeePart({ doubleSize }) {
  const result = resolveFittingPart({
    fittingType: 'TEE',
    doubleSize,
    pipelineType: PIPELINE_TYPE.DOUBLE
  });
  return result ? { partName: result.partName, inner: result.inner, outer: result.outer, unit: 'EA' } : null;
}
