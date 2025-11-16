const DEFAULT_CANVAS_WIDTH = 2200;
const DEFAULT_MODULE_HEIGHT = 520;
const DEFAULT_MARGIN = 80;
const SOURCE_BLOCK_WIDTH = 420;
const SOURCE_BLOCK_HEIGHT = 260;
const GAP_SOURCE_TO_MAIN = 100;
const VALVE_SPACING = 120;
const VALVE_SIZE = 70;
const BRANCH_SPACING = 200;
const BOX_WIDTH = 420;
const BOX_HEIGHT = 140;

const FONT_PRIMARY = '28px "Microsoft JhengHei", "微軟正黑體", Arial';
const FONT_SECONDARY = '26px "Microsoft JhengHei", "微軟正黑體", Arial';

function drawTextBlock(ctx, lines, x, y, options = {}) {
  if (!lines || lines.length === 0) return;
  const {
    font = FONT_PRIMARY,
    color = '#1f1f1f',
    lineHeight = 34,
    maxWidth = null
  } = options;

  ctx.fillStyle = color;
  ctx.font = font;
  lines.forEach((line, index) => {
    const text = line ?? '';
    if (!text) {
      return;
    }
    const drawY = y + index * lineHeight;
    if (maxWidth && ctx.measureText(text).width > maxWidth) {
      wrapText(ctx, text, x, drawY, maxWidth, lineHeight);
    } else {
      ctx.fillText(text, x, drawY);
    }
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  words.forEach((char) => {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line !== '') {
    ctx.fillText(line, x, currentY);
  }
}

function drawValveSymbol(ctx, centerX, centerY, size, label) {
  const half = size / 2;
  const height = size * 0.9;
  ctx.beginPath();
  ctx.moveTo(centerX - half, centerY - height / 2);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX - half, centerY + height / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + half, centerY - height / 2);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX + half, centerY + height / 2);
  ctx.closePath();
  ctx.stroke();

  if (label) {
  ctx.font = '24px "Microsoft JhengHei", "微軟正黑體", Arial';
    ctx.fillStyle = '#1f1f1f';
    ctx.fillText(label, centerX - half, centerY - height / 2 - 14);
  }
}

function buildSourceLines(source = {}, settings = {}) {
  const lines = [];
  if (settings.machineName) lines.push(`機台名稱：${settings.machineName}`);
  if (settings.locationId) lines.push(`Location ID：${settings.locationId}`);
  if (settings.customer) lines.push(`客戶：${settings.customer}`);
  if (source.title) lines.push(source.title);
  const pipelineLine = [source.pipelineType, source.gasType].filter(Boolean).join(' / ');
  if (pipelineLine) lines.push(pipelineLine);
  const valveLine = [source.valveNumber, source.sourceSize].filter(Boolean).join(' / ');
  if (valveLine) lines.push(valveLine);
  if (source.heatInsulation) lines.push('保溫加熱');
  if (source.locationInfo) lines.push(source.locationInfo);
  return lines;
}

function buildPipelineLabel(pipeline = {}, floor = {}) {
  const text = [];
  if (pipeline.length) text.push(`${pipeline.length}M`);
  if (pipeline.material) text.push(pipeline.material);
  if (floor.sourceFloor || floor.equipmentFloor) {
    text.push([floor.sourceFloor, floor.equipmentFloor].filter(Boolean).join(' → '));
  }
  return text.join(' ');
}

function buildEquipmentLines(equipment = {}, panel = {}, options = {}) {
  const lines = [];
  const { index } = options;
  const titleParts = [];
  if (panel && panel.enablePanel) {
    if (panel.backPipelineType) titleParts.push(panel.backPipelineType);
    if (panel.size) titleParts.push(panel.size);
    if (panel.valveConnector) titleParts.push(panel.valveConnector);
  }
  const equipmentLine = [equipment.size, equipment.connector].filter(Boolean).join(' / ');
  const gasLine = [equipment.gasType, equipment.threeInOne].filter(Boolean).join(' / ');
  if (typeof index === 'number') {
    lines.push(`設備 ${index + 1}`);
  }
  if (titleParts.length) lines.push(titleParts.join(' / '));
  if (equipmentLine) lines.push(equipmentLine);
  if (gasLine) lines.push(gasLine);
  if (equipment.connectionName) lines.push(equipment.connectionName);
  return lines.filter(Boolean);
}

function drawEquipmentBranch(ctx, options) {
  const {
    branchIndex,
    mainLineY,
    branchStartX,
    boxLeft,
    boxWidth,
    boxHeight,
    branchSpacing,
    lines
  } = options;

  const branchY = branchIndex === 0 ? mainLineY : mainLineY + branchSpacing * branchIndex;

  ctx.beginPath();
  ctx.moveTo(branchStartX, branchIndex === 0 ? mainLineY : mainLineY);
  if (branchIndex > 0) {
    ctx.lineTo(branchStartX, branchY);
  }
  ctx.lineTo(boxLeft, branchY);
  ctx.stroke();

  const top = branchY - boxHeight / 2;
  ctx.strokeRect(boxLeft, top, boxWidth, boxHeight);

  drawTextBlock(ctx, lines, boxLeft + 20, top + 40, {
    font: FONT_SECONDARY,
    lineHeight: 30,
    maxWidth: boxWidth - 40
  });
}

function drawModule(ctx, moduleSet, options) {
  const {
    width,
    offsetY,
    margin,
    settings
  } = options;

  const source = moduleSet?.source?.data || {};
  const pipeline = moduleSet?.pipeline?.data || {};
  const floor = moduleSet?.floor?.data || {};
  const valves = moduleSet?.valveCards || [];
  const panelEquipmentGroups = moduleSet?.panelEquipmentGroups || [];

  const sourceX = margin;
  const sourceY = offsetY;

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1f1f1f';
  ctx.strokeRect(sourceX, sourceY, SOURCE_BLOCK_WIDTH, SOURCE_BLOCK_HEIGHT);

  const sourceLines = buildSourceLines(source, settings);
  drawTextBlock(ctx, sourceLines, sourceX + 20, sourceY + 40, {
    font: FONT_PRIMARY,
    lineHeight: 34,
    maxWidth: SOURCE_BLOCK_WIDTH - 40
  });

  const mainLineY = sourceY + SOURCE_BLOCK_HEIGHT / 2;
  let currentX = sourceX + SOURCE_BLOCK_WIDTH + GAP_SOURCE_TO_MAIN;

  // Draw valves
  if (valves.length) {
    valves.forEach((valveCard, index) => {
      const valveCenterX = currentX + VALVE_SPACING * index + VALVE_SPACING / 2;
      drawValveSymbol(
        ctx,
        valveCenterX,
        mainLineY,
        VALVE_SIZE,
        valveCard?.data?.size || valveCard?.data?.connectorType || ''
      );
    });
    currentX += VALVE_SPACING * valves.length + VALVE_SPACING / 2;
  }

  const branchAnchorX = width - margin - BOX_WIDTH - 80;

  ctx.beginPath();
  ctx.moveTo(currentX, mainLineY);
  ctx.lineTo(branchAnchorX, mainLineY);
  ctx.stroke();

  const pipelineLabel = buildPipelineLabel(pipeline, floor);
  if (pipelineLabel) {
    ctx.font = '26px "Microsoft JhengHei", "微軟正黑體", Arial';
    ctx.fillStyle = '#1f1f1f';
    const textWidth = ctx.measureText(pipelineLabel).width;
    const textX = currentX + (branchAnchorX - currentX - textWidth) / 2;
    ctx.fillText(pipelineLabel, textX, mainLineY - 28);
  }

  // Build equipment rows
  const equipmentRows = [];

  panelEquipmentGroups.forEach((group) => {
    if (group?.equipment?.data) {
      equipmentRows.push({
        equipment: group.equipment.data,
        panel: group.panel?.data
      });
    }
    if (group?.additionalEquipmentCards?.length) {
      group.additionalEquipmentCards.forEach((additional) => {
        equipmentRows.push({
          equipment: additional?.data || {},
          panel: group.panel?.data
        });
      });
    }
  });

  if (!equipmentRows.length) {
    // Add placeholder to avoid empty layout
    equipmentRows.push({
      equipment: {},
      panel: {}
    });
  }

  equipmentRows.forEach((row, index) => {
    const lines = buildEquipmentLines(row.equipment, row.panel, { index });
    drawEquipmentBranch(ctx, {
      branchIndex: index,
      mainLineY,
      branchStartX: branchAnchorX,
      boxLeft: width - margin - BOX_WIDTH,
      boxWidth: BOX_WIDTH,
      boxHeight: BOX_HEIGHT,
      branchSpacing: BRANCH_SPACING,
      lines
    });
  });
}

function renderFlowchartSegmentToDataURL(moduleSets = [], options = {}) {
  if (typeof document === 'undefined' || !Array.isArray(moduleSets)) {
    return null;
  }

  const width = options.width || DEFAULT_CANVAS_WIDTH;
  const margin = options.margin || DEFAULT_MARGIN;
  const moduleHeight = options.moduleHeight || DEFAULT_MODULE_HEIGHT;
  const settings = options.settings || {};

  const totalHeight = Math.max(
    moduleSets.length * moduleHeight + margin * 2,
    1000
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);
  ctx.strokeStyle = '#1f1f1f';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  moduleSets.forEach((moduleSet, index) => {
    const offsetY = margin + index * moduleHeight;
    drawModule(ctx, moduleSet, {
      width,
      margin,
      offsetY,
      settings
    });
  });

  return canvas.toDataURL('image/png');
}

function splitModuleSets(moduleSets = [], pageBreaks = []) {
  if (!Array.isArray(moduleSets) || moduleSets.length === 0) {
    return [];
  }

  const breaks = Array.from(new Set(pageBreaks))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < moduleSets.length - 1)
    .sort((a, b) => a - b);

  const segments = [];
  let startIndex = 0;

  breaks.forEach((breakIndex) => {
    const endIndex = breakIndex + 1;
    if (endIndex > startIndex) {
      segments.push(moduleSets.slice(startIndex, endIndex));
      startIndex = endIndex;
    }
  });

  if (startIndex < moduleSets.length) {
    segments.push(moduleSets.slice(startIndex));
  }

  return segments;
}

export function renderFlowchartPages(moduleSets = [], pageBreaks = [], options = {}) {
  if (typeof document === 'undefined') {
    return [];
  }

  const segments = splitModuleSets(moduleSets, pageBreaks);
  const targetSegments = segments.length > 0 ? segments : [moduleSets];

  return targetSegments
    .map((segment) => renderFlowchartSegmentToDataURL(segment, options))
    .filter((dataUrl) => !!dataUrl);
}


